## Context
当前测试用例创建功能支持选择API和配置基本参数，但缺少字段关联能力。用户需要能够：
1. 将测试数据集中的字段值映射到API请求参数中
2. 将前一个API的响应字段映射到后续API的请求参数中

这些功能对于实现数据驱动测试和API依赖关系至关重要。

## Goals / Non-Goals
### Goals
- 支持在创建测试用例时选择数据集
- 支持配置数据集字段到API字段的映射关系
- 支持配置API之间的字段映射关系
- 测试执行时正确应用字段映射配置

### Non-Goals
- 不改变现有的测试执行基本流程
- 不改变数据集管理功能
- 不改变API文档管理功能

## Decisions
### Decision: 字段映射数据结构
使用JSON格式存储字段映射配置，结构如下：
```json
{
  "data_set_mappings": {
    "field_name_in_data_set": "field_path_in_api_request"
  },
  "api_mappings": {
    "source_api_id": {
      "source_field_path": "target_field_path"
    }
  }
}
```

**Rationale**: JSON格式灵活，易于扩展，且与现有field_mappings字段兼容。

### Decision: 数据集字段映射位置
将数据集字段映射存储在TestCaseAPI的field_mappings中，使用特殊前缀标识数据集字段。

**Rationale**: 复用现有字段，避免数据库结构变更，保持向后兼容。

### Decision: 字段路径格式
使用点号分隔的路径格式（如 "data.user.id"）表示嵌套字段。

**Rationale**: 标准JSON路径格式，易于解析和理解。

## Risks / Trade-offs
### Risk: 字段映射配置复杂度过高
**Mitigation**: 提供清晰的UI界面和示例，添加配置验证。

### Risk: 性能影响
**Mitigation**: 字段映射处理在内存中完成，对性能影响最小。

### Risk: 向后兼容性
**Mitigation**: 保持现有API接口不变，新字段为可选。

## Migration Plan
1. 更新数据库schema（如需要）
2. 更新后端API和业务逻辑
3. 更新前端页面和组件
4. 进行充分测试
5. 部署到生产环境

## Open Questions
- 是否需要支持字段转换函数（如字符串转数字）？
- 是否需要支持条件映射（根据条件选择不同的映射规则）？

