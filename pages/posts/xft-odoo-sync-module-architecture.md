---
title: 薪福通与 Odoo 19 同步实战（一）：模块架构与同步引擎
date: 2026-06-02 10:00:00
updated: 2026-06-02 10:00:00
tags: [Odoo, Python, 薪福通, ERP, 同步]
categories:
  - 牛排的小项目
---

公司用薪福通管人事、用 Odoo 19 管内部运营，两边数据割裂的问题是 IT 部绕不开的痛点：员工入职、离职、调岗、换部门，每一边都要手动同步一遍，口径不一致时排查起来极其痛苦。

最近花了两周做了一个单向同步模块 `hr_xft_sync`，把薪福通员工花名册全量拉到 Odoo 员工模块里，薪福通作为唯一主数据来源。整个模块跑在 Odoo 19 上，不修改 Odoo 核心代码，纯自定义模块开发。这篇把模块架构、模型设计、同步引擎和踩过的坑完整记录一遍。

<!-- more -->

> 本文是薪福通与 Odoo 19 同步系列的第一篇，国密加解密和职位映射的部分分别在前后篇。

## 1. 模块全貌

先看目录结构：

```text
hr_xft_sync/
  __manifest__.py
  models/
    hr_employee.py         # 扩展 hr.employee，加 30+ 个薪福通字段
    hr_department.py       # 扩展 hr.department，加 xft_managed 标记
    hr_job.py              # 扩展 hr.job，加薪福通职位编码
    xft_sync_config.py     # 核心：同步配置 + 同步引擎（880 行）
    xft_sync_log.py        # 同步日志模型
    xft_job_import_wizard.py  # 职位映射表导入向导
  views/                   # 5 个 XML 视图文件
  security/                # 仅 HR 管理员可访问配置和日志
  data/
    ir_cron_data.xml       # 定时任务
```

模块依赖 `hr` 和 `mail`，Python 侧额外依赖 `gmssl`（国密加解密）和 `openpyxl`（xlsx 读取）。

## 2. 五个模型各司其职

### 2.1 `xft.sync.config` —— 配置中心 + 同步引擎

这是整个模块的核心，880 行代码集中在这一个文件。它既承担配置存储，又承担同步执行逻辑。

配置项覆盖了薪福通对接需要的所有参数：

```python
class XftSyncConfig(models.Model):
    _name = "xft.sync.config"

    xft_app_id = fields.Char(string="薪福通应用ID", required=True)
    xft_app_secret = fields.Char(string="薪福通应用密钥", required=True)
    xft_project_code = fields.Char(string="薪福通企业号")
    xft_api_base_url = fields.Char(default="https://api.cmbchina.com")
    xft_roster_endpoint = fields.Char(default="/hrm/hrm2/xft-employeeprofile/...")
    sync_mode = fields.Selection([("manual", "手动"), ("scheduled", "定时")])
    sync_interval_minutes = fields.Integer(default=60)
    page_size = fields.Integer(default=200)
    # ... 还有超时、日志保留天数等
```

一个比较实用的设计是 **配置变更后自动同步 cron 间隔**：当管理员在配置页改了"同步间隔（分钟）"，`write()` 方法会直接更新 `ir.cron` 的调度频率，避免配置和实际调度不一致。

```python
def write(self, vals):
    res = super().write(vals)
    if 'sync_interval_minutes' in vals:
        self._sync_cron_interval()
    return res
```

### 2.2 `hr.employee` 扩展 —— 30+ 个字段

在 Odoo 标准员工模型上扩展了完整的人事字段：

| 字段分组 | 代表字段 | 说明 |
|---------|---------|------|
| 同步主键 | `xft_staff_seq`, `xft_employee_code` | `stfSeq` 做唯一键，`stfNumber` 只做展示 |
| 基础信息 | `xft_employee_status`, `xft_certificate_type` | 员工状态、证件类型 |
| 岗位信息 | `xft_job_code`, `xft_pos_code`, `xft_cost_center` | 职务编码、岗位、成本中心 |
| 入离职 | `xft_entry_date`, `xft_quit_type`, `xft_quit_reason` | 入职日期、离职类型/原因 |
| 银行社保 | `xft_bank_card_account`, `xft_social_security_account` | 银行卡、社保、公积金 |
| 退休 | `xft_plan_retire_date`, `xft_retire_age` | 计划退休日期和年龄 |
| 原始数据 | `xft_raw_payload` | 完整保存薪福通返回的 JSON |

敏感字段（证件号、银行卡、社保、公积金、原始报文）全部加了 `groups="hr.group_hr_user"`，普通用户看不到。

### 2.3 `hr.department` 扩展 —— 薪福通维护标记

只加了两个字段：

```python
xft_managed = fields.Boolean(string="薪福通维护", default=False)
xft_source_key = fields.Char(string="薪福通来源键")
```

这两个字段是部门自动增删的关键——只有 `xft_managed=True` 的部门才会被同步引擎管理，手动创建的部门不受影响。后面第三篇会详细讲部门同步策略。

### 2.4 `hr.job` 扩展 + `xft.sync.log`

职位模型扩展了 `xft_job_code`（职位编码），加了唯一约束：

```python
_sql_constraints = [
    ("xft_job_code_unique", "unique(xft_job_code)", "薪福通职位编码不能重复。"),
]
```

日志模型 `xft.sync.log` 记录每次同步的触发方式、状态、员工/部门处理数量和耗时，支持按状态和触发方式筛选。

## 3. 同步引擎核心流程

`_run_sync()` 是同步的入口方法，流程非常直接：

```python
def _run_sync(self, trigger_mode="manual", raise_on_error=False):
    # 1. 创建日志
    log = self.env["xft.sync.log"].create({...})

    try:
        # 2. 全量拉取花名册
        records = self._fetch_roster_records()
        # 3. 先同步部门
        dept_result = self._sync_departments_from_roster(records)
        # 4. 再同步员工
        emp_result = self._sync_employees_from_roster(records, dept_result["dept_map"])
        # 5. 写成功日志
    except Exception as exc:
        # 6. 写失败日志，手动模式抛出 UserError
```

执行顺序很重要：**先部门后员工**，因为员工写入时需要引用 `dept_map` 做部门关联。

### 3.1 全量分页拉取

`_fetch_roster_records()` 负责分页拉取薪福通花名册：

```python
def _fetch_roster_records(self):
    records = []
    page = 1
    max_pages = 200  # 安全阀，防止死循环

    while page <= max_pages:
        request_payload = self._build_query_payload(page)
        url, headers, request_body = self._build_signed_post_request(request_payload)
        response = requests.post(url, headers=headers, data=request_body.encode("utf-8"), timeout=timeout)
        payload = self._decode_xft_response(response)
        current_records = self._xft_extract_records(payload)
        records.extend(current_records)

        if not self._xft_has_more_pages(payload, page, len(current_records)):
            break
        page += 1

    return records
```

这里有几个值得注意的点：

1. **不在拉取阶段过滤在职/离职**。全量拉，后续写入时统一处理状态。
2. **`max_pages = 200` 是安全阀**。如果分页判断逻辑出 bug，最多拉 200 页就会停，不会无限循环。
3. **分页判断做了多层兼容**。薪福通的接口在不同版本返回的分页结构不一样（`body.totalSize` / `has_more` / `totalPage`），`_xft_has_more_pages()` 按优先级逐一尝试。

### 3.2 幂等写入与主键策略

这是整个同步里最关键的设计决策。

**为什么用 `stfSeq` 而不是 `stfNumber` 做唯一键？**

因为薪福通存在两种 `stfNumber` 重复的场景：

- **共用工号**：同一个工号被多个人使用
- **离职后重新入职**：同一个人可能拿到相同的工号，但 `stfSeq` 是新的

用 `stfSeq` 做唯一键，可以干净地处理这些情况。`stfNumber` 只保存到 `xft_employee_code` 做业务展示。

写入时的查找逻辑：

```python
# 优先按 stfSeq 查找
if staff_seq:
    lookup_domain = [("xft_staff_seq", "=", str(staff_seq))]
# 旧数据迁移：如果工号唯一且本地旧记录唯一，按工号回填
elif code:
    lookup_domain = [("xft_employee_code", "=", str(code))]
# 最后的兜底
elif email:
    lookup_domain = [("work_email", "=", email)]
```

旧数据迁移的处理比较谨慎：先统计花名册中有多少重复工号，只有非重复工号的旧员工才允许按工号回填 `stfSeq`：

```python
duplicate_codes = self._get_duplicate_employee_codes(records)

def _find_single_legacy_employee_by_code(self, Employee, code, duplicate_codes):
    if code in duplicate_codes:
        return Employee.browse()  # 重复工号，跳过
    candidates = Employee.search([
        ("xft_staff_seq", "=", False),
        ("xft_employee_code", "=", code),
    ], limit=2)
    return candidates if len(candidates) == 1 else Employee.browse()
```

### 3.3 同步后归档缺失员工

每次同步完成后，做一次"对账"——薪福通花名册里没有的、但 Odoo 里还 active 的薪福通员工，全部归档：

```python
def _archive_absent_xft_employees(self, active_staff_seqs, now_dt):
    domain = [("xft_staff_seq", "!=", False), ("active", "=", True)]
    if active_staff_seqs:
        domain.append(("xft_staff_seq", "not in", active_staff_seqs))
    employees = Employee.search(domain)

    # 非薪福通员工也要归档（除了 Administrator）
    non_xft = self._get_non_xft_employees_to_archive()
    employees |= non_xft

    if employees:
        employees.write({"active": False})
    return len(employees)
```

Administrator 管理员员工做了特殊保留——通过 `base.user_admin` 排除，避免把系统管理员也归档了。

### 3.4 员工状态映射

薪福通的 `stfStatus` 映射非常直接：`1` 为在职，其他全部归档。

```python
is_active = str(status).strip() == "1"
values["active"] = is_active
```

## 4. 调度：手动 + 定时双模式

定时任务通过 `ir.cron` 实现：

```xml
<record id="ir_cron_xft_sync_roster" model="ir.cron">
    <field name="name">薪福通员工花名册定时同步</field>
    <field name="code">model.cron_sync_roster()</field>
    <field name="interval_number">5</field>
    <field name="interval_type">minutes</field>
</record>
```

`cron_sync_roster()` 遍历所有启用的定时配置，判断是否到期：

```python
@api.model
def cron_sync_roster(self):
    configs = self.search([("active", "=", True), ("sync_mode", "=", "scheduled")])
    now = fields.Datetime.now()
    for config in configs:
        if config._is_due_for_scheduled_sync(now):
            config._run_sync(trigger_mode="scheduled", raise_on_error=False)
```

手动同步和定时同步的唯一区别是 `raise_on_error`：手动模式失败时弹出 `UserError` 告诉管理员；定时模式只写失败日志，不阻断 cron 执行。

## 5. 视图定制

### 5.1 员工列表默认筛选在职

通过覆盖 `ir.actions.act_window` 的 context，让员工列表打开时自动带上"在职员工"筛选：

```xml
<record id="hr.open_view_employee_list_my" model="ir.actions.act_window">
    <field name="context">
        {'search_default_xft_current_employee': 1}
    </field>
</record>
```

这个效果很直观：HR 打开员工列表，第一眼看到的就是当前在职的人，不用每次手动过滤。

### 5.2 搜索视图加薪福通筛选

在员工搜索视图里插入了几个快捷筛选：

- **在职员工**：`active = True`
- **薪福通在职**：`xft_employee_status = '1'`
- **薪福通离职**：`xft_employee_status = '2'`
- **薪福通员工**：`xft_staff_seq != False`
- **按薪福通状态分组**

### 5.3 员工表单加"薪福通信息"页签

在员工表单的工作信息页后面加了一个完整的"薪福通信息"页签，分基础信息、岗位信息、入离职信息、银行社保、退休信息、同步信息、原始报文七个区块，全部只读，仅 HR 用户可见。

### 5.4 配置页菜单

配置入口挂在员工应用的配置菜单下：

```xml
<menuitem id="menu_xft_sync_root"
          name="配置-薪福通数据同步"
          parent="hr.menu_human_resources_configuration"
          groups="hr.group_hr_manager"/>
```

配置表单的 header 放了三个快捷按钮：**立即同步**、**导入职位映射表**、**查看日志**，加上一个状态栏显示当前同步状态（idle / running / success / failed）。

## 6. 权限设计

整个模块的权限遵循一个原则：**配置和日志只有 HR 管理员能碰，敏感字段只有 HR 用户能看**。

`ir.model.access.csv` 里只授权了 `hr.group_hr_manager`：

```csv
access_xft_sync_config_hr_manager,model_xft_sync_config,hr.group_hr_manager,1,1,1,1
access_xft_sync_log_hr_manager,model_xft_sync_log,hr.group_hr_manager,1,1,1,1
access_xft_job_import_wizard_hr_manager,model_xft_job_import_wizard,hr.group_hr_manager,1,1,1,1
```

字段级别上，银行卡号、社保账号、证件号、原始报文等全部加了 `groups="hr.group_hr_user"`，普通员工看自己的档案时看不到这些。

## 7. 实测数据

| 指标 | 数值 |
|------|------|
| 薪福通员工总数 | 614 |
| 薪福通在职员工 | 160 |
| 薪福通职位数 | 130 |
| 有 jobCode 的员工 | 580 |
| 已写入 job_id 的员工 | 580（匹配率 100%） |
| 非薪福通 active 员工 | 1（仅 Administrator） |
| 共用工号样本 | KC0104、KC1091（均按不同 stfSeq 保留） |

模块在 Odoo 19 测试库 `odoo19_test_20260327_004543` 上验证通过，重复执行同步不会重复创建员工。

## 8. 小结

整个模块的核心设计决策：

1. **单向同步**：薪福通 -> Odoo，不做反向，避免双向冲突。
2. **`stfSeq` 做唯一键**：干净处理共用工号和离职重入职。
3. **全量拉取 + 幂等写入**：不用增量差量，每次全量对账，简单可靠。
4. **先部门后员工**：保证员工写入时部门已就绪。
5. **敏感字段按权限隔离**：证件、银行卡、社保、原始报文仅 HR 可见。

下一篇讲薪福通 API 的国密加解密全链路实现——SM4 报文加解密、SM3 摘要、SM2 签名，这是对接薪福通最绕也最容易踩坑的部分。
