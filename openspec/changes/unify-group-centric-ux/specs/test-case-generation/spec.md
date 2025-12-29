# Spec Delta: test-case-generation

## ADDED Requirements

### Requirement: 分组内创建用例
系统 SHALL 支持用户在分组详情页的用例 Tab 中创建测试用例，API 选择限定为本分组内的接口。

#### Scenario: 在分组内新增用例
- **Given** 用户在分组详情页的「用例」Tab
- **When** 点击「新增用例」按钮
- **Then** 打开用例创建页面，API 选择下拉仅显示当前分组的接口

#### Scenario: 分组内用例使用分组数据集
- **Given** 用户在分组内创建用例
- **When** 选择数据集
- **Then** 数据集下拉仅显示当前分组的数据集

#### Scenario: 创建成功后返回分组
- **Given** 用户在分组内的用例创建页面
- **When** 用例创建成功
- **Then** 自动返回分组详情页的用例 Tab

## MODIFIED Requirements

### Requirement: 用例列表入口
用例列表 SHALL 不再有独立页面，统一通过分组详情页的用例 Tab 访问。

#### Scenario: 从分组查看用例
- **Given** 用户在分组详情页
- **When** 切换到「用例」Tab
- **Then** 显示该分组内 API 相关的所有用例

#### Scenario: 搜索分组内用例
- **Given** 用户在分组详情页的用例 Tab
- **When** 输入搜索关键词
- **Then** 仅在该分组的用例范围内搜索
