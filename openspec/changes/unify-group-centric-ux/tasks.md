# Tasks: unify-group-centric-ux

## Phase 1: 后端 API 扩展

- [x] **1.1** 创建分组数据集模型 `GroupDataSet`
  - 字段：id, group_id, name, data (JSON), created_at, updated_at
  - 更新 `init.sql`

- [x] **1.2** 实现分组数据集 CRUD API
  - `POST /api/api-groups/{group_id}/datasets` - 创建数据集
  - `GET /api/api-groups/{group_id}/datasets` - 获取分组数据集列表
  - `PUT /api/api-groups/{group_id}/datasets/{id}` - 更新数据集
  - `DELETE /api/api-groups/{group_id}/datasets/{id}` - 删除数据集

- [x] **1.3** 实现接口关联用例查询 API
  - `GET /api/apis/{api_id}/test-cases` - 获取使用该接口的用例列表

- [x] **1.4** 实现手动添加接口 API
  - `POST /api/api-groups/{group_id}/apis` - 在分组内手动创建接口
  - 字段：method, path, summary, parsed_request_params, parsed_response_params

- [x] **1.5** 扩展用例执行记录查询
  - `GET /api/test-cases/{id}/executions` - 获取用例的执行记录列表

## Phase 2: 路由与导航重构

- [x] **2.1** 修改 `App.tsx` 路由配置
  - `/` 重定向到 `/api-groups`
  - 移除 `/api-docs` 系列独立路由
  - 保留 `/test-cases/:id/visual` 增强页面
  - 新增 `/api-groups/:id/test-cases/create` 路由

- [x] **2.2** 简化 `Layout.tsx` 导航
  - 移除「API文档」「测试用例」导航链接
  - 仅保留「API分组」和用户操作

- [x] **2.3** 移除或重构 `Home.tsx`
  - 重定向到分组列表

## Phase 3: 分组详情页增强

- [x] **3.1** 添加头部操作按钮区域
  - 「接口上传」按钮
  - 「配置基础数据」按钮

- [x] **3.2** 实现接口上传弹窗组件 `ApiUploadModal`
  - Tab 1：文件上传（复用 ApiDocUpload 逻辑）
  - Tab 2：手动添加接口表单

- [x] **3.3** 实现数据集配置弹窗组件 `DataSetConfigModal`
  - JSON 文件上传解析
  - 手动添加键值对编辑器
  - 数据集列表展示和管理

- [x] **3.4** 实现接口详情抽屉组件 `ApiDetailDrawer`
  - 显示接口基本信息
  - 请求参数表格（可编辑）
  - 响应参数表格（可编辑）
  - 保存更新功能

- [x] **3.5** 接口列表增加关联用例列
  - 显示关联用例数量
  - 点击展开用例名称列表
  - 用例名称可点击跳转

- [x] **3.6** 新增数据集 Tab
  - 展示分组内数据集列表
  - 新增、编辑、删除操作

- [x] **3.7** 用例 Tab 新增「新增用例」按钮
  - 跳转到限定分组的用例创建页面

## Phase 4: 用例可视化页面增强

- [x] **4.1** 添加操作按钮区域
  - 「执行用例」按钮
  - 「编辑用例」按钮

- [x] **4.2** 实现执行功能
  - 调用执行 API
  - 显示执行状态和进度
  - 执行完成后刷新记录

- [x] **4.3** 新增执行记录区域
  - 显示最近 5-10 条执行记录
  - 显示时间、状态、耗时
  - 点击跳转详情页

- [x] **4.4** 实现编辑用例功能
  - 可在可视化页面跳转编辑字段映射

## Phase 5: 分组内用例创建页面

- [x] **5.1** 更新 `TestCaseCreate.tsx`
  - 接收 groupId URL参数
  - API 选择仅显示本分组接口
  - 创建成功后返回分组详情页

- [x] **5.2** 集成数据集选择
  - 从分组数据集列表选择
  - 配置数据集字段映射

## Phase 6: 前端 API 和类型定义

- [x] **6.1** 更新 `apiDoc.ts`
  - 添加分组数据集相关 API 调用
  - 添加手动创建接口 API 调用
  - 添加接口关联用例查询

- [x] **6.2** 更新 `testCase.ts`
  - 添加用例执行记录查询

- [x] **6.3** 定义新的 TypeScript 类型
  - `GroupDataSet` 类型
  - `APIRelatedTestCase` 类型
  - `TestCaseExecutionRecord` 类型

## Phase 7: 测试与验证

- [x] **7.1** 测试路由重定向
  - 验证登录后跳转到分组列表
  - 验证旧路由重定向正常

- [x] **7.2** 测试接口上传功能
  - 文件上传正常解析
  - 手动添加接口保存成功

- [x] **7.3** 测试数据集管理
  - JSON 上传解析正确
  - 数据集 CRUD 正常

- [x] **7.4** 测试用例可视化执行
  - 执行按钮正常工作
  - 执行记录正确显示

## Dependencies

```
Phase 1 (后端) -> Phase 6 (前端API) -> Phase 3, 4, 5 (页面)
Phase 2 (路由) -> Phase 3, 4, 5 (页面)
Phase 3.4 (接口详情) 需要 Phase 1.4 (手动添加API)
Phase 3.6 (数据集Tab) 需要 Phase 1.1, 1.2 (数据集API)
Phase 4.3 (执行记录) 需要 Phase 1.5 (执行记录API)
Phase 5 (分组内创建) 需要 Phase 3.6 (数据集功能)
```

## Parallelizable Work

- Phase 1.1-1.5 可并行开发（后端独立模块）
- Phase 2.1-2.3 可并行开发（路由独立修改）
- Phase 3.2 和 3.3 可并行开发（独立弹窗组件）
