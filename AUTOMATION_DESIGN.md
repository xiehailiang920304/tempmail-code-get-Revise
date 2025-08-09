# 自动化注册功能设计方案 (v2.0 - 支持人机验证节点)

## 业务流程概述

### 核心功能
在现有临时邮箱插件基础上，添加通用的自动化注册功能，支持用户在任何需要邮箱注册的网站上一键完成注册流程。**新增支持在业务流程的任意位置插入人机验证节点**，当执行到该节点时自动暂停等待用户完成人机验证。

### 设计理念变更
- **从固定流程到可配置步骤**：将原本固化的线性流程转变为灵活可配置的步骤数组系统
- **支持人机验证节点**：可在任意位置插入人机验证步骤，支持验证码、滑块、图片识别等各种人机验证
- **流程暂停与恢复**：执行引擎支持在人机验证节点暂停，等待用户交互后自动恢复执行

### 新的业务流程模式
1. **配置阶段**：用户通过可视化编辑器配置自动化步骤序列
2. **执行阶段**：按步骤顺序执行，遇到人机验证节点时自动暂停
3. **交互阶段**：用户手动完成人机验证，点击"继续"按钮
4. **恢复阶段**：流程自动恢复，继续执行后续步骤
5. **完成阶段**：所有步骤执行完毕，显示执行结果

## 技术架构设计

### 1. 权限配置
```json
// manifest.json 新增权限
{
  "permissions": [
    "storage",
    "activeTab",
    "sidePanel",
    "scripting"  // 新增：用于动态注入content script
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/automation-content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### 2. 数据结构设计 (重构为步骤数组模式)

#### 新的自动化流程配置结构
```javascript
{
  id: "unique-id",
  name: "配置名称",
  domain: "example.com",  // 匹配的域名
  description: "流程描述",
  steps: [
    {
      id: "step-1",
      type: "fillInput",
      name: "填入邮箱",
      description: "在邮箱输入框中填入生成的邮箱地址",
      selector: "input[type='email']",
      value: "{{email}}", // 支持变量替换
      options: {
        delay: 500,
        clearFirst: true,
        waitForElement: 3000
      }
    },
    {
      id: "step-2",
      type: "humanVerification",
      name: "完成人机验证",
      description: "请手动完成页面上的人机验证（如验证码、滑块、图片识别等）",
      options: {
        timeout: 300000, // 5分钟超时
        checkInterval: 1000, // 每秒检查一次是否可以继续
        skipable: false, // 是否可跳过
        retryable: true // 是否可重试
      }
    },
    {
      id: "step-3",
      type: "clickButton",
      name: "点击下一步",
      description: "点击下一步按钮继续流程",
      selector: "button[type='submit']",
      options: {
        delay: 1000,
        waitForElement: 2000,
        scrollIntoView: true
      }
    },
    {
      id: "step-4",
      type: "waitForElement",
      name: "等待验证码输入框",
      description: "等待验证码输入框出现",
      selector: "input[name='code']",
      options: {
        timeout: 10000,
        checkInterval: 500
      }
    },
    {
      id: "step-5",
      type: "fillInput",
      name: "填入验证码",
      description: "填入从邮箱获取的验证码",
      selector: "input[name='code']",
      value: "{{verificationCode}}",
      options: { delay: 300 }
    },
    {
      id: "step-6",
      type: "clickButton",
      name: "完成注册",
      description: "点击完成按钮提交注册",
      selector: "button.complete",
      options: { delay: 1000 }
    }
  ],
  variables: {
    email: "{{generated_email}}", // 动态生成的邮箱
    verificationCode: "{{fetched_code}}" // 从API获取的验证码
  },
  globalOptions: {
    maxRetries: 3,
    retryInterval: 2000,
    pageLoadTimeout: 10000,
    elementTimeout: 5000
  },
  enabled: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 支持的步骤类型
- **fillInput**: 填充输入框
- **clickButton**: 点击按钮或链接
- **waitForElement**: 等待元素出现
- **humanVerification**: 🔑 **人机验证节点** (核心新功能)
- **delay**: 固定延迟等待
- **conditional**: 条件判断 (未来扩展)
- **loop**: 循环执行 (未来扩展)
- **script**: 自定义脚本 (未来扩展)

### 3. 文件结构扩展

#### 新增文件
- `content/automation-content.js` - 内容脚本，负责页面元素操作
- `utils/automation-manager.js` - 自动化流程管理器
- `utils/selector-helper.js` - 选择器辅助工具

#### 修改文件
- `manifest.json` - 添加权限和content script配置
- `background.js` - 添加自动化相关消息处理
- `popup/popup.html` - 添加自动化注册按钮和状态显示
- `popup/popup.js` - 添加自动化功能的UI逻辑
- `options/options.html` - 添加自动化配置管理页面
- `options/options.js` - 添加配置管理逻辑
- `utils/storage.js` - 添加自动化配置的存储方法

### 4. 核心组件设计 (重构支持步骤数组和暂停/恢复)

#### AutomationRunner 类 (重构版)
```javascript
class AutomationRunner {
  constructor(config) {
    this.config = config;
    this.currentStepIndex = 0;
    this.status = 'idle'; // idle, running, paused, completed, error
    this.context = {}; // 存储执行上下文和变量
    this.pauseResolver = null; // 用于暂停/恢复的Promise resolver
    this.executionId = this.generateExecutionId();
    this.startTime = null;
    this.errors = [];
  }

  // 开始执行流程
  async start() {
    try {
      this.status = 'running';
      this.startTime = Date.now();
      this.currentStepIndex = 0;

      // 初始化变量上下文
      await this.initializeContext();

      // 保存执行状态
      await this.saveExecutionState();

      // 发送开始消息
      this.sendProgress({
        type: 'automationStarted',
        executionId: this.executionId,
        totalSteps: this.config.steps.length
      });

      // 执行所有步骤
      while (this.currentStepIndex < this.config.steps.length && this.status === 'running') {
        const step = this.config.steps[this.currentStepIndex];
        await this.executeStep(step);

        if (this.status === 'running') {
          this.currentStepIndex++;
          await this.saveExecutionState();
        }
      }

      if (this.status === 'running') {
        this.status = 'completed';
        this.sendProgress({
          type: 'automationCompleted',
          executionId: this.executionId,
          duration: Date.now() - this.startTime
        });
      }
    } catch (error) {
      this.status = 'error';
      this.errors.push(error.message);
      this.sendProgress({
        type: 'automationError',
        executionId: this.executionId,
        error: error.message,
        step: this.config.steps[this.currentStepIndex]
      });
    }
  }

  // 执行单个步骤
  async executeStep(step) {
    try {
      this.sendProgress({
        type: 'stepStarted',
        step: step,
        stepIndex: this.currentStepIndex,
        totalSteps: this.config.steps.length
      });

      let result;
      switch (step.type) {
        case 'fillInput':
          result = await this.fillInput(step);
          break;
        case 'clickButton':
          result = await this.clickButton(step);
          break;
        case 'waitForElement':
          result = await this.waitForElement(step);
          break;
        case 'humanVerification':
          result = await this.handleHumanVerification(step);
          break;
        case 'delay':
          result = await this.delay(step);
          break;
        default:
          throw new Error(`不支持的步骤类型: ${step.type}`);
      }

      this.sendProgress({
        type: 'stepCompleted',
        step: step,
        stepIndex: this.currentStepIndex,
        result: result
      });

      return result;
    } catch (error) {
      this.sendProgress({
        type: 'stepError',
        step: step,
        stepIndex: this.currentStepIndex,
        error: error.message
      });
      throw error;
    }
  }

  // 🔑 处理人机验证步骤 (核心新功能)
  async handleHumanVerification(step) {
    this.status = 'paused';

    this.sendProgress({
      type: 'humanVerificationRequired',
      step: step,
      executionId: this.executionId,
      message: step.description || '请完成人机验证后点击继续',
      timeout: step.options?.timeout || 300000
    });

    // 保存暂停状态
    await this.saveExecutionState();

    // 创建一个Promise，等待用户点击继续
    return new Promise((resolve, reject) => {
      this.pauseResolver = { resolve, reject };

      // 设置超时
      if (step.options?.timeout) {
        setTimeout(() => {
          if (this.status === 'paused') {
            this.status = 'error';
            reject(new Error('人机验证超时'));
          }
        }, step.options.timeout);
      }
    });
  }

  // 恢复执行 (用户点击继续后调用)
  resume() {
    if (this.status === 'paused' && this.pauseResolver) {
      this.status = 'running';
      this.pauseResolver.resolve();
      this.pauseResolver = null;

      this.sendProgress({
        type: 'automationResumed',
        executionId: this.executionId
      });
    }
  }

  // 暂停执行
  pause() {
    if (this.status === 'running') {
      this.status = 'paused';
      this.sendProgress({
        type: 'automationPaused',
        executionId: this.executionId
      });
    }
  }

  // 停止执行
  stop() {
    this.status = 'stopped';
    if (this.pauseResolver) {
      this.pauseResolver.reject(new Error('用户停止了自动化流程'));
      this.pauseResolver = null;
    }
    this.sendProgress({
      type: 'automationStopped',
      executionId: this.executionId
    });
  }

  // 其他辅助方法...
  async fillInput(step) {
    const value = this.resolveVariable(step.value);
    const element = await this.waitForElement(step.selector, step.options?.waitForElement || 3000);

    if (step.options?.clearFirst) {
      element.value = '';
    }

    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));

    if (step.options?.delay) {
      await this.sleep(step.options.delay);
    }

    return { success: true, value: value };
  }

  async clickButton(step) {
    const element = await this.waitForElement(step.selector, step.options?.waitForElement || 3000);

    if (step.options?.scrollIntoView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(500);
    }

    element.click();

    if (step.options?.delay) {
      await this.sleep(step.options.delay);
    }

    return { success: true };
  }

  // ... 更多方法
}
```

### 5. 消息通信机制 (扩展支持人机验证交互)

#### 新增消息类型
**流程控制消息**：
- `startAutomationFlow` - 开始执行自动化流程
- `pauseAutomationFlow` - 暂停自动化流程
- `resumeAutomationFlow` - 恢复自动化流程（用户点击继续）
- `stopAutomationFlow` - 停止自动化流程
- `getExecutionState` - 获取当前执行状态

**进度反馈消息**：
- `automationStarted` - 自动化流程开始
- `stepStarted` - 步骤开始执行
- `stepCompleted` - 步骤执行完成
- `stepError` - 步骤执行错误
- `humanVerificationRequired` - 🔑 **需要人机验证** (核心新消息)
- `automationResumed` - 自动化流程恢复
- `automationPaused` - 自动化流程暂停
- `automationCompleted` - 自动化流程完成
- `automationStopped` - 自动化流程停止
- `automationError` - 自动化流程错误

**配置管理消息**：
- `getAutomationFlows` - 获取自动化流程配置列表
- `saveAutomationFlow` - 保存自动化流程配置
- `deleteAutomationFlow` - 删除自动化流程配置
- `testAutomationFlow` - 测试自动化流程配置
- `importAutomationFlow` - 导入自动化流程配置
- `exportAutomationFlow` - 导出自动化流程配置

#### 人机验证交互流程
```javascript
// 1. Background发送人机验证需求到Popup
{
  type: 'humanVerificationRequired',
  executionId: 'exec-123',
  step: {
    id: 'step-2',
    name: '完成人机验证',
    description: '请手动完成页面上的验证码验证'
  },
  timeout: 300000,
  timestamp: Date.now()
}

// 2. Popup发送恢复执行到Background
{
  action: 'resumeAutomationFlow',
  executionId: 'exec-123',
  userConfirmed: true
}

// 3. Background确认恢复执行
{
  type: 'automationResumed',
  executionId: 'exec-123',
  nextStep: {
    id: 'step-3',
    name: '点击下一步'
  }
}
```

### 6. 用户界面设计 (增强支持人机验证交互)

#### Popup界面扩展
在现有popup.html中添加新的自动化区域：
```html
<!-- 自动化注册区域 -->
<section class="automation-section">
  <div class="section-header">
    <span class="section-icon">🤖</span>
    <h2 class="section-title">自动化注册</h2>
  </div>

  <!-- 流程选择 -->
  <div class="flow-selection">
    <select id="flowSelector" class="flow-select">
      <option value="">选择自动化流程...</option>
      <!-- 动态加载流程配置 -->
    </select>
    <button id="refreshFlowsBtn" class="icon-btn" title="刷新流程列表">🔄</button>
  </div>

  <!-- 执行状态显示 -->
  <div class="automation-status" id="automationStatus" style="display: none;">
    <div class="status-header">
      <span class="status-icon" id="statusIcon">⏳</span>
      <span class="status-text" id="statusText">准备中...</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" id="progressFill" style="width: 0%"></div>
      <span class="progress-text" id="progressText">0/0</span>
    </div>
  </div>

  <!-- 当前步骤信息 -->
  <div class="current-step" id="currentStep" style="display: none;">
    <div class="step-info">
      <h4 class="step-name" id="stepName"></h4>
      <p class="step-description" id="stepDescription"></p>
    </div>
  </div>

  <!-- 🔑 人机验证等待界面 (核心新功能) -->
  <div class="human-verification" id="humanVerification" style="display: none;">
    <div class="verification-header">
      <span class="verification-icon">🔐</span>
      <h3>需要人机验证</h3>
    </div>
    <div class="verification-content">
      <p class="verification-message" id="verificationMessage">
        请在页面上完成人机验证，然后点击下方的"继续"按钮
      </p>
      <div class="verification-timeout" id="verificationTimeout">
        <span>剩余时间: </span>
        <span class="timeout-counter" id="timeoutCounter">5:00</span>
      </div>
    </div>
    <div class="verification-actions">
      <button id="continueBtn" class="primary-btn">✅ 继续执行</button>
      <button id="skipVerificationBtn" class="secondary-btn" style="display: none;">跳过</button>
      <button id="retryVerificationBtn" class="secondary-btn" style="display: none;">重试</button>
    </div>
  </div>

  <!-- 控制按钮 -->
  <div class="button-group">
    <button id="startAutomationBtn" class="primary-btn">开始自动化注册</button>
    <button id="pauseAutomationBtn" class="secondary-btn" style="display: none;">⏸️ 暂停</button>
    <button id="resumeAutomationBtn" class="secondary-btn" style="display: none;">▶️ 恢复</button>
    <button id="stopAutomationBtn" class="danger-btn" style="display: none;">⏹️ 停止</button>
  </div>

  <!-- 步骤进度列表 -->
  <div class="automation-progress" id="automationProgress" style="display: none;">
    <h4>执行进度</h4>
    <div id="automationSteps" class="steps-container">
      <!-- 动态生成步骤进度 -->
    </div>
  </div>

  <!-- 执行日志 -->
  <div class="execution-log" id="executionLog" style="display: none;">
    <h4>执行日志</h4>
    <div class="log-container" id="logContainer">
      <!-- 显示执行日志 -->
    </div>
  </div>
</section>
```

#### Options页面扩展 (可视化步骤编辑器)
添加自动化流程配置管理标签页：
```html
<!-- 自动化流程配置标签页 -->
<div class="tab-content" id="automationTab">
  <h2>🤖 自动化流程管理</h2>

  <!-- 流程列表 -->
  <div class="flow-list">
    <div class="flow-header">
      <h3>已保存的流程</h3>
      <div class="header-actions">
        <button id="addFlowBtn" class="primary-btn">➕ 新建流程</button>
        <button id="importFlowBtn" class="secondary-btn">📥 导入</button>
        <button id="exportFlowBtn" class="secondary-btn">📤 导出</button>
      </div>
    </div>
    <div id="flowList" class="flows-container">
      <!-- 动态生成流程列表 -->
    </div>
  </div>

  <!-- 🔑 可视化步骤编辑器 (核心新功能) -->
  <div id="flowEditor" class="flow-editor" style="display: none;">
    <div class="editor-header">
      <h3 id="editorTitle">编辑流程</h3>
      <div class="editor-actions">
        <button id="saveFlowBtn" class="primary-btn">💾 保存</button>
        <button id="testFlowBtn" class="secondary-btn">🧪 测试</button>
        <button id="cancelEditBtn" class="secondary-btn">❌ 取消</button>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="flow-basic-info">
      <div class="form-group">
        <label for="flowName">流程名称</label>
        <input type="text" id="flowName" placeholder="例如：Gmail注册流程">
      </div>
      <div class="form-group">
        <label for="flowDomain">匹配域名</label>
        <input type="text" id="flowDomain" placeholder="例如：accounts.google.com">
      </div>
      <div class="form-group">
        <label for="flowDescription">流程描述</label>
        <textarea id="flowDescription" placeholder="描述这个自动化流程的用途"></textarea>
      </div>
    </div>

    <!-- 步骤编辑区域 -->
    <div class="steps-editor">
      <div class="steps-header">
        <h4>流程步骤</h4>
        <div class="step-actions">
          <select id="stepTypeSelector" class="step-type-select">
            <option value="">选择步骤类型...</option>
            <option value="fillInput">📝 填充输入框</option>
            <option value="clickButton">👆 点击按钮</option>
            <option value="waitForElement">⏳ 等待元素</option>
            <option value="humanVerification">🔐 人机验证</option>
            <option value="delay">⏱️ 延迟等待</option>
          </select>
          <button id="addStepBtn" class="primary-btn">➕ 添加步骤</button>
        </div>
      </div>

      <!-- 步骤列表 -->
      <div id="stepsList" class="steps-list">
        <!-- 动态生成可拖拽的步骤列表 -->
      </div>
    </div>

    <!-- 步骤详情编辑 -->
    <div id="stepDetails" class="step-details" style="display: none;">
      <h4>步骤详情</h4>
      <div id="stepDetailsContent">
        <!-- 根据步骤类型动态生成编辑表单 -->
      </div>
    </div>

    <!-- 预览和测试 -->
    <div class="flow-preview">
      <h4>流程预览</h4>
      <div id="flowPreview" class="preview-container">
        <!-- 显示流程的可视化预览 -->
      </div>
    </div>
  </div>
</div>
```

## 实现计划 (重构版 - 支持人机验证节点)

### 阶段1：核心架构重构
1. **数据结构迁移**
   - 扩展storage.js支持新的步骤数组配置格式
   - 实现配置格式的向后兼容和自动迁移
   - 添加执行状态的持久化存储

2. **消息通信扩展**
   - 在background.js中添加新的消息处理类型
   - 实现人机验证相关的消息流程
   - 添加执行状态的实时同步机制

3. **权限和基础设施**
   - 修改manifest.json添加必要权限
   - 创建content script基础框架
   - 建立可靠的页面元素操作机制

### 阶段2：步骤执行引擎重构
1. **AutomationRunner类重构**
   - 实现基于步骤数组的执行引擎
   - 添加暂停/恢复机制支持
   - 实现执行状态的保存和恢复

2. **🔑 人机验证节点实现**
   - 实现humanVerification步骤类型
   - 添加超时和重试机制
   - 实现与用户界面的交互流程

3. **其他步骤类型实现**
   - fillInput, clickButton, waitForElement等基础步骤
   - 变量替换和上下文管理
   - 错误处理和重试机制

### 阶段3：用户界面开发
1. **Popup界面增强**
   - 实现执行状态的实时显示
   - 🔑 **添加人机验证等待界面**
   - 实现流程控制按钮（开始/暂停/恢复/停止）
   - 添加步骤进度和执行日志显示

2. **🔑 可视化流程编辑器**
   - 实现拖拽式步骤编辑器
   - 支持各种步骤类型的配置
   - 实现流程的可视化预览
   - 添加流程测试和验证功能

3. **配置管理功能**
   - 流程的导入导出功能
   - 流程模板和预设配置
   - 配置的备份和恢复

### 阶段4：高级功能和优化
1. **智能化功能**
   - 自动检测页面元素和推荐配置
   - 智能等待和重试策略
   - 异常情况的自动处理

2. **用户体验优化**
   - 详细的操作指导和帮助文档
   - 友好的错误提示和解决建议
   - 流程执行的可视化反馈

3. **测试和兼容性**
   - 在主流网站测试自动化流程
   - 优化选择器匹配和容错机制
   - 性能优化和代码重构
   - 多浏览器兼容性测试

## 配置示例 (新的步骤数组格式)

### 常见网站流程配置模板

#### Gmail注册流程 (包含人机验证)
```javascript
{
  id: "gmail-registration-v2",
  name: "Gmail注册流程",
  domain: "accounts.google.com",
  description: "Gmail账号注册的完整自动化流程，包含人机验证处理",
  steps: [
    {
      id: "step-1",
      type: "fillInput",
      name: "填入邮箱地址",
      description: "在邮箱输入框中填入生成的邮箱地址",
      selector: "input[type='email']",
      value: "{{email}}",
      options: {
        delay: 500,
        clearFirst: true,
        waitForElement: 3000
      }
    },
    {
      id: "step-2",
      type: "clickButton",
      name: "点击下一步",
      description: "点击下一步按钮继续",
      selector: "#identifierNext",
      options: {
        delay: 1000,
        waitForElement: 2000
      }
    },
    {
      id: "step-3",
      type: "humanVerification",
      name: "完成人机验证",
      description: "请手动完成Google的人机验证（reCAPTCHA或其他验证方式）",
      options: {
        timeout: 300000, // 5分钟
        checkInterval: 1000,
        skipable: false,
        retryable: true
      }
    },
    {
      id: "step-4",
      type: "waitForElement",
      name: "等待验证码输入框",
      description: "等待邮箱验证码输入框出现",
      selector: "input[name='code']",
      options: {
        timeout: 10000,
        checkInterval: 500
      }
    },
    {
      id: "step-5",
      type: "fillInput",
      name: "填入验证码",
      description: "填入从邮箱获取的验证码",
      selector: "input[name='code']",
      value: "{{verificationCode}}",
      options: { delay: 300 }
    },
    {
      id: "step-6",
      type: "clickButton",
      name: "完成注册",
      description: "点击完成按钮提交注册",
      selector: "#next",
      options: { delay: 1000 }
    }
  ],
  variables: {
    email: "{{generated_email}}",
    verificationCode: "{{fetched_code}}"
  },
  globalOptions: {
    maxRetries: 3,
    retryInterval: 2000,
    pageLoadTimeout: 10000
  }
}
```

#### 通用注册表单 (多个人机验证节点)
```javascript
{
  id: "generic-registration-v2",
  name: "通用注册表单",
  domain: "*", // 通配符匹配
  description: "适用于大多数网站的通用注册流程，包含多个可能的人机验证点",
  steps: [
    {
      id: "step-1",
      type: "fillInput",
      name: "填入邮箱",
      selector: "input[type='email'], input[name*='email'], input[id*='email']",
      value: "{{email}}",
      options: { delay: 500 }
    },
    {
      id: "step-2",
      type: "humanVerification",
      name: "注册前验证",
      description: "某些网站在填入邮箱后就需要完成人机验证",
      options: {
        timeout: 180000, // 3分钟
        skipable: true // 如果没有验证可以跳过
      }
    },
    {
      id: "step-3",
      type: "clickButton",
      name: "点击注册/下一步",
      selector: "button[type='submit'], input[type='submit'], .btn-next, .btn-register",
      options: { delay: 1000 }
    },
    {
      id: "step-4",
      type: "humanVerification",
      name: "提交前验证",
      description: "在提交注册信息前完成人机验证",
      options: {
        timeout: 300000, // 5分钟
        skipable: true
      }
    },
    {
      id: "step-5",
      type: "waitForElement",
      name: "等待验证码输入",
      selector: "input[name*='code'], input[name*='verify'], input[placeholder*='验证码']",
      options: { timeout: 15000 }
    },
    {
      id: "step-6",
      type: "fillInput",
      name: "填入验证码",
      selector: "input[name*='code'], input[name*='verify'], input[placeholder*='验证码']",
      value: "{{verificationCode}}",
      options: { delay: 300 }
    },
    {
      id: "step-7",
      type: "humanVerification",
      name: "最终验证",
      description: "完成最终的人机验证后提交",
      options: {
        timeout: 180000,
        skipable: true
      }
    },
    {
      id: "step-8",
      type: "clickButton",
      name: "完成注册",
      selector: ".btn-complete, .btn-finish, button:contains('完成'), button:contains('提交')",
      options: { delay: 1000 }
    }
  ]
}
```

#### 简单流程 (单个人机验证节点)
```javascript
{
  id: "simple-with-verification",
  name: "简单注册+人机验证",
  domain: "example.com",
  steps: [
    {
      type: "fillInput",
      name: "填入邮箱",
      selector: "#email",
      value: "{{email}}"
    },
    {
      type: "humanVerification",
      name: "完成验证码",
      description: "请输入图片验证码或完成滑块验证",
      options: { timeout: 120000 }
    },
    {
      type: "clickButton",
      name: "提交注册",
      selector: "#submit"
    }
  ]
}
```

## 安全和兼容性考虑

### 安全措施
1. 只在用户主动触发时执行自动化
2. 避免在敏感页面（银行、支付等）执行
3. 提供明确的操作日志和用户控制

### 兼容性处理
1. 支持多种选择器语法（CSS、XPath、属性选择器）
2. 实现智能等待机制处理动态加载
3. 提供降级方案和手动干预选项
4. 适配不同的页面框架和样式库

### 用户体验优化
1. 清晰的步骤指示和进度反馈
2. 详细的错误信息和解决建议
3. 支持暂停、恢复和停止操作
4. 提供配置测试和验证功能
