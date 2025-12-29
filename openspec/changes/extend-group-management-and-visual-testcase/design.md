# Design: 扩展分组管理与可视化用例展示

## Context
本次变更是对已有 `api-grouping-and-field-mapping` 的扩展，需要在现有分组和字段映射基础上：
1. 提供更好的分组管理体验
2. 增加用例的可视化展示
3. 引入条件执行机制

## Goals / Non-Goals

### Goals
- 提供统一的分组管理视图，一站式查看分组下的接口和用例
- 使用直观的可视化方式展示用例的API调用链和参数传递
- 支持灵活的条件执行，增强测试用例的表达能力
- 保持与现有功能的兼容性

### Non-Goals
- 不实现复杂的并行执行分支（本期只支持串行 + 条件跳过）
- 不实现循环执行
- 不实现可视化编辑（本期只实现可视化查看，编辑使用现有表单）

## Decisions

### 1. 可视化展示形式选择
**决策**：采用卡片流/泳道图形式，而非传统流程图

**理由**：
- API调用通常是线性串行的，流程图的复杂节点连线反而增加认知负担
- 卡片流更适合展示API的详细信息（方法、路径、参数）
- 市面流行方案参考：Postman Flows、Hoppscotch Collections、Insomnia Inso

**实现方式**：
- 使用React组件实现，不依赖ReactFlow
- 每个API渲染为卡片，使用CSS实现连线效果
- 支持横向滚动以适应长链路

### 2. 条件执行数据结构
**决策**：在 `test_case_apis` 表新增 `execution_condition` JSON字段

```json
{
  "enabled": true,
  "conditions": [
    {
      "source_api_id": 1,
      "field_path": "data.status",
      "operator": "equals",
      "value": "success"
    },
    {
      "source_api_id": 1,
      "field_path": "data.code",
      "operator": "equals",
      "value": 200
    }
  ],
  "logic": "AND",
  "on_fail": "skip"
}
```

**运算符支持**：
- `equals` / `not_equals` - 等于/不等于
- `contains` / `not_contains` - 包含/不包含
- `gt` / `gte` / `lt` / `lte` - 大于/大于等于/小于/小于等于
- `exists` / `not_exists` - 字段存在/不存在
- `is_empty` / `not_empty` - 为空/不为空

**失败处理**：
- `skip` - 跳过当前及后续依赖API
- `fail` - 标记用例执行失败
- `continue` - 忽略条件继续执行

### 3. 分组详情页面结构
**决策**：使用Tab切换展示接口和用例

**路由设计**：
- `/api-groups` - 分组列表
- `/api-groups/:groupId` - 分组详情（默认接口Tab）
- `/api-groups/:groupId/apis` - 接口Tab（可选URL形式）
- `/api-groups/:groupId/test-cases` - 用例Tab（可选URL形式）
- `/test-cases/:id/visual` - 用例可视化视图

### 4. 参数展示策略
**决策**：每个API卡片最多显示3个关键参数

**规则**：
- 优先显示有字段映射关系的参数
- 其次显示必填参数
- 支持"展开更多"查看全部参数

## Risks / Trade-offs

### 风险1：条件执行增加复杂度
- **影响**：测试执行引擎需要修改，增加条件判断逻辑
- **缓解**：条件执行默认关闭，用户按需启用；充分测试边界情况

### 风险2：可视化性能
- **影响**：复杂用例（>20个API）可能导致渲染卡顿
- **缓解**：使用虚拟滚动，限制单次渲染的API数量

### 风险3：数据迁移
- **影响**：现有test_case_apis记录需要兼容新字段
- **缓解**：新字段设为可空，默认值为null表示无条件执行

## Open Questions
1. 是否需要支持条件分支（满足条件A执行API-X，否则执行API-Y）？
   - 建议：本期不支持，后续评估需求再扩展
2. 可视化视图是否需要支持直接编辑字段映射？
   - 建议：本期只读，使用现有编辑功能修改

