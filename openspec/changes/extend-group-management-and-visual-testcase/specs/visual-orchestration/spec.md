# visual-orchestration Spec Delta

## ADDED Requirements

### Requirement: 卡片流可视化展示
系统 SHALL 支持以卡片流形式展示测试用例的API调用链。

#### Scenario: 渲染API卡片
- **WHEN** 系统渲染用例可视化视图
- **THEN** 每个API渲染为独立卡片
- **AND** 卡片按执行顺序从左到右排列
- **AND** 卡片显示API的方法（GET/POST等）、路径、摘要

#### Scenario: 展示关键参数
- **WHEN** 系统渲染API卡片
- **THEN** 卡片内显示最多3个关键参数
- **AND** 优先显示有字段映射的参数
- **AND** 其次显示必填参数
- **AND** 支持点击"更多"展开全部参数

#### Scenario: 渲染参数传递连线
- **WHEN** API之间存在字段映射关系
- **THEN** 系统在卡片之间渲染连线
- **AND** 连线标注源字段和目标字段
- **AND** 连线颜色区分输入映射和输出映射

### Requirement: 条件执行可视化
系统 SHALL 在可视化视图中展示条件执行配置。

#### Scenario: 显示条件标识
- **WHEN** API配置了条件执行
- **THEN** 卡片显示条件图标
- **AND** 图标区分条件类型（AND/OR）

#### Scenario: 查看条件详情
- **WHEN** 用户悬停或点击条件图标
- **THEN** 系统显示条件弹窗
- **AND** 展示所有条件规则（字段、运算符、值）
- **AND** 展示失败处理策略

#### Scenario: 条件不满足的视觉反馈
- **WHEN** 查看已执行用例的可视化视图
- **AND** 某API因条件不满足被跳过
- **THEN** 该卡片显示为灰色或虚线边框
- **AND** 显示跳过原因

