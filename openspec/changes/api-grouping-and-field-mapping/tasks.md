## 1. 数据库模型更新
- [x] 1.1 创建api_groups表模型
- [x] 1.2 更新api_documents表添加group_id字段
- [x] 1.3 更新apis表添加tags、is_available、availability_reason字段
- [x] 1.4 更新apis表添加parsed_request_params、parsed_response_params字段
- [x] 1.5 更新SQL初始化脚本

## 2. 后端API开发
- [x] 2.1 实现API分组CRUD接口
- [x] 2.2 更新API文档上传接口支持分组选择
- [x] 2.3 实现API标签管理接口
- [x] 2.4 实现标签API列表查询接口
- [x] 2.5 更新API解析逻辑，提取请求和响应参数
- [x] 2.6 实现API可用性验证和更新接口

## 3. Swagger文档增强
- [x] 3.1 为所有接口添加详细请求参数文档
- [x] 3.2 为所有接口添加详细响应参数文档
- [x] 3.3 使用Pydantic模型完善类型定义

## 4. 前端页面更新
- [x] 4.1 添加API分组管理页面（API）
- [x] 4.2 更新API文档上传页面支持分组选择（API）
- [x] 4.3 更新API列表页面显示标签和可用状态
- [x] 4.4 更新测试用例创建页面的字段映射UI
- [x] 4.5 实现参数分类选择（请求/响应/数据集）

## 5. 测试用例创建流程更新
- [x] 5.1 限制只能选择同分组的API（前端添加分组选择）
- [x] 5.2 支持选择标签API（如token）作为前置调用
- [x] 5.3 不可用API在列表中显示警告
