## MODIFIED Requirements

### Requirement: 拖拽式API编排
系统 SHALL 支持通过拖拽方式在页面上配置API，提供直观的拖拽界面，支持API节点的添加、删除和顺序调整，提高测试用例配置的效率和用户体验。

#### Scenario: 拖拽添加API
- **WHEN** 用户从API列表拖拽API到编排画布
- **THEN** 系统在画布上显示API节点
- **AND** 支持继续添加更多API节点
- **AND** 提供直观的可视化界面

#### Scenario: 调整API顺序
- **WHEN** 用户在编排画布上拖拽API节点
- **THEN** 系统更新API的执行顺序
- **AND** 保存更新后的编排顺序

