## ADDED Requirements
### Requirement: API重试机制配置
系统 SHALL 支持为API配置重试机制。

#### Scenario: 配置重试次数和间隔
- **WHEN** 用户为API配置重试机制
- **THEN** 系统允许设置重试次数和重试间隔时间
- **AND** 当API调用失败时，按照配置进行重试

#### Scenario: 重试执行
- **WHEN** API调用失败且配置了重试机制
- **THEN** 系统按照配置的重试次数和间隔进行重试
- **AND** 记录每次重试的结果

### Requirement: 等待时间配置
系统 SHALL 支持为API配置等待时间。

#### Scenario: 配置API等待时间
- **WHEN** 用户为API配置等待时间
- **THEN** 系统在API调用前等待指定的时间
- **AND** 等待时间可以是固定值或动态计算

### Requirement: API依赖关系配置
系统 SHALL 支持配置API之间的依赖关系。

#### Scenario: 配置API依赖
- **WHEN** 用户配置API依赖关系
- **THEN** 系统确保依赖的API先于当前API执行
- **AND** 支持将依赖API的响应数据传递给当前API

#### Scenario: 依赖执行顺序
- **WHEN** 测试用例包含多个有依赖关系的API
- **THEN** 系统按照依赖关系确定执行顺序
- **AND** 确保依赖API执行成功后才执行后续API

