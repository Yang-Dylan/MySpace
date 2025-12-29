# Change: 增强测试用例字段关联功能

## Why
当前测试用例创建页面仅支持选择API和配置基本参数，缺少字段关联能力。用户需要能够：
1. 将数据集中的字段数据关联到API请求参数中，实现数据驱动测试
2. 将不同API之间的字段进行关联，实现API之间的数据传递和依赖关系

这些功能对于构建复杂的测试场景至关重要，能够显著提升测试用例的灵活性和复用性。

## What Changes
- 在测试用例创建页面添加数据集选择功能
- 支持配置数据集字段到API字段的映射关系
- 增强API之间的字段映射配置界面
- 更新后端API以支持数据集字段映射配置
- 更新测试执行引擎以正确处理数据集字段映射和API间字段映射
- 更新测试用例生成规范，明确字段关联能力

## Impact
- 受影响的能力规范：
  - `test-case-generation` - 测试用例生成（增强字段关联能力）
  - `test-execution` - 测试执行（增强字段映射处理）
- 受影响代码：
  - `frontend/src/pages/TestCaseCreate.tsx` - 测试用例创建页面
  - `backend/api/routers/test_case.py` - 测试用例API路由
  - `backend/schemas/test_case.py` - 测试用例数据模式
  - `backend/services/test_executor.py` - 测试执行引擎
  - `frontend/src/api/testCase.ts` - 测试用例前端API

