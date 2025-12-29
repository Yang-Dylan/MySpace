# Spec Delta: visual-orchestration

## ADDED Requirements

### Requirement: 可视化页面编辑用例
系统 SHALL 支持用户在可视化页面直接编辑用例的字段映射和条件配置。

#### Scenario: 编辑字段映射
- **Given** 用户在用例可视化页面
- **When** 点击「编辑用例」按钮
- **Then** 页面进入编辑模式，可以修改 API 间的字段映射

#### Scenario: 保存编辑
- **Given** 用户修改了字段映射
- **When** 点击保存
- **Then** 用例配置更新成功，可视化图刷新

### Requirement: 可视化页面操作区
可视化页面 SHALL 在顶部增加操作按钮区域。

#### Scenario: 显示操作按钮
- **Given** 用户打开用例可视化页面
- **When** 页面加载完成
- **Then** 显示「执行用例」和「编辑用例」按钮

## MODIFIED Requirements

### Requirement: 可视化页面布局
可视化页面 SHALL 增加执行记录区域，采用上下分区布局。

#### Scenario: 页面布局
- **Given** 用户打开用例可视化页面
- **When** 页面加载完成
- **Then** 上方显示用例名称、操作按钮；中间显示可视化流程图；下方显示执行记录

### Requirement: 导航入口统一
可视化页面 SHALL 保留，但主要入口改为从分组详情页进入。

#### Scenario: 从分组进入可视化
- **Given** 用户在分组详情页的用例 Tab
- **When** 点击某个用例的「可视化」按钮
- **Then** 进入该用例的可视化页面
