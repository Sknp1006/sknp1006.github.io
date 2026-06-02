---
title: 薪福通与 Odoo 19 同步实战（三）：职位映射导入与部门自动维护
date: 2026-06-02 12:00:00
updated: 2026-06-02 12:00:00
tags: [Odoo, Python, 薪福通, 数据治理, Excel导入]
categories:
  - 牛排的小项目
---

同步员工花名册到 Odoo 之后，还差两块拼图：一是员工身上的 `jobCode` 需要映射到 Odoo 标准岗位 `hr.job`，二是员工的部门信息需要自动维护到 `hr.department`。这两件事的实现都不复杂，但在数据治理上各有讲究。

这篇把职位映射表导入向导、部门自动增删策略、以及一些辅助设计（手机号兜底、日志清理、搜索筛选）完整过一遍，作为整个系列的收尾。

<!-- more -->

> 本文是薪福通与 Odoo 19 同步系列的第三篇，模块架构和国密加解密分别在前两篇。

## 1. 职位映射：为什么要单独做

薪福通花名册里的 `jobCode` 只是一个编码字符串，比如 `"J0023"`。如果直接把这个编码存到员工的 `job_title` 字段，HR 看到的就是满屏的编码而不是岗位名称。

做法是把薪福通的职位体系独立维护到 Odoo 标准模型 `hr.job` 里，员工同步时按 `jobCode` 查找对应的 `hr.job` 记录，写入员工的 `job_id` 和 `job_title`。

数据来源是一份 xlsx 格式的职位映射表，由 HR 从薪福通后台导出后手动上传。

## 2. 职位模型扩展

先给 `hr.job` 加薪福通相关字段：

```python
class HrJob(models.Model):
    _inherit = "hr.job"

    xft_job_code = fields.Char(string="薪福通职位编码", index=True)
    xft_job_status = fields.Char(string="薪福通职位状态")
    xft_job_sequence = fields.Integer(string="薪福通职位顺序号")
    xft_job_description = fields.Text(string="薪福通职位描述")
    xft_job_note = fields.Char(string="薪福通职位备注")
    xft_job_managed = fields.Boolean(string="薪福通职位")

    _sql_constraints = [
        ("xft_job_code_unique", "unique(xft_job_code)", "薪福通职位编码不能重复。"),
    ]
```

`xft_job_code` 加了唯一约束——一个编码对应一个岗位，不能有歧义。`xft_job_managed` 标记这个岗位是从薪福通导入的，和手动创建的岗位做区分。

在岗位表单视图里加了一个"薪福通"页签，展示映射信息，仅 HR 管理员可见：

```xml
<page string="薪福通" name="xft_job_mapping" groups="hr.group_hr_manager">
    <group>
        <field name="xft_job_managed" readonly="1"/>
        <field name="xft_job_code"/>
        <field name="xft_job_status"/>
        <field name="xft_job_sequence"/>
        <field name="xft_job_note"/>
    </group>
    <group string="职位描述">
        <field name="xft_job_description" nolabel="1"/>
    </group>
</page>
```

搜索视图也加了"薪福通职位编码"搜索字段和"薪福通职位"快捷筛选。

## 3. Excel 导入向导

### 3.1 TransientModel

Odoo 的向导用 `TransientModel` 实现——临时模型，数据不持久化，弹窗关闭后自动清理：

```python
class XftJobImportWizard(models.TransientModel):
    _name = "xft.job.import.wizard"

    upload_file = fields.Binary(string="职位映射表", required=True)
    upload_filename = fields.Char(string="文件名")
```

### 3.2 xlsx 解析

用 `openpyxl` 读取上传的 xlsx 文件。Odoo 里上传的文件以 base64 存储在 `Binary` 字段里：

```python
def _load_workbook(self):
    data = base64.b64decode(self.upload_file)
    return openpyxl.load_workbook(io.BytesIO(data), data_only=True)
```

`data_only=True` 确保读取单元格的值而不是公式。

### 3.3 表头自动识别

职位映射表的列名可能因导出时间不同有微小差异，导入时做了表头别名映射：

```python
HEADER_ALIASES = {
    "职位编码": "code",
    "职位名称": "name",
    "顺序号": "sequence",
    "职位状态": "status",
    "职位描述": "description",
    "备注": "note",
}

def _build_header_map(self, header_row):
    header_map = {}
    for index, value in enumerate(header_row or []):
        text = self._cell_text(value)
        field_name = self.HEADER_ALIASES.get(text)
        if field_name:
            header_map[field_name] = index
    return header_map
```

按表头文字匹配列索引，不依赖固定列顺序。必填列（职位编码、职位名称）缺失时会报错。

### 3.4 导入逻辑

逐行处理，按职位编码做 upsert（有则更新，无则创建）：

```python
for row in rows:
    code = self._cell_text(self._row_value(row, header_map, "code"))
    name = self._cell_text(self._row_value(row, header_map, "name"))
    if not code or not name:
        skipped += 1
        continue

    status = self._cell_text(self._row_value(row, header_map, "status"))
    active = status in self.ENABLED_STATUSES

    job = Job.search([("xft_job_code", "=", code)], limit=1)
    if not job:
        # 编码没匹配到，尝试按名称匹配已有岗位
        candidates = Job.search([("xft_job_code", "=", False), ("name", "=", name)])
        job = candidates.filtered(
            lambda r: not r.company_id or r.company_id == company
        )[:1]

    if job:
        job.write(values)
        updated += 1
    else:
        Job.create(values)
        created += 1
```

两个值得注意的设计：

1. **状态映射**：`"已启用"` / `"启用"` / `"active"` / `""` 都视为启用状态，其他状态归档。空字符串也视为启用，是因为有些导出的表里状态列为空但岗位实际在用。

2. **名称兜底匹配**：当编码没有匹配到现有岗位时，尝试按职位名称匹配。这样可以利用 Odoo 里已经手动创建的岗位，避免重复创建——匹配成功后会补上 `xft_job_code`，下次导入就能直接按编码匹配了。

### 3.5 导入结果反馈

导入完成后弹出通知，显示新增/更新/跳过/归档的数量：

```python
message = _("职位映射导入完成：新增 %s，更新 %s，跳过 %s，归档 %s。") % (
    result["created"], result["updated"], result["skipped"], result["archived"],
)
return {
    "type": "ir.actions.client",
    "tag": "display_notification",
    "params": {
        "title": _("薪福通职位映射"),
        "message": message,
        "type": "success",
    },
}
```

实测数据：导入 130 条薪福通职位，580 名有 `jobCode` 的员工全部匹配成功写入 `job_id`，匹配缺失数为 0。

## 4. 员工同步时的岗位匹配

员工同步时，`_prepare_employee_values()` 从花名册里取 `jobCode`，调用 `_find_xft_job()` 查找对应岗位：

```python
def _find_xft_job(self, job_code):
    if not job_code:
        return self.env["hr.job"]
    return self.env["hr.job"].sudo().search(
        [("xft_job_code", "=", str(job_code).strip()), ("active", "=", True)],
        limit=1,
    )
```

匹配到已启用的岗位后，写入员工的标准字段：

```python
self._set_employee_value(values, "job_id", job.id if job else False)
self._set_employee_value(values, "job_title", job.name if job else False)
```

未匹配到也不阻断——员工的 `xft_job_code` 会保存下来，后续补充映射表后重新同步即可。

`_set_employee_value()` 做了一个安全检查：

```python
def _set_employee_value(self, values, field_name, value):
    if field_name in self.env["hr.employee"]._fields:
        values[field_name] = value
```

只在目标模型确实存在该字段时才写入，防止因为 Odoo 版本差异或自定义字段缺失导致整个同步崩掉。

## 5. 部门自动维护

### 5.1 为什么不调薪福通部门接口

薪福通有单独的部门接口，但本项目选择从员工花名册里的自定义字段"其他部门"（`FLD1100054`）来驱动部门。原因有两个：

1. **数据一致性**：员工关联的部门和部门列表来自同一个数据源，不会出现"员工在 A 部门但部门列表里没有 A"的情况。
2. **减少接口依赖**：少调一个接口就少一个出错点，也少一份鉴权和维护的工作量。

### 5.2 部门名称提取策略

从花名册记录里提取部门名称，按优先级尝试：

```python
def _extract_primary_department(self, item):
    basic = item.get("staffBasicInfo") or {}

    # 优先级 1：自定义字段 FLD1100054（"其他部门"）
    custom_departments = self._get_custom_field_values(item, field_keys=self.XFT_DEPARTMENT_FIELD_KEYS)
    if custom_departments:
        return custom_departments[0]

    # 优先级 2：orgName 或 orgFullName
    dept_name = self._pick(basic, ["orgName", "orgFullName"])
    if dept_name:
        return str(dept_name).strip()

    # 优先级 3：orgSeq 兜底
    dept_seq = self._pick(basic, ["orgSeq"])
    if dept_seq:
        return "部门-%s" % str(dept_seq).strip()

    return False
```

自定义字段的解析也做了兼容——值可能是逗号分隔的多个部门名，会拆分成列表：

```python
def _normalize_custom_field_value(self, custom):
    custom_val = self._pick(custom, ["fieldValue", "value", "content"])
    text = str(custom_val).replace("，", ",").replace(";", ",")
    return [part.strip() for part in text.split(",") if part.strip()]
```

中英文逗号和分号都做了统一替换，确保分隔逻辑一致。

### 5.3 部门增删策略

每次同步时，先收集本次花名册里所有出现的部门名称，然后做差量处理：

```python
def _sync_departments_from_roster(self, records):
    # 1. 收集所有部门名称
    dept_names = set()
    for item in records:
        primary = self._extract_primary_department(item)
        if primary:
            dept_names.add(primary)
        for dept in self._extract_other_departments(item):
            if dept:
                dept_names.add(dept)

    # 2. 创建或更新部门
    for dept_name in sorted(dept_names):
        source_key = dept_name.strip().lower()
        department = Department.search(
            ["|", ("xft_source_key", "=", source_key), ("name", "=", dept_name)],
            limit=1,
        )
        if not department:
            department = Department.create({
                "name": dept_name,
                "xft_managed": True,
                "xft_source_key": source_key,
            })
        else:
            department.write({"xft_managed": True, "xft_source_key": source_key})

    # 3. 删除本次未出现的薪福通维护部门
    obsolete = Department.search([
        ("xft_managed", "=", True),
        ("name", "not in", list(dept_names)),
    ])
    if obsolete:
        Employee.search([("department_id", "in", obsolete.ids)]).write({"department_id": False})
        obsolete.unlink()
```

关键设计点：

1. **`xft_managed` 标记保护手动部门**。只有被标记为薪福通维护的部门才会被自动删除，手动创建的部门不受影响。

2. **`xft_source_key` 做大小写不敏感匹配**。用 `dept_name.strip().lower()` 作为 source key，避免"技术部"和"技术部 "被当成两个部门。

3. **删除前清空员工关联**。先将要删除部门的员工部门置空，再删除部门，避免 ORM 的外键约束报错。

4. **兼职部门也纳入维护**。`_extract_other_departments()` 会从 `staffAdjunctInfoList`（兼职信息列表）里提取部门名称，确保兼职部门也会被创建和维护。

## 6. 辅助设计

### 6.1 手机号兜底办公电话

薪福通里有部分员工只填了手机号、没有办公电话。但 Odoo 的员工卡片默认展示 `work_phone`，如果为空就显示不出联系电话。

处理方式是在映射时做兜底：

```python
phone = self._pick(basic, ["telephoneNumber"])
mobile = self._pick(basic, ["mobileNumber"])
# ...
values["work_phone"] = phone or mobile or False
```

`telephoneNumber` 优先，没有就用 `mobileNumber` 兜底。同时 `mobileNumber` 也单独写入 `mobile_phone`，两个字段各存一份。

### 6.2 日期容错解析

薪福通返回的日期格式不统一，有 `"2024-01-15"` 也有 `"2024-01-15 00:00:00"`，偶尔还有空字符串。解析时做了容错：

```python
def _parse_xft_date(self, value):
    if not value:
        return False
    try:
        return fields.Date.to_date(str(value).strip()[:10])
    except ValueError:
        return False

def _parse_xft_datetime(self, value):
    if not value:
        return False
    try:
        return fields.Datetime.to_datetime(str(value).strip())
    except ValueError:
        return False
```

日期只取前 10 个字符（`YYYY-MM-DD`），时间直接解析完整字符串。解析失败返回 `False` 而不是抛异常，避免一条脏数据阻断整批同步。

### 6.3 性别和国籍映射

```python
def _map_gender(self, value):
    text = str(value or "").strip().lower()
    if text in {"m", "male", "man", "男", "0"}:
        return "male"
    if text in {"f", "female", "woman", "女", "1"}:
        return "female"
    if text in {"other", "其它", "其他"}:
        return "other"
    return False

def _find_country(self, code):
    text = str(code or "").strip()
    if not text:
        return self.env["res.country"].browse()
    return self.env["res.country"].search([("code", "=", text.upper())], limit=1)
```

性别做了中英文多值兼容（`"男"` / `"male"` / `"M"` / `"0"` 都能识别），国籍通过 ISO 国家代码匹配 Odoo 的 `res.country`。

### 6.4 原始报文保存

每个员工的同步都会保存完整的薪福通返回 JSON：

```python
values["xft_raw_payload"] = json.dumps(item, ensure_ascii=False, sort_keys=True) if item else False
```

这个字段用 `sort_keys=True` 确保字段顺序一致，方便前后对比。保存原始报文的目的是：当薪福通前端页面和接口返回的口径不一致时，可以直接查原始 JSON 定位差异。

### 6.5 日志自动清理

每次同步完成后，按配置的保留天数清理旧日志：

```python
def _cleanup_old_logs(self):
    cutoff = fields.Datetime.now() - timedelta(days=self.log_retention_days)
    old_logs = self.env["xft.sync.log"].search([
        ("config_id", "=", self.id),
        ("started_at", "<", cutoff),
    ])
    if old_logs:
        old_logs.unlink()
```

默认保留 30 天。日志只增不清的话，半年后日志表会膨胀到影响查询性能。

### 6.6 同步日志搜索

日志列表支持按状态（成功/失败）、触发方式（手动/定时）筛选，还支持按状态、触发方式、开始日期分组：

```xml
<filter string="成功" name="filter_success" domain="[('status', '=', 'success')]"/>
<filter string="失败" name="filter_failed" domain="[('status', '=', 'failed')]"/>
<filter string="手动" name="filter_manual" domain="[('trigger_mode', '=', 'manual')]"/>
<filter string="定时" name="filter_scheduled" domain="[('trigger_mode', '=', 'scheduled')]"/>
<filter string="按状态分组" name="group_status" context="{'group_by': 'status'}"/>
<filter string="按开始时间分组" name="group_started_at" context="{'group_by': 'started_at:day'}"/>
```

HR 管理员可以很方便地看到"最近有哪些定时同步失败了"。

## 7. 系列总结

三篇文章覆盖了 `hr_xft_sync` 模块的完整实现：

| 篇目 | 核心内容 |
|------|---------|
| [模块架构与同步引擎](/posts/xft-odoo-sync-module-architecture) | 5 个模型设计、stfSeq 主键策略、幂等写入、cron 调度、权限隔离 |
| [国密 SM2/SM3/SM4 全链路加解密](/posts/xft-odoo-sync-crypto-sm2-sm3-sm4) | SM4 ECB 加解密、SM3 摘要、SM2 签名、请求构造、响应解密、联调排查 |
| 职位映射与部门维护（本篇） | xlsx 导入向导、部门自动增删、手机号兜底、日期容错、日志清理 |

回过头看这个项目，有几个决策在实践中被验证是对的：

1. **全量拉取 > 增量差量**。员工数据量不大（614 条），全量拉取一次也就几秒钟，换来的是简单可靠的对账逻辑。增量差量虽然省流量，但要维护游标和状态，出 bug 时更难排查。

2. **先部门后员工**。保证员工写入时部门引用一定存在，避免了"先写员工、后建部门、再回填"的多轮修复。

3. **`stfSeq` 做唯一键**。实测 KC0104 和 KC1091 两个共用工号都按不同 `stfSeq` 保留了不同员工记录，离职重入职的场景也能正确处理。

4. **原始报文落库**。有几次薪福通前端显示和接口返回的字段值不一致，直接查 `xft_raw_payload` 就定位到了差异来源。

模块后续可能扩展的方向：接入薪福通的增量差量接口减少全量拉取频率、增加薪酬数据同步、对接考勤模块。这些等做了再写。
