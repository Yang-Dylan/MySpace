## Context
当前API文档管理缺少分组和标签功能，字段映射配置不够直观，Swagger文档不够完善。

## Goals / Non-Goals
### Goals
- 实现API文档分组管理
- 实现API标签功能，支持复用标签API
- 增强字段映射，提供清晰的源参数分类
- 实现API可用性验证机制
- 完善Swagger文档输出

### Non-Goals
- 不改变现有的API解析逻辑核心
- 不改变测试执行的基本流程

## Decisions

### Decision: API分组数据结构
新建 `api_groups` 表存储分组信息：
```sql
CREATE TABLE api_groups (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id INT NOT NULL,
    created_at DATETIME
);
```
API文档表添加 `group_id` 字段关联分组。

**Rationale**: 独立的分组表便于管理，支持分组级别的权限控制。

### Decision: API标签设计
在 `apis` 表添加 `tags` JSON字段存储标签数组：
```json
["token", "auth", "public"]
```

**Rationale**: JSON数组灵活，支持多标签，查询方便。

### Decision: API可用性标识
在 `apis` 表添加 `is_available` 布尔字段和 `availability_reason` 文本字段。

**Rationale**: 明确标识不可用API及原因，便于用户修复。

### Decision: 字段参数存储
在 `apis` 表添加 `request_params` 和 `response_params` JSON字段存储解析后的参数信息：
```json
{
  "params": [
    {"name": "userId", "path": "body.userId", "type": "integer", "required": true}
  ]
}
```

**Rationale**: 结构化存储便于前端展示和映射选择。

## Risks / Trade-offs
### Risk: 数据迁移
现有API文档需要分配到默认分组。

**Mitigation**: 创建"默认分组"并自动分配。

### Risk: API可用性判断标准
不同格式的API文档解析结果不一致。

**Mitigation**: 提供手动编辑功能，允许用户完善参数信息。

