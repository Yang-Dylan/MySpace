# 任务列表

## 任务1：修改后端VisualFieldMapping模型

- [x] 添加`source_type`字段，支持"api"和"data_set"两种类型
- [x] 添加`source_data_set_id`字段，用于存储数据集ID
- [x] 将`source_api_order`改为可选字段

## 任务2：修改后端映射处理逻辑

- [x] 在处理`enhanced_field_mappings`时，同时处理API映射和数据集映射
- [x] 将数据集映射添加到`incoming_mappings`中
- [x] 标记参数为已映射，并设置正确的映射源标识

## 任务3：更新前端接口定义

- [x] 更新`VisualFieldMapping`接口，添加`source_type`和`source_data_set_id`字段
- [x] 将`source_api_order`改为可选字段

## 任务4：在接口卡片上显示映射关系

- [x] 在接口卡片上添加"字段映射"区域
- [x] 显示所有映射关系
- [x] 区分数据集映射和API映射
- [x] 显示源字段和目标字段的对应关系

