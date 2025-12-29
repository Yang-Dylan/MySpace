# Spec Delta: api-doc-management

## ADDED Requirements

### Requirement: 分组内手动添加接口
系统 SHALL 支持用户在分组详情页通过表单手动添加接口，无需上传文档文件。

#### Scenario: 手动添加接口成功
- **Given** 用户在分组详情页点击「接口上传」按钮
- **When** 切换到「手动添加」Tab，填写 method、path、summary、请求参数、响应参数
- **Then** 点击保存后接口创建成功，显示在分组接口列表中

#### Scenario: 手动添加接口 - 缺少必填字段
- **Given** 用户在手动添加表单中
- **When** 未填写 method 或 path
- **Then** 显示验证错误提示，无法保存

### Requirement: 分组数据集管理
系统 SHALL 支持用户在分组内管理数据集，用于测试用例的数据驱动。

#### Scenario: 上传 JSON 数据集
- **Given** 用户在分组详情页点击「配置基础数据」
- **When** 上传 JSON 格式文件
- **Then** 系统解析并创建数据集，显示在数据集列表中

#### Scenario: 手动添加数据集
- **Given** 用户在数据集配置弹窗中
- **When** 点击「手动添加」，输入数据集名称和键值对数据
- **Then** 数据集创建成功

#### Scenario: 删除数据集
- **Given** 数据集列表中存在数据集
- **When** 用户点击删除按钮并确认
- **Then** 数据集被删除

### Requirement: 接口关联用例查询
系统 SHALL 支持用户在接口列表中查看每个接口被哪些用例引用。

#### Scenario: 查看接口关联用例
- **Given** 接口列表显示多个接口
- **When** 用户查看某个接口的「关联用例」列
- **Then** 显示该接口被引用的用例数量

#### Scenario: 跳转到关联用例
- **Given** 接口有关联的用例
- **When** 用户点击用例名称
- **Then** 跳转到对应用例详情页

## MODIFIED Requirements

### Requirement: 接口上传入口
接口上传功能 SHALL 集成到分组详情页的弹窗中，不再使用独立页面。

#### Scenario: 分组内上传接口文档
- **Given** 用户在分组详情页点击「接口上传」按钮
- **When** 在弹窗中选择「文件上传」Tab，上传 OpenAPI/Swagger 文件
- **Then** 解析成功后接口添加到当前分组

### Requirement: 接口详情编辑
接口详情 SHALL 使用侧边抽屉展示，支持编辑请求和响应参数。

#### Scenario: 点击接口查看详情
- **Given** 用户在接口列表中
- **When** 点击某个接口行
- **Then** 右侧打开抽屉显示接口详情（方法、路径、摘要、请求参数、响应参数）

#### Scenario: 编辑接口参数
- **Given** 接口详情抽屉打开
- **When** 用户修改请求参数或响应参数
- **Then** 点击保存后更新成功，接口状态变为「可用」
