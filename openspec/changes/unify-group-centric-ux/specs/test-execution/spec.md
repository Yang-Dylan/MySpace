# Spec Delta: test-execution

## ADDED Requirements

### Requirement: 可视化页面执行用例
系统 SHALL 支持用户在用例可视化页面直接执行用例，无需跳转到其他页面。

#### Scenario: 可视化页面执行
- **Given** 用户在用例可视化页面
- **When** 点击「执行用例」按钮
- **Then** 开始执行用例，显示执行状态和进度

#### Scenario: 执行完成后查看结果
- **Given** 用例执行完成
- **When** 页面自动刷新
- **Then** 执行记录区域显示最新的执行结果

### Requirement: 可视化页面执行记录
用例可视化页面 SHALL 显示该用例的历史执行记录。

#### Scenario: 查看执行记录
- **Given** 用户在用例可视化页面
- **When** 页面加载完成
- **Then** 底部显示最近的执行记录列表（时间、状态、耗时）

#### Scenario: 跳转执行详情
- **Given** 执行记录列表中有记录
- **When** 用户点击某条记录的「详情」按钮
- **Then** 跳转到执行详情页，查看每个接口的执行情况和错误日志

### Requirement: 用例执行记录查询 API
后端 SHALL 提供按用例 ID 查询执行记录的 API。

#### Scenario: 获取用例执行记录
- **Given** 用例有多次执行记录
- **When** 调用 `GET /api/test-cases/{id}/executions`
- **Then** 返回该用例的执行记录列表，按时间倒序排列
