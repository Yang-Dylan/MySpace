# visual-orchestration Specification

## Purpose
提供可视化编排能力，支持通过拖拽方式在页面上配置API流程，提供直观的测试用例配置体验。用户可以从API列表拖拽API到编排画布，通过连线表示API的执行顺序，通过可视化界面配置API之间的字段映射关系。编排好的流程可以保存和加载，支持后续编辑。编排流程可以应用到测试用例，自动转换为测试用例的配置。该能力降低了测试用例配置的技术门槛，提高了配置效率和准确性，特别适合复杂的多API测试场景。
## Requirements
### Requirement: 拖拽式API编排
系统 SHALL 支持通过拖拽方式在页面上配置API。

#### Scenario: 拖拽添加API
- **WHEN** 用户从API列表拖拽API到编排画布
- **THEN** 系统在画布上显示API节点
- **AND** 支持继续添加更多API节点

#### Scenario: 调整API顺序
- **WHEN** 用户在编排画布上拖拽API节点
- **THEN** 系统更新API的执行顺序
- **AND** 保存更新后的编排顺序

### Requirement: 字段关联关系配置
系统 SHALL 支持配置不同API之间的字段关联关系。

#### Scenario: 配置字段映射
- **WHEN** 用户选择两个API节点并配置字段关联
- **THEN** 系统允许用户选择源API的响应字段
- **AND** 映射到目标API的请求字段
- **AND** 保存字段关联关系

#### Scenario: 字段关联执行
- **WHEN** 测试执行时遇到配置了字段关联的API
- **THEN** 系统从源API的响应中提取字段值
- **AND** 将字段值传递给目标API的请求参数

### Requirement: 编排流程保存和加载
系统 SHALL 支持保存和加载编排好的API流程。

#### Scenario: 保存编排流程
- **WHEN** 用户完成API编排配置
- **THEN** 系统允许用户保存编排流程
- **AND** 为流程指定名称和描述

#### Scenario: 加载编排流程
- **WHEN** 用户选择已保存的编排流程
- **THEN** 系统在画布上恢复API节点和关联关系
- **AND** 允许用户继续编辑

