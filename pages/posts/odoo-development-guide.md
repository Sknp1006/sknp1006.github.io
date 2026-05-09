---
title: Odoo 开发实战：从后端到前端的完整解析
date: 2026-05-09 14:00:00
updated: 2026-05-09 14:00:00
tags: [Odoo, Python, ERP, XML, MVC]
categories:
  - 牛排的小笔记
---

最近在公司 IT 部接触 Odoo 开发，从模型定义到视图布局、再到权限和记录规则，整套链路走下来发现 Odoo 这套"声明式 ERP 框架"的套路还是挺值得整理一份的。这篇就把我在内部知识库里沉淀的内容搬到博客上，权当一份自己以后翻、新人也能照着抄的速查手册。

<!-- more -->

## 一、Odoo 开发基础架构

Odoo 采用 **MVC 架构**（模型-视图-控制器），开发主要围绕三个核心部分：

- **后端模型**：定义数据结构和业务逻辑
- **前端视图**：定义用户界面展示
- **权限系统**：控制数据访问权限

## 二、后端开发详解

### 1. 模型定义基础

```python
from odoo import models, fields, api

class EstateProperty(models.Model):
    _name = "estate.property"
    _description = "房产信息"
```

- **`_name`**：模型唯一标识符，必须全局唯一，格式通常为小写字母加下划线
- **`_description`**：模型描述，用于文档和界面显示
- **`_inherit`**：可选属性，用于继承现有模型（如 `_inherit = "res.partner"`）

### 2. 字段类型与参数详解

#### 基本字段类型

1. **`fields.Char()`**：字符串字段
   - **`string`**：字段标签（界面显示名称）
   - **`required`**：是否必填（True/False）
   - **`default`**：默认值（可为函数）
   - **`size`**：最大长度限制

   ```python
   name = fields.Char(string="房产名称", required=True, size=100)
   ```

2. **`fields.Integer()`**：整数字段
   - **`string`**：字段标签
   - **`default`**：默认值
   - **`digits`**：显示位数（元组格式，如 `(16, 2)` 表示总 16 位，小数 2 位）

   ```python
   living_area = fields.Integer(string="居住面积(㎡)", default=0)
   ```

3. **`fields.Float()`**：浮点数字段
   - **`string`**：字段标签
   - **`digits`**：精度控制（如 `digits=(16, 2)` 表示保留两位小数）

   ```python
   price = fields.Float(string="价格(万元)", digits=(16, 2))
   ```

4. **`fields.Boolean()`**：布尔字段
   - **`string`**：字段标签
   - **`default`**：默认值（True/False）

   ```python
   is_available = fields.Boolean(string="是否可用", default=True)
   ```

5. **`fields.Date()` / `fields.Datetime()`**：日期/日期时间字段
   - **`string`**：字段标签
   - **`default`**：默认值（可为 `fields.Date.today` 等函数）

   ```python
   sale_date = fields.Date(string="销售日期", default=fields.Date.today)
   ```

6. **`fields.Text()`**：多行文本字段
   - **`string`**：字段标签
   - **`default`**：默认值

   ```python
   description = fields.Text(string="详细描述")
   ```

7. **`fields.Html()`**：HTML 格式文本字段
   - **`string`**：字段标签
   - **`sanitize`**：是否自动清理 HTML（默认 True）

   ```python
   notes = fields.Html(string="备注信息")
   ```

#### 关系字段类型

1. **`fields.Many2one()`**：多对一关系
   - **`comodel_name`**：关联模型名称
   - **`string`**：字段标签
   - **`ondelete`**：删除关联记录时的行为（'cascade'/'set null'/'restrict'）

   ```python
   owner_id = fields.Many2one(comodel_name="res.partner", string="业主", ondelete="cascade")
   ```

2. **`fields.One2many()`**：一对多关系
   - **`comodel_name`**：关联模型名称
   - **`inverse_name`**：关联模型中指向当前模型的字段名
   - **`string`**：字段标签

   ```python
   property_line_ids = fields.One2many(comodel_name="estate.property.line", inverse_name="property_id", string="房产明细")
   ```

3. **`fields.Many2many()`**：多对多关系
   - **`comodel_name`**：关联模型名称
   - **`relation`**：关系表名称（可选，自动生成）
   - **`column1`**：当前模型 ID 列名（可选）
   - **`column2`**：关联模型 ID 列名（可选）
   - **`string`**：字段标签

   ```python
   tag_ids = fields.Many2many(comodel_name="estate.property.tag", string="标签")
   ```

### 3. 计算字段详解

```python
total_area = fields.Integer(compute="_compute_total_area", store=True, string="总面积(㎡)")
```

- **`compute`**：计算方法名（必须使用 `@api.depends` 装饰器）
- **`store`**：是否存储计算结果到数据库（True/False）
- **`depends`**：计算字段依赖的其他字段（通过 `@api.depends` 指定）
- **`search`**：可选参数，用于定义搜索方法

```python
@api.depends("living_area", "garden_area")
def _compute_total_area(self):
    for record in self:
        record.total_area = record.living_area + record.garden_area
```

- **`@api.depends`**：装饰器，指定计算字段依赖的字段
- **`self`**：当前记录集（Recordset），包含所有待计算的记录
- **`record`**：单条记录对象，可访问所有字段

### 4. 方法类型详解

1. **`@api.model`**：模型级方法，不操作具体记录

   ```python
   @api.model
   def create_default_properties(self):
       # 创建默认房产记录
       pass
   ```

2. **`@api.returns`**：返回指定模型的记录

   ```python
   @api.returns("self")
   def get_available_properties(self):
       return self.search([("is_available", "=", True)])
   ```

3. **`@api.constrains`**：字段约束验证

   ```python
   @api.constrains("price")
   def _check_price(self):
       for record in self:
           if record.price < 0:
               raise ValueError("价格不能为负数")
   ```

4. **`@api.onchange`**：字段变化时触发

   ```python
   @api.onchange("living_area")
   def _onchange_living_area(self):
       if self.living_area > 100:
           self.price = self.price * 1.1  # 面积大于 100㎡ 时价格上浮 10%
   ```

## 三、前端开发详解

### 1. 视图 XML 结构基础

```xml
<record id="view_estate_property_form" model="ir.ui.view">
    <field name="name">estate.property.form</field>
    <field name="model">estate.property</field>
    <field name="arch" type="xml">
        <form>
            <sheet>
                <!-- 字段定义 -->
            </sheet>
        </form>
    </field>
</record>
```

- **`id`**：视图唯一标识符
- **`model`**：关联的模型名称
- **`arch`**：视图结构定义，使用 XML 格式
- **`type`**：视图类型（form/tree/calendar 等）

### 2. 表单视图（form）详解

#### 基本结构

```xml
<form string="房产信息">
    <header>
        <!-- 状态栏、按钮等 -->
    </header>
    <sheet>
        <!-- 主要内容区域 -->
    </sheet>
    <div class="oe_chatter">
        <!-- 讨论区 -->
    </div>
</form>
```

- **`string`**：表单标题
- **`<header>`**：顶部区域，通常放置状态和操作按钮
- **`<sheet>`**：主要内容区域
- **`<div class="oe_chatter">`**：讨论区，显示评论和活动

#### 字段定义参数

```xml
<field name="name" required="1" placeholder="请输入房产名称"/>
```

- **`name`**：关联模型中的字段名
- **`required`**：是否必填（1 表示是）
- **`readonly`**：是否只读（1 表示是）
- **`invisible`**：是否隐藏（1 表示是）
- **`placeholder`**：输入框提示文字
- **`widget`**：指定小部件（如 `statusbar`、`image` 等）

#### 布局控制

1. **分组布局**

   ```xml
   <group>
       <field name="living_area"/>
       <field name="garden_area"/>
   </group>
   ```

   - **`<group>`**：创建一个分组框，包含相关字段

2. **选项卡布局**

   ```xml
   <notebook>
       <page string="基本信息">
           <field name="name"/>
       </page>
       <page string="详细信息">
           <field name="description"/>
       </page>
   </notebook>
   ```

   - **`<notebook>`**：创建选项卡式布局
   - **`<page>`**：定义一个选项卡，`string` 属性为选项卡标题

3. **列布局**

   ```xml
   <group col="2">
       <field name="living_area"/>
       <field name="garden_area"/>
   </group>
   ```

   - **`col`**：指定列数，自动将字段分配到指定列中

### 3. 列表视图（tree）详解

```xml
<tree>
    <field name="name"/>
    <field name="living_area"/>
    <field name="price"/>
</tree>
```

- **`<tree>`**：定义列表视图
- **`<field>`**：定义列表中显示的字段
- **`decoration-xxx`**：根据条件设置行样式（如 `decoration-success="is_available"`）

### 4. 视图继承机制

```xml
<record id="view_estate_property_form_inherit" model="ir.ui.view">
    <field name="name">estate.property.form.inherit</field>
    <field name="model">estate.property</field>
    <field name="inherit_id" ref="estate_property.view_estate_property_form"/>
    <field name="arch" type="xml">
        <field name="price" position="after">
            <field name="total_area" readonly="1"/>
        </field>
    </field>
</record>
```

- **`inherit_id`**：指定要继承的视图 ID
- **`position`**：指定插入位置（`after`/`before`/`replace`/`inside`）
- **`ref`**：引用其他视图的 ID

## 四、权限与安全配置

### 1. 用户组定义

```xml
<record id="group_estate_user" model="res.groups">
    <field name="name">房产用户</field>
    <field name="category_id" ref="base.module_category_sales"/>
    <field name="implied_ids" eval="[(4, ref('base.group_user'))]"/>
</record>
```

- **`name`**：用户组名称
- **`category_id`**：所属应用类别
- **`implied_ids`**：隐含的其他用户组（4 表示添加）

### 2. 模型权限配置

```xml
<record id="access_estate_property" model="ir.model.access">
    <field name="name">estate.property</field>
    <field name="model_id" ref="model_estate_property"/>
    <field name="group_id" ref="group_estate_user"/>
    <field name="perm_read" eval="1"/>
    <field name="perm_write" eval="1"/>
    <field name="perm_create" eval="1"/>
    <field name="perm_unlink" eval="0"/>
</record>
```

- **`perm_read`**：读取权限（1 表示有权限）
- **`perm_write`**：写入权限
- **`perm_create`**：创建权限
- **`perm_unlink`**：删除权限

### 3. 记录规则配置

```xml
<record id="rule_estate_property" model="ir.rule">
    <field name="name">房产记录规则</field>
    <field name="model_id" ref="model_estate_property"/>
    <field name="domain_force">[('owner_id','=',user.partner_id.id)]</field>
    <field name="groups" eval="[(4, ref('group_estate_user'))]"/>
</record>
```

- **`domain_force`**：强制应用的搜索域，限制用户只能看到自己的房产
- **`groups`**：应用此规则的用户组

## 五、完整实战示例：房产管理模块

### 1. 模型定义（`models/estate_property.py`）

```python
from odoo import models, fields, api

class EstateProperty(models.Model):
    _name = "estate.property"
    _description = "房产信息"

    # 基本信息
    name = fields.Char(string="房产名称", required=True, size=100)
    description = fields.Text(string="详细描述")
    is_available = fields.Boolean(string="是否可用", default=True)

    # 面积信息
    living_area = fields.Integer(string="居住面积(㎡)", default=0)
    garden_area = fields.Integer(string="花园面积(㎡)", default=0)
    total_area = fields.Integer(compute="_compute_total_area", store=True, string="总面积(㎡)")

    # 价格信息
    price = fields.Float(string="价格(万元)", digits=(16, 2))

    # 关系字段
    owner_id = fields.Many2one(comodel_name="res.partner", string="业主", ondelete="cascade")
    tag_ids = fields.Many2many(comodel_name="estate.property.tag", string="标签")

    # 计算字段
    @api.depends("living_area", "garden_area")
    def _compute_total_area(self):
        for record in self:
            record.total_area = record.living_area + record.garden_area

    # 约束验证
    @api.constrains("price")
    def _check_price(self):
        for record in self:
            if record.price < 0:
                raise ValueError("价格不能为负数")

    # 字段变化触发
    @api.onchange("living_area")
    def _onchange_living_area(self):
        if self.living_area > 100:
            self.price = self.price * 1.1  # 面积大于 100㎡ 时价格上浮 10%
```

### 2. 视图定义（`views/estate_property_views.xml`）

```xml
<odoo>
    <!-- 表单视图 -->
    <record id="view_estate_property_form" model="ir.ui.view">
        <field name="name">estate.property.form</field>
        <field name="model">estate.property</field>
        <field name="arch" type="xml">
            <form string="房产信息">
                <header>
                    <button name="action_make_available" type="object" string="标记为可用" class="oe_highlight"/>
                    <button name="action_make_unavailable" type="object" string="标记为不可用" class="oe_highlight"/>
                </header>
                <sheet>
                    <group>
                        <field name="name"/>
                        <field name="description"/>
                        <field name="is_available" widget="statusbar"/>
                    </group>
                    <group col="2">
                        <field name="living_area"/>
                        <field name="garden_area"/>
                        <field name="total_area" readonly="1"/>
                        <field name="price"/>
                    </group>
                    <group>
                        <field name="owner_id"/>
                        <field name="tag_ids" widget="many2many_tags"/>
                    </group>
                </sheet>
                <div class="oe_chatter">
                    <field name="message_follower_ids" widget="mail_followers"/>
                    <field name="message_ids" widget="mail_thread"/>
                </div>
            </form>
        </field>
    </record>

    <!-- 列表视图 -->
    <record id="view_estate_property_tree" model="ir.ui.view">
        <field name="name">estate.property.tree</field>
        <field name="model">estate.property</field>
        <field name="arch" type="xml">
            <tree>
                <field name="name"/>
                <field name="living_area"/>
                <field name="garden_area"/>
                <field name="total_area"/>
                <field name="price"/>
                <field name="is_available" decoration-success="is_available"/>
            </tree>
        </field>
    </record>

    <!-- 菜单定义 -->
    <menuitem id="menu_estate_property" name="房产管理" parent="sale.menu_sale_root"/>
    <menuitem id="menu_estate_property_list" name="房产列表" parent="menu_estate_property" action="estate_property.action_estate_property"/>

    <!-- 动作定义 -->
    <record id="action_estate_property" model="ir.actions.act_window">
        <field name="name">房产管理</field>
        <field name="res_model">estate.property</field>
        <field name="view_mode">tree,form</field>
    </record>
</odoo>
```

### 3. 权限配置（`security/ir.model.access.csv`）

```csv
id,name,model_id:id,group_id:id,perm_read,perm_write,perm_create,perm_unlink
access_estate_property,estate.property,model_estate_property,group_estate_user,1,1,1,0
```

### 4. 模块清单（`__manifest__.py`）

```python
{
    "name": "房产管理",
    "version": "1.0",
    "summary": "房产信息管理模块",
    "description": "管理房产信息，包括面积、价格和业主信息",
    "category": "Sales",
    "author": "Your Name",
    "depends": ["base", "sale"],
    "data": [
        "security/ir.model.access.csv",
        "views/estate_property_views.xml",
    ],
    "installable": True,
    "application": True,
}
```

## 六、关键开发技巧与最佳实践

1. **模型设计原则**
   - **单一职责原则**：每个模型应有明确的业务含义
   - **避免过度规范化**：适当冗余可提高查询效率
   - **合理使用计算字段**：平衡计算性能与存储空间

2. **性能优化技巧**
   - **批量操作**：使用 `browse()` 和 `search()` 代替循环查询
   - **字段选择**：使用 `fields` 参数指定只需的字段
   - **避免 N+1 查询**：使用 `read()` 或 `browse()` 一次性获取关联数据

3. **前端体验优化**
   - **合理布局**：将相关字段分组显示
   - **适当使用只读**：对计算字段设置 `readonly="1"`
   - **状态可视化**：使用 `decoration-xxx` 属性直观显示状态

4. **安全最佳实践**
   - **最小权限原则**：只授予用户完成工作所需的最小权限
   - **记录规则**：使用 `ir.rule` 实现数据隔离
   - **字段权限**：对敏感字段设置字段级权限

5. **调试技巧**
   - **日志记录**：使用 `_logger` 记录关键操作
   - **断点调试**：在 Python 代码中使用 `import pdb; pdb.set_trace()`
   - **浏览器开发者工具**：检查前端元素和网络请求

掌握这些参数和技巧，就能比较顺手地开发 Odoo 模块，搭出功能完整、用起来也不别扭的业务应用。后续我会再补一些实际项目里踩到的坑（比如继承链冲突、`compute` 字段与 `store` 的取舍、`onchange` 在批量场景下失效之类）。
