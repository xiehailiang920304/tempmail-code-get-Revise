# 自动化功能文件结构说明

## 新增文件结构

```
├── content/                           # 内容脚本目录
│   └── automation-content.js         # 自动化内容脚本，处理页面元素操作
├── utils/                            # 工具类目录
│   ├── automation-manager.js         # 自动化流程管理器
│   ├── automation-runner.js          # 自动化执行器核心类
│   ├── automation-templates.js       # 预设流程配置模板
│   ├── automation-logger.js          # 日志记录和错误处理系统
│   ├── automation-validator.js       # 配置验证和迁移系统
│   └── selector-helper.js           # 选择器辅助工具
└── AUTOMATION_STRUCTURE.md          # 本文件，结构说明
```

## 修改的现有文件

```
├── manifest.json                     # 添加了scripting权限和content_scripts配置
├── background.js                     # 添加了自动化相关消息处理
└── utils/storage.js                  # 扩展了存储系统支持自动化配置
```

## 核心组件说明

### 1. AutomationManager (automation-manager.js)
- **职责**: 管理自动化流程的生命周期
- **功能**: 
  - 处理流程的启动、暂停、恢复、停止
  - 管理活跃的执行器实例
  - 处理来自popup和options页面的消息

### 2. AutomationRunner (automation-runner.js)
- **职责**: 执行具体的自动化流程
- **功能**:
  - 按步骤顺序执行自动化操作
  - 支持人机验证节点的暂停/恢复
  - 变量替换和上下文管理
  - 与content script通信执行页面操作

### 3. AutomationContentScript (automation-content.js)
- **职责**: 在页面中执行具体的DOM操作
- **功能**:
  - 填充输入框
  - 点击按钮
  - 等待元素出现
  - 页面信息获取

### 4. AutomationTemplates (automation-templates.js)
- **职责**: 管理预设的自动化流程模板
- **功能**:
  - 提供Gmail、通用注册等常用模板
  - 支持基于模板创建新流程
  - 根据域名推荐合适的模板

### 5. AutomationLogger (automation-logger.js)
- **职责**: 日志记录和错误处理
- **功能**:
  - 分级日志记录 (DEBUG, INFO, WARN, ERROR)
  - 错误类型识别和处理建议
  - 日志持久化和导出

### 6. AutomationValidator (automation-validator.js)
- **职责**: 配置验证和版本迁移
- **功能**:
  - 流程配置验证
  - 版本兼容性检查
  - 自动配置迁移

### 7. SelectorHelper (selector-helper.js)
- **职责**: 选择器相关的辅助功能
- **功能**:
  - 智能选择器生成
  - 选择器验证和优化
  - 常用选择器推荐

## 数据流程

### 1. 流程执行流程
```
Popup/Options → Background → AutomationManager → AutomationRunner → ContentScript → 页面DOM
```

### 2. 消息通信流程
```
用户操作 → 发送消息 → Background处理 → 调用相应管理器 → 返回结果 → 更新UI
```

### 3. 人机验证流程
```
执行到验证节点 → 暂停执行 → 通知用户 → 用户完成验证 → 点击继续 → 恢复执行
```

## 配置数据结构

### 自动化流程配置
```javascript
{
  id: "unique-id",
  name: "流程名称",
  domain: "匹配域名",
  description: "流程描述",
  steps: [
    {
      id: "step-id",
      type: "stepType",
      name: "步骤名称",
      description: "步骤描述",
      selector: "CSS选择器",
      value: "填充值或变量",
      options: { /* 步骤选项 */ }
    }
  ],
  variables: { /* 变量定义 */ },
  globalOptions: { /* 全局选项 */ },
  enabled: true
}
```

### 执行状态数据
```javascript
{
  executionId: "执行ID",
  status: "执行状态",
  currentStepIndex: 0,
  totalSteps: 5,
  startTime: timestamp,
  errors: [],
  stepResults: [],
  context: { /* 执行上下文 */ }
}
```

## 支持的步骤类型

1. **fillInput**: 填充输入框
2. **clickButton**: 点击按钮或链接
3. **waitForElement**: 等待元素出现
4. **humanVerification**: 人机验证节点 (核心功能)
5. **delay**: 固定延迟等待

## 错误处理机制

### 错误类型识别
- NetworkError: 网络连接问题
- ElementNotFound: 页面元素未找到
- TimeoutError: 操作超时
- PermissionError: 权限不足
- VerificationCodeError: 验证码获取失败

### 错误处理策略
- 自动重试机制
- 用户友好的错误提示
- 详细的错误日志记录
- 恢复建议提供

## 安全考虑

1. **权限控制**: 只在用户主动触发时执行
2. **域名限制**: 支持域名匹配限制
3. **操作日志**: 完整的操作记录
4. **用户控制**: 支持随时暂停和停止

## 扩展性设计

1. **插件化步骤**: 易于添加新的步骤类型
2. **模板系统**: 支持自定义和共享模板
3. **配置迁移**: 支持版本升级时的配置迁移
4. **多语言支持**: 预留国际化接口

## 性能优化

1. **懒加载**: 按需加载执行器和工具
2. **内存管理**: 及时清理完成的执行状态
3. **日志轮转**: 限制日志数量防止内存泄漏
4. **缓存机制**: 缓存常用的选择器和配置

## 开发和调试

1. **日志级别**: 支持DEBUG级别的详细日志
2. **执行状态**: 实时查看执行进度和状态
3. **错误追踪**: 详细的错误堆栈和上下文
4. **测试模式**: 支持流程配置的验证测试
