# api-doc-management Spec Delta

## MODIFIED Requirements

### Requirement: API文档上传
系统 SHALL 支持用户上传API文档文件，并选择或创建所属分组。

#### Scenario: 成功上传API文档
- **WHEN** 用户选择有效的API文档文件（如OpenAPI、Swagger格式）
- **AND** 选择已有分组或新建分组
- **THEN** 系统解析文档内容并存储
- **AND** 关联到指定分组
- **AND** 返回上传成功提示

#### Scenario: 上传时新建分组
- **WHEN** 用户上传API文档并选择"新建分组"
- **AND** 输入分组名称和描述
- **THEN** 系统创建新分组
- **AND** 将文档关联到新分组
- **AND** 返回上传成功提示

#### Scenario: 上传失败处理
- **WHEN** 用户上传无效格式的文档文件
- **THEN** 系统返回错误提示
- **AND** 不保存文档内容

## ADDED Requirements

### Requirement: API分组列表管理
系统 SHALL 支持用户查看、创建、编辑和删除API分组，并展示分组统计信息。

#### Scenario: 查看分组列表
- **WHEN** 用户访问API分组列表页面
- **THEN** 系统显示所有分组
- **AND** 每个分组显示名称、描述、接口数量、用例数量
- **AND** 支持点击分组进入详情页面

#### Scenario: 创建新分组
- **WHEN** 用户点击创建分组按钮
- **AND** 输入分组名称和描述
- **THEN** 系统创建新分组
- **AND** 刷新分组列表

#### Scenario: 删除分组
- **WHEN** 用户选择删除某个分组
- **THEN** 系统提示确认删除
- **AND** 确认后删除分组及其关联的API文档

### Requirement: API分组详情页面
系统 SHALL 支持用户在分组详情页面查看和管理该分组下的接口和用例。

#### Scenario: 查看分组下接口列表
- **WHEN** 用户访问分组详情页面的接口Tab
- **THEN** 系统分页展示该分组下所有API文档中解析出的接口
- **AND** 每个接口显示方法、路径、摘要、标签、可用状态
- **AND** 支持编辑接口的标签和参数

#### Scenario: 查看分组下用例列表
- **WHEN** 用户访问分组详情页面的用例Tab
- **THEN** 系统展示使用该分组内API的测试用例列表
- **AND** 支持跳转到用例详情或可视化视图

