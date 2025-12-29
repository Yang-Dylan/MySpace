## MODIFIED Requirements

### Requirement: 用户登录
系统 SHALL 支持用户登录功能，实现基于JWT的认证机制，确保多团队协作场景下的数据安全，满足企业级安全需求。

#### Scenario: 成功登录
- **WHEN** 用户提供正确的用户名和密码
- **THEN** 系统验证用户凭据
- **AND** 创建用户会话（使用JWT）
- **AND** 重定向到主页面

#### Scenario: 登录失败
- **WHEN** 用户提供错误的用户名或密码
- **THEN** 系统返回错误提示
- **AND** 不创建用户会话

