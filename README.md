# 临时邮箱验证码获取工具 - 功能修订记录

## 📋 修订概述

本文档记录了对临时邮箱验证码获取工具的功能增强和代码修改，主要包括两个核心功能的新增：

1. **邮箱复制功能增强** - 添加复制整体邮箱和只复制邮箱名的按钮
2. **手动邮箱输入功能** - 支持手动输入或粘贴邮箱地址获取验证码

---

## 🎯 功能一：邮箱复制功能增强

### 功能描述
在邮箱生成区域的"生成新邮箱"按钮下方添加两个复制按钮：
- **复制整体邮箱**：复制完整的邮箱地址（如：`lindagarcia123456@domain1.com`）
- **只复制邮箱名**：只复制@符号前的部分（如：`lindagarcia123456`）

### 代码修改详情

#### 1. HTML结构修改 (`sidepanel/flow-manager-sidebar.html`)

**修改位置**：第26-35行
```html
<div class="card-content">
    <div class="email-display">
        <input type="text" id="homeEmailInput" placeholder="点击生成邮箱或手动输入邮箱地址">
        <button id="homeGenerateEmailBtn" class="btn btn-primary">生成新邮箱</button>
    </div>
    <div class="email-copy-buttons">
        <button id="homeCopyFullEmailBtn" class="btn btn-secondary btn-small">复制整体邮箱</button>
        <button id="homeCopyEmailNameBtn" class="btn btn-secondary btn-small">只复制邮箱名</button>
    </div>
</div>
```

**变更说明**：
- 添加了新的容器 `email-copy-buttons`
- 新增两个按钮元素，使用不同的ID进行区分

#### 2. CSS样式添加 (`sidepanel/flow-manager-sidebar.css`)

**修改位置**：第138-151行
```css
.email-copy-buttons {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    justify-content: space-between;
}

.email-copy-buttons .btn {
    flex: 1;
    font-size: 11px;
    padding: 6px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
}
```

**样式特点**：
- 使用 flexbox 布局，两个按钮等宽分布
- 添加适当的间距和过渡效果
- 保持与现有UI风格的一致性

#### 3. JavaScript功能实现 (`sidepanel/flow-manager-sidebar.js`)

**事件监听器添加**（第1497-1504行）：
```javascript
// 邮箱复制按钮
document.getElementById('homeCopyFullEmailBtn')?.addEventListener('click', () => {
  this.copyFullEmail();
});

document.getElementById('homeCopyEmailNameBtn')?.addEventListener('click', () => {
  this.copyEmailName();
});
```

**复制功能函数**（第1960-1999行）：
```javascript
// 复制完整邮箱地址
async copyFullEmail() {
  const emailInput = document.getElementById('homeEmailInput');
  if (!emailInput || !emailInput.value) {
    this.showNotification('请先生成邮箱地址', 'warn');
    return;
  }

  const fullEmail = emailInput.value;
  const copySuccess = await this.copyToClipboard(fullEmail, '完整邮箱地址已复制到剪切板', '复制完整邮箱地址失败');
  if (copySuccess) {
    this.addLog(`完整邮箱地址已复制: ${fullEmail}`, 'success');
  } else {
    this.addLog('复制完整邮箱地址失败', 'warn');
  }
}

// 复制邮箱名（@前面的部分）
async copyEmailName() {
  const emailInput = document.getElementById('homeEmailInput');
  if (!emailInput || !emailInput.value) {
    this.showNotification('请先生成邮箱地址', 'warn');
    return;
  }

  const fullEmail = emailInput.value;
  const atIndex = fullEmail.indexOf('@');
  if (atIndex === -1) {
    this.showNotification('邮箱格式不正确', 'error');
    return;
  }

  const emailName = fullEmail.substring(0, atIndex);
  const copySuccess = await this.copyToClipboard(emailName, '邮箱名已复制到剪切板', '复制邮箱名失败');
  if (copySuccess) {
    this.addLog(`邮箱名已复制: ${emailName}`, 'success');
  } else {
    this.addLog('复制邮箱名失败', 'warn');
  }
}
```

**功能特点**：
- 完善的错误处理和用户反馈
- 智能的邮箱格式验证
- 详细的日志记录
- 使用现有的通知系统

---

## 🎯 功能二：手动邮箱输入功能

### 功能描述
支持用户手动输入或粘贴邮箱地址到邮箱生成区域，然后点击"获取验证码"按钮获取相应邮箱的验证码。系统智能识别邮箱类型并采用相应的处理策略。

### 核心设计理念

**邮箱类型识别**：
- **tempmail邮箱**（`@tempmail.plus` 或 `@mailto.plus`）：直接使用该邮箱调用API
- **自定义域名邮箱**：使用配置中的tempmail邮箱调用API（通过Cloudflare转发）

### 代码修改详情

#### 1. HTML输入框修改 (`sidepanel/flow-manager-sidebar.html`)

**修改位置**：第28行
```html
<!-- 修改前 -->
<input type="text" id="homeEmailInput" readonly placeholder="点击生成邮箱地址">

<!-- 修改后 -->
<input type="text" id="homeEmailInput" placeholder="点击生成邮箱或手动输入邮箱地址">
```

**变更说明**：
- 移除 `readonly` 属性，允许用户输入
- 更新占位符文本，提示用户可以手动输入

#### 2. CSS样式优化 (`sidepanel/flow-manager-sidebar.css`)

**修改位置**：第153-173行
```css
.email-display input,
.code-display input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 12px;
    background: #ffffff;
    transition: all 0.2s ease;
}

.email-display input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    background: #ffffff;
}

.code-display input {
    background: #f9f9f9;
}
```

**样式特点**：
- 为邮箱输入框添加焦点状态样式
- 使用品牌色彩的边框和阴影效果
- 保持验证码输入框的只读样式

#### 3. JavaScript输入处理增强 (`sidepanel/flow-manager-sidebar.js`)

**输入框事件监听器**（第1505-1531行）：
```javascript
// 邮箱输入框事件监听
const homeEmailInput = document.getElementById('homeEmailInput');
if (homeEmailInput) {
  // 输入时自动去除空格
  homeEmailInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.trim();
  });

  // 粘贴时自动去除空格
  homeEmailInput.addEventListener('paste', (e) => {
    setTimeout(() => {
      e.target.value = e.target.value.trim();
    }, 0);
  });

  // 失去焦点时验证邮箱格式
  homeEmailInput.addEventListener('blur', (e) => {
    const email = e.target.value.trim();
    if (email && (!email.includes('@') || email.length < 5)) {
      this.showNotification('邮箱格式不正确', 'warn');
    }
  });
}
```

**获取验证码函数增强**（第2001-2062行）：
```javascript
// 首页获取验证码
async getCodeForHome() {
  try {
    // 检查邮箱输入框是否有内容
    const emailInput = document.getElementById('homeEmailInput');
    if (!emailInput || !emailInput.value.trim()) {
      this.showNotification('请先生成邮箱或手动输入邮箱地址', 'warn');
      return;
    }

    const currentEmail = emailInput.value.trim();

    // 简单的邮箱格式验证
    if (!currentEmail.includes('@') || currentEmail.length < 5) {
      this.showNotification('邮箱格式不正确', 'error');
      return;
    }

    // 检查是否是tempmail相关邮箱
    if (currentEmail.includes('@tempmail.plus') || currentEmail.includes('@mailto.plus')) {
      this.addLog(`开始获取验证码（直接使用: ${currentEmail}）...`, 'info');
    } else {
      this.addLog(`开始获取验证码（邮箱: ${currentEmail}，通过Cloudflare转发到配置的tempmail邮箱）...`, 'info');
    }

    const response = await chrome.runtime.sendMessage({
      action: 'getVerificationCode',
      targetEmail: currentEmail, // 传递当前邮箱地址
      maxRetries: 10,
      retryInterval: 3000,
      openLinksOnFailure: true
    });
    // ... 后续处理逻辑
  } catch (error) {
    // ... 错误处理
  }
}
```

#### 4. 后台服务修改 (`background.js`)

**消息处理函数增强**（第325-346行）：
```javascript
async handleGetVerificationCode(message, sendResponse) {
  const { maxRetries = 5, retryInterval = 3000, openLinksOnFailure = false, targetEmail = null } = message;

  const code = await apiManager.getVerificationCode(
    maxRetries,
    retryInterval,
    progressCallback,
    this.codeRequestController.signal,
    openLinksOnFailure,
    targetEmail  // 新增：传递目标邮箱地址
  );
}
```

#### 5. API管理器核心逻辑修改 (`utils/api.js`)

**邮箱地址智能识别**（第334-350行）：
```javascript
// 确定用于API调用的邮箱地址
let apiEmail = emailConfig.targetEmail; // 默认使用配置中的tempmail邮箱
let emailForHistory = customEmail || emailConfig.targetEmail; // 用于历史记录的邮箱

// 如果传入了自定义邮箱，检查是否是tempmail相关域名
if (customEmail && (customEmail.includes('@tempmail.plus') || customEmail.includes('@mailto.plus'))) {
  // 如果是tempmail相关邮箱，直接使用它进行API调用
  apiEmail = customEmail;
}
// 如果是其他域名邮箱，仍然使用配置中的tempmail邮箱进行API调用
// 因为其他域名的邮件会通过Cloudflare转发到tempmail邮箱
```

**历史记录保存优化**（第380-401行）：
```javascript
// 如果获取到验证码，尝试删除邮件
if (code) {
  try {
    await this.deleteMail(firstId, apiEmail, epin);
    console.log('邮件删除成功');
  } catch (deleteError) {
    console.warn('删除邮件失败，但验证码已获取:', deleteError);
  }

  // 保存到历史记录
  if (this.storageManager) {
    try {
      await this.storageManager.saveLastCode(code);
      await this.storageManager.addCodeToHistory(code, emailForHistory);
      console.log('验证码历史记录保存成功');
    } catch (historyError) {
      console.warn('保存验证码历史记录失败:', historyError);
    }
  }

  return code;
}
```

---

## 🔧 关键问题修复

### 问题：JavaScript变量作用域错误

**问题描述**：
在获取验证码过程中出现 `emailForHistory is not defined` 错误，导致验证码获取失败。

**根本原因**：
变量 `emailForHistory` 在 `getLatestMailCode` 函数中定义，但在 `getVerificationCode` 函数中使用，存在作用域问题。

**解决方案**：
将历史记录保存逻辑从 `getVerificationCode` 函数移动到 `getLatestMailCode` 函数内部，确保变量在正确的作用域内使用。

**修复代码**：
```javascript
// 修复前：在getVerificationCode中保存历史记录（错误）
if (this.storageManager) {
  await this.storageManager.saveLastCode(code);
  await this.storageManager.addCodeToHistory(code, emailForHistory); // emailForHistory未定义
}

// 修复后：在getLatestMailCode中保存历史记录（正确）
if (this.storageManager) {
  try {
    await this.storageManager.saveLastCode(code);
    await this.storageManager.addCodeToHistory(code, emailForHistory); // emailForHistory已定义
    console.log('验证码历史记录保存成功');
  } catch (historyError) {
    console.warn('保存验证码历史记录失败:', historyError);
  }
}
```

---

## 📖 使用说明

### 邮箱复制功能使用方法

1. **生成邮箱**：点击"生成新邮箱"按钮
2. **复制选择**：
   - 点击"复制整体邮箱"：复制完整邮箱地址（如：`lindagarcia123456@domain1.com`）
   - 点击"只复制邮箱名"：只复制用户名部分（如：`lindagarcia123456`）
3. **状态反馈**：系统会显示复制成功的通知和日志记录

### 手动邮箱输入功能使用方法

#### 方式一：使用生成的邮箱
1. 点击"生成新邮箱"按钮生成邮箱
2. 点击"获取验证码"按钮
3. 系统使用配置的tempmail邮箱获取验证码

#### 方式二：手动输入tempmail邮箱
1. 在邮箱输入框中输入tempmail邮箱（如：`user123@tempmail.plus`）
2. 点击"获取验证码"按钮
3. 系统直接使用输入的邮箱获取验证码

#### 方式三：手动输入自定义域名邮箱
1. 在邮箱输入框中输入自定义域名邮箱（如：`test@mydomain.com`）
2. 点击"获取验证码"按钮
3. 系统使用配置的tempmail邮箱获取验证码（通过Cloudflare转发）

---

## 🔍 技术细节

### 邮箱类型识别逻辑

```javascript
// 邮箱类型判断
if (customEmail && (customEmail.includes('@tempmail.plus') || customEmail.includes('@mailto.plus'))) {
  // tempmail邮箱：直接使用
  apiEmail = customEmail;
} else {
  // 自定义域名邮箱：使用配置的tempmail邮箱
  apiEmail = emailConfig.targetEmail;
}
```

### 数据流向图

```
用户输入邮箱
    ↓
邮箱类型识别
    ↓
┌─────────────────┬─────────────────┐
│   tempmail邮箱   │  自定义域名邮箱   │
│                │                │
│ 直接API调用     │ 使用配置邮箱     │
│ apiEmail =     │ apiEmail =      │
│ customEmail    │ targetEmail     │
└─────────────────┴─────────────────┘
    ↓
API调用获取验证码
    ↓
历史记录保存
(emailForHistory = 用户输入的邮箱)
```

### 错误处理机制

1. **输入验证**：
   - 检查邮箱是否为空
   - 验证邮箱基本格式（包含@符号，长度大于5）

2. **API调用错误处理**：
   - 网络请求失败重试
   - 配置缺失提示
   - 详细错误日志记录

3. **历史记录保存错误处理**：
   - 使用try-catch包装
   - 保存失败不影响主要功能
   - 详细错误日志记录

### 用户体验优化

1. **输入框增强**：
   - 自动去除空格
   - 焦点状态视觉反馈
   - 实时格式验证

2. **状态提示**：
   - 清晰的操作反馈
   - 详细的日志记录
   - 智能的邮箱类型识别提示

3. **错误提示**：
   - 友好的错误消息
   - 具体的操作指导
   - 非阻塞式警告

---

## 📁 文件修改总览

### 修改的文件列表

| 文件路径 | 修改类型 | 主要变更 |
|---------|---------|---------|
| `sidepanel/flow-manager-sidebar.html` | 功能增强 | 添加复制按钮，移除输入框readonly属性 |
| `sidepanel/flow-manager-sidebar.css` | 样式增强 | 新增按钮样式，优化输入框焦点效果 |
| `sidepanel/flow-manager-sidebar.js` | 功能增强 | 新增复制函数，增强输入处理和验证码获取逻辑 |
| `background.js` | 接口扩展 | 支持targetEmail参数传递 |
| `utils/api.js` | 核心逻辑 | 邮箱类型识别，API调用优化，历史记录保存修复 |

### 代码统计

- **新增代码行数**：约 150 行
- **修改代码行数**：约 50 行
- **新增函数**：4 个
- **修改函数**：6 个

### 兼容性说明

- ✅ **向后兼容**：所有原有功能保持不变
- ✅ **配置兼容**：支持现有配置格式
- ✅ **API兼容**：保持原有API调用方式
- ✅ **数据兼容**：历史记录格式保持一致

---

## 🚀 版本信息

**修订版本**：v1.4.1
**修订日期**：2024年12月
**修订类型**：功能增强 + 问题修复

### 新增功能
- ✅ 邮箱复制功能（复制整体邮箱 + 只复制邮箱名）
- ✅ 手动邮箱输入功能
- ✅ 智能邮箱类型识别
- ✅ 增强的用户体验和错误处理

### 修复问题
- 🔧 JavaScript变量作用域错误
- 🔧 历史记录保存逻辑优化
- 🔧 API调用参数传递完善

### 技术改进
- 🎯 更清晰的代码结构
- 🎯 更完善的错误处理
- 🎯 更友好的用户反馈
- 🎯 更详细的日志记录

---

## 📝 开发者注意事项

### 测试建议
1. **功能测试**：
   - 测试复制按钮功能
   - 测试手动输入各种邮箱格式
   - 测试验证码获取流程

2. **边界测试**：
   - 空邮箱输入
   - 无效邮箱格式
   - 网络异常情况

3. **兼容性测试**：
   - 原有功能是否正常
   - 配置迁移是否正确
   - 历史记录是否完整

### 维护建议
1. **监控日志**：关注新增的日志输出，及时发现问题
2. **用户反馈**：收集用户对新功能的使用反馈
3. **性能监控**：观察新功能对整体性能的影响

### 未来扩展方向
1. **邮箱格式验证增强**：支持更多邮箱格式验证
2. **批量操作支持**：支持批量邮箱处理
3. **自定义复制格式**：允许用户自定义复制内容格式
4. **邮箱模板功能**：支持邮箱地址模板保存和快速使用

---

*本文档记录了临时邮箱验证码获取工具的重要功能增强，为后续维护和开发提供详细的技术参考。*
```
```

#### 4. 后台服务修改 (`background.js`)

**消息处理函数增强**（第325-346行）：
```javascript
// 获取验证码（首页专用，支持进度显示）
async handleGetVerificationCode(message, sendResponse) {
  // ... 现有逻辑

  const { maxRetries = 5, retryInterval = 3000, openLinksOnFailure = false, targetEmail = null } = message;

  // 获取验证码，恢复进度回调用于首页显示
  const code = await apiManager.getVerificationCode(
    maxRetries,
    retryInterval,
    progressCallback,
    this.codeRequestController.signal,
    openLinksOnFailure,
    targetEmail  // 新增：传递目标邮箱地址
  );
  // ... 后续处理
}
```

**自动化流程支持**（第403-423行）：
```javascript
// 获取验证码（支持进度回调，用于自动化流程）
async handleGetVerificationCodeWithProgress(message, sendResponse, progressCallback = null) {
  const { maxRetries = 5, retryInterval = 3000, targetEmail = null } = message;

  const code = await apiManager.getVerificationCode(
    maxRetries,
    retryInterval,
    wrappedProgressCallback,
    this.codeRequestController.signal,
    false, // 自动化流程不启用链接打开功能
    targetEmail  // 新增：传递目标邮箱地址
  );
  // ... 后续处理
}
```

#### 5. API管理器核心逻辑修改 (`utils/api.js`)

**邮箱地址智能识别**（第334-350行）：
```javascript
// 确定用于API调用的邮箱地址
let apiEmail = emailConfig.targetEmail; // 默认使用配置中的tempmail邮箱
let emailForHistory = customEmail || emailConfig.targetEmail; // 用于历史记录的邮箱

// 如果传入了自定义邮箱，检查是否是tempmail相关域名
if (customEmail && (customEmail.includes('@tempmail.plus') || customEmail.includes('@mailto.plus'))) {
  // 如果是tempmail相关邮箱，直接使用它进行API调用
  apiEmail = customEmail;
}
// 如果是其他域名邮箱，仍然使用配置中的tempmail邮箱进行API调用
// 因为其他域名的邮件会通过Cloudflare转发到tempmail邮箱

const epin = tempMailConfig.epin || '';

if (!apiEmail) {
  throw new Error('未配置目标邮箱地址，请在设置页面配置tempmail.plus邮箱地址');
}
```

**API调用函数签名更新**（第434-436行）：
```javascript
// 获取验证码（带重试机制）
async getVerificationCode(maxRetries = 5, retryInterval = 3000, onProgress = null, abortSignal = null, openLinksOnFailure = false, customEmail = null) {
  console.log('getVerificationCode调用参数:', { maxRetries, retryInterval, openLinksOnFailure, customEmail });
```

**邮件获取函数更新**（第326-327行）：
```javascript
// 获取最新邮件中的验证码
async getLatestMailCode(openLinksOnFailure = false, customEmail = null) {
```
```

#### 3. JavaScript输入处理增强 (`sidepanel/flow-manager-sidebar.js`)

**输入框事件监听器**（第1505-1531行）：
```javascript
// 邮箱输入框事件监听
const homeEmailInput = document.getElementById('homeEmailInput');
if (homeEmailInput) {
  // 输入时自动去除空格
  homeEmailInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.trim();
  });

  // 粘贴时自动去除空格
  homeEmailInput.addEventListener('paste', (e) => {
    setTimeout(() => {
      e.target.value = e.target.value.trim();
    }, 0);
  });

  // 失去焦点时验证邮箱格式
  homeEmailInput.addEventListener('blur', (e) => {
    const email = e.target.value.trim();
    if (email && (!email.includes('@') || email.length < 5)) {
      this.showNotification('邮箱格式不正确', 'warn');
    }
  });
}
```

**获取验证码函数增强**（第2001-2062行）：
```javascript
// 首页获取验证码
async getCodeForHome() {
  try {
    // 检查邮箱输入框是否有内容
    const emailInput = document.getElementById('homeEmailInput');
    if (!emailInput || !emailInput.value.trim()) {
      this.showNotification('请先生成邮箱或手动输入邮箱地址', 'warn');
      return;
    }

    const currentEmail = emailInput.value.trim();

    // 简单的邮箱格式验证
    if (!currentEmail.includes('@') || currentEmail.length < 5) {
      this.showNotification('邮箱格式不正确', 'error');
      return;
    }

    // 清空以前的验证码
    document.getElementById('homeCodeInput').value = '';
    // 显示停止按钮，隐藏获取按钮
    document.getElementById('homeGetCodeBtn').style.display = 'none';
    document.getElementById('homeStopCodeBtn').style.display = 'inline-block';

    // 检查是否是tempmail相关邮箱
    if (currentEmail.includes('@tempmail.plus') || currentEmail.includes('@mailto.plus')) {
      this.addLog(`开始获取验证码（直接使用: ${currentEmail}）...`, 'info');
    } else {
      this.addLog(`开始获取验证码（邮箱: ${currentEmail}，通过Cloudflare转发到配置的tempmail邮箱）...`, 'info');
    }

    const response = await chrome.runtime.sendMessage({
      action: 'getVerificationCode',
      targetEmail: currentEmail, // 传递当前邮箱地址
      maxRetries: 10,
      retryInterval: 3000,
      openLinksOnFailure: true
    });

    // ... 后续处理逻辑
  } catch (error) {
    // ... 错误处理
  }
}
```

#### 4. 后台服务修改 (`background.js`)

**消息处理函数增强**（第325-346行）：
```javascript
// 获取验证码（首页专用，支持进度显示）
async handleGetVerificationCode(message, sendResponse) {
  // ... 现有逻辑

  const { maxRetries = 5, retryInterval = 3000, openLinksOnFailure = false, targetEmail = null } = message;

  // 获取验证码，恢复进度回调用于首页显示
  const code = await apiManager.getVerificationCode(
    maxRetries,
    retryInterval,
    progressCallback,
    this.codeRequestController.signal,
    openLinksOnFailure,
    targetEmail  // 新增：传递目标邮箱地址
  );

  // ... 后续处理
}
```

**自动化流程支持**（第403-423行）：
```javascript
// 获取验证码（支持进度回调，用于自动化流程）
async handleGetVerificationCodeWithProgress(message, sendResponse, progressCallback = null) {
  // ... 现有逻辑

  const { maxRetries = 5, retryInterval = 3000, targetEmail = null } = message;

  // 获取验证码，传入包装后的进度回调
  const code = await apiManager.getVerificationCode(
    maxRetries,
    retryInterval,
    wrappedProgressCallback,
    this.codeRequestController.signal,
    false, // 自动化流程不启用链接打开功能
    targetEmail  // 新增：传递目标邮箱地址
  );

  // ... 后续处理
}
```


# 临时邮箱验证码获取工具

一个现代化的Chrome侧边栏扩展，专为自动生成临时邮箱并获取验证码而设计。支持多域名配置和Cloudflare域名转发，提供持久化的侧边栏体验。

## 📥 快速下载

[![GitHub release](https://img.shields.io/github/v/release/w154594742/tempmail-code-get)](https://github.com/w154594742/tempmail-code-get/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/w154594742/tempmail-code-get/total)](https://github.com/w154594742/tempmail-code-get/releases)

**🔗 [下载最新版本 CRX 文件](https://github.com/w154594742/tempmail-code-get/releases/latest)**

## ✨ 核心特性

### 🎯 智能邮箱生成
- **格式**: 姓氏+名字+6位随机数字@域名 (如: `lindagarcia123456@domain1.com`)
- **姓名库**: 内置100个英文姓氏和100个英文名字，确保高度随机性
- **多域名支持**: 配置多个域名，随机选择使用
- **域名格式**: 支持中文逗号（，）和英文逗号（,）分隔

### 🔐 智能验证码获取
- **实时获取**: 自动从目标邮箱获取最新验证码
- **智能解析**: 自动识别邮件中的验证码
- **智能链接处理**: 当邮件无验证码但有链接时，自动在新标签页打开相关链接
- **邮件内容显示**: 当既无验证码也无链接时，在实时日志中显示完整邮件内容
- **系统链接过滤**: 自动过滤邮件签名、头像等系统区域的链接，只保留有效链接
- **状态跟踪**: 实时显示获取状态和时间戳
- **停止控制**: 支持中途停止获取操作

### 🤖 自动化流程管理
- **可视化编辑**: 直观的流程创建和编辑界面
- **智能步骤**: 支持填充输入框、点击按钮、等待元素、人机验证等操作
- **变量系统**: 内置{{email}}和{{code}}变量，自动替换为实际值
- **智能超时处理**: 统一的超时机制，超时后自动继续执行下一步
- **实时测试**: 支持测试当前编辑的流程，无需保存即可验证配置
- **流程执行**: 一键运行自动化流程，支持暂停、恢复、停止
- **流程管理**: 导入导出流程、复制流程、历史记录管理
- **响应式界面**: 适配不同宽度的侧边栏，提供最佳用户体验

### 📱 侧边栏体验
- **持久显示**: 侧边栏保持打开，不会因点击页面而关闭
- **便捷访问**: 始终在浏览器右侧可见，随时可用
- **多标签页共享**: 在不同标签页间保持状态
- **原生集成**: 与Chrome浏览器完美集成
- **空间优化**: 不占用主页面空间，提高工作效率

### 📊 历史记录管理
- **邮箱历史**: 保存最多1000个邮箱记录
- **验证码历史**: 保存最多100个验证码记录
- **快速查看**: 一键查看和复制历史记录
- **自动清理**: 超出限制时自动删除最旧记录

## 🚀 快速开始

### 安装方法

#### 方法一：下载CRX安装包（推荐）

1. **下载CRX文件**:
   - 访问 [Releases页面](https://github.com/w154594742/tempmail-code-get/releases)
   - 下载最新版本的 `tempmail-code-get.crx` 文件

2. **安装扩展**:
   - 打开Chrome浏览器，进入 `chrome://extensions/`
   - 开启右上角的"开发者模式"
   - 将下载的 `.crx` 文件拖拽到扩展页面
   - 点击"添加扩展程序"确认安装

#### 方法二：源码安装

1. **下载源码**: 克隆或下载此项目到本地
2. **开启开发者模式**: Chrome浏览器 → 扩展程序 → 开启"开发者模式"
3. **加载扩展**: 点击"加载已解压的扩展程序" → 选择项目文件夹
4. **完成安装**: 扩展图标出现在工具栏

#### 方法三：自行构建CRX文件

如果您需要自行构建CRX安装包，可以按照以下步骤：

1. **准备源码**: 确保项目文件完整，包含manifest.json
2. **打开Chrome扩展管理**: 访问 `chrome://extensions/`
3. **开启开发者模式**: 右上角开关
4. **加载插件**: 点击"加载已解压的扩展程序"，选择项目根目录
5. **打包扩展**: 点击"打包扩展程序"按钮
6. **选择根目录**: 选择包含manifest.json的项目文件夹
7. **生成CRX**: Chrome会生成.crx文件和.pem私钥文件

**重要提示**:
- 首次打包无需私钥文件，Chrome会自动生成
- 务必保存生成的.pem私钥文件，用于后续版本更新
- 更新版本时必须使用相同的私钥文件
- 生成的CRX文件可分享给其他用户安装

### 基础配置

1. **打开侧边栏**: 点击扩展图标，侧边栏在右侧打开
2. **点击设置按钮** (⚙️) 打开配置页面
3. **配置域名**: 输入您的域名列表，如 `domain1.com,domain2.com`
4. **设置目标邮箱**: 输入实际的临时邮箱地址，如 `user123@tempmail.plus`
5. **配置PIN码**: 输入您的tempmail.plus PIN码
6. **保存配置**: 点击保存按钮完成配置

### 数据备份与恢复

1. **导出配置**: 在设置页面点击"导出配置"按钮，下载包含所有设置和流程的JSON文件
2. **导入配置**: 点击"导入配置"按钮，选择之前导出的JSON文件，一键恢复所有配置
3. **备份建议**: 建议在重要配置完成后及时导出备份，避免数据丢失

### 使用流程

#### 手动模式
1. **打开侧边栏**: 点击扩展图标打开侧边栏
2. **生成邮箱**: 点击"生成新邮箱"按钮
3. **复制邮箱**: 点击📋按钮复制邮箱地址
4. **使用邮箱**: 在需要的网站注册或验证
5. **获取验证码**: 点击"获取验证码"按钮
6. **智能处理**: 系统会自动处理以下情况：
   - **找到验证码**: 自动复制验证码到剪贴板
   - **找到链接**: 自动在新标签页打开相关链接（过滤系统链接）
   - **显示内容**: 当无验证码无链接时，在实时日志中显示完整邮件内容
7. **持续使用**: 侧边栏保持打开，可随时切换标签页使用

#### 自动化模式
1. **创建流程**: 在侧边栏点击"自动化流程管理"
2. **新建流程**: 点击"➕ 创建新流程"按钮
3. **配置步骤**:
   - 添加"填充输入框"步骤，使用{{email}}变量
   - 添加"点击按钮"步骤，选择提交按钮
   - 添加"等待元素"步骤，等待验证码输入框
   - 添加"填充输入框"步骤，使用{{code}}变量
   - 添加"人机验证"步骤（如需要）
4. **保存流程**: 配置完成后保存流程
5. **执行流程**: 在目标网站点击"▶️ 运行"按钮
6. **监控执行**: 实时查看执行状态和进度
7. **完成注册**: 流程自动完成整个注册过程

## ⚙️ 配置说明

### 邮箱域名配置
- **可用域名**: 多个域名用逗号分隔，如 `domain1.com,domain2.com,domain3.com`
- **目标邮箱**: 所有域名邮件通过CF转发到此邮箱地址
- **域名格式**: 不需要包含@符号，系统会自动添加
- **配置帮助**: 点击域名配置旁的❓图标查看详细的Cloudflare配置指南

### PIN码设置
- **PIN码**: 您的tempmail.plus PIN码，用于访问临时邮箱服务
- **明文显示**: 为方便查看和修改，PIN码以明文形式显示

### 数据导入导出
- **完整备份**: 支持导出所有配置数据，包括邮箱域名配置和自动化流程
- **一键恢复**: 导入配置文件可完整恢复所有设置和流程数据
- **数据迁移**: 便于在不同设备间同步配置和流程
- **备份建议**: 建议定期导出配置文件作为备份

### 内置配置
- **API地址**: 固定为 `https://tempmail.plus/api`，无需配置
- **重试设置**: 自动重试10次，间隔3秒，超时10秒
- **历史记录**: 邮箱历史最多1000个
- **链接处理**: 自动检测和过滤邮件中的有效链接

## 🛠️ 技术架构

### 项目结构
```
├── manifest.json          # Chrome扩展配置 (Manifest V3)
├── background.js          # 后台服务脚本
├── popup/                 # Popup界面 (保留兼容性)
│   ├── popup.html         # 界面结构
│   ├── popup.css          # 界面样式
│   └── popup.js           # 界面逻辑
├── sidepanel/             # 侧边栏界面 (主要界面)
│   ├── flow-manager-sidebar.html  # 侧边栏结构
│   ├── flow-manager-sidebar.css   # 侧边栏样式
│   └── flow-manager-sidebar.js    # 侧边栏逻辑
├── options/               # 流程管理页面
│   ├── flow-manager.html  # 完整流程管理界面
│   ├── flow-manager.css   # 管理界面样式
│   └── flow-manager.js    # 管理界面逻辑
├── content/               # 内容脚本
│   ├── automation-content.js      # 自动化内容脚本
│   └── element-selector.js        # 元素选择器
├── utils/                 # 核心工具
│   ├── storage.js         # 存储管理
│   ├── email-generator.js # 邮箱生成
│   ├── api.js            # API接口
│   ├── automation-*.js   # 自动化相关工具
│   └── ...               # 其他工具类
├── templates/             # 流程模板
└── icons/                # 图标资源
```

### 核心模块
- **StorageManager**: 简化的配置和数据存储管理
- **EmailGenerator**: 智能邮箱地址生成 (100个姓氏+100个名字)
- **ApiManager**: tempmail.plus API交互 (固定API地址)
- **BackgroundService**: 侧边栏管理和后台任务处理
- **AutomationManager**: 自动化流程管理和调度
- **AutomationRunner**: 流程执行引擎和步骤处理
- **FlowEditor**: 可视化流程编辑器
- **AutomationValidator**: 流程配置验证和错误检查

### 技术特性
- **Chrome V3**: 完全兼容最新扩展规范
- **侧边栏API**: 使用chrome.sidePanel提供持久化体验
- **本地存储**: 使用chrome.storage.local安全存储
- **模块化设计**: 清晰的代码组织结构
- **响应式设计**: 专为侧边栏窄屏优化的UI
- **错误处理**: 完善的异常处理机制
- **自动化引擎**: 基于Chrome扩展API的页面自动化
- **内容脚本**: 跨域页面操作和元素交互
- **变量系统**: 动态变量解析和替换机制
- **流程调度**: 智能的步骤执行和状态管理

## 🎯 使用场景

### Cloudflare域名转发详细配置

#### 步骤1：准备域名
1. **购买域名**: 在任意域名注册商购买域名（如：example1.com, example2.com）
2. **添加到Cloudflare**: 将域名添加到Cloudflare管理
3. **更新DNS**: 将域名的DNS服务器指向Cloudflare

#### 步骤2：配置邮件转发
1. **进入Cloudflare控制台** → 选择域名 → **Email** → **Email Routing**
2. **启用Email Routing**: 点击"Enable Email Routing"
3. **添加目标邮箱**:
   - 点击"Destination addresses" → "Add destination"
   - 输入您的tempmail.plus邮箱地址（如：user123@tempmail.plus）
   - 验证邮箱地址
4. **创建转发规则**:
   - 点击"Routing rules" → "Create rule"
   - **Matcher**: 选择"Catch-all address"
   - **Action**: 选择"Send to an email"
   - **Destination**: 选择您的tempmail.plus邮箱
   - 点击"Save"

#### 步骤3：验证配置
1. **检查MX记录**: 确保Cloudflare自动添加了MX记录
2. **测试转发**: 发送测试邮件到 test@yourdomain.com
3. **确认接收**: 在tempmail.plus中查看是否收到邮件

#### 步骤4：工具配置
1. **打开扩展设置页面**
2. **配置域名**: 在"可用域名"中输入您的域名（逗号分隔）
   ```
   example1.com,example2.com,example3.com
   ```
3. **设置目标邮箱**: 输入您的tempmail.plus邮箱地址
4. **配置PIN码**: 输入您的tempmail.plus PIN码
5. **保存设置**: 点击保存按钮

#### 使用示例
配置完成后，工具会生成如下格式的邮箱：
- `johnsmith123456@example1.com`
- `maryjohnson789012@example2.com`
- `davidwilson345678@example3.com`

所有发送到这些邮箱的邮件都会自动转发到您的tempmail.plus邮箱。

### 自动化注册
- **完整流程自动化**: 从邮箱填入到验证码输入的全流程自动化
- **多网站适配**: 创建针对不同网站的专用自动化流程
- **人机验证处理**: 智能暂停等待用户完成人机验证
- **错误恢复**: 自动重试和错误处理机制

### 批量注册
- 支持快速生成大量不同的邮箱地址
- 历史记录功能便于管理已使用的邮箱
- 验证码自动获取提高效率
- 自动化流程批量执行

### 隐私保护
- 使用临时邮箱保护真实邮箱地址
- 本地存储确保数据安全
- 支持随时清理历史记录

## 🔧 开发指南

### 环境要求
- Chrome 88+ 浏览器
- 支持Manifest V3的扩展环境

### 调试方法
- **侧边栏界面**: 打开侧边栏 → 右键 → 检查
- **后台脚本**: 扩展管理 → 检查视图 → Service Worker
- **设置页面**: 设置页面 → F12开发者工具

### 自定义开发
1. 修改`utils/email-generator.js`中的姓名列表
2. 调整`utils/storage.js`中的默认配置
3. 自定义`popup/popup.css`中的界面样式

## 📝 更新日志

### v1.4.0 (当前版本)
- ✅ **自动化流程超时机制优化**: 统一所有步骤类型的超时处理策略
  - 所有步骤现在都使用"高级选项"中的"等待超时"时间作为超时配置
  - 超时后自动继续执行下一步，而不是停止整个流程
  - 支持填充输入框、点击按钮、等待元素、页面导航等所有步骤类型
  - 提供友好的超时日志提示和跳过步骤说明
- ✅ **测试流程功能修复**: 修复了"测试流程"按钮报错"流程配置不存在"的问题
  - 支持测试当前正在新增/编辑的流程步骤
  - 无需保存即可直接测试流程配置
  - 改进了临时流程的创建和执行逻辑

### v1.3.0
- ✅ **智能链接处理**: 当邮件无验证码但有链接时，自动在新标签页打开相关链接
- ✅ **邮件内容显示**: 当既无验证码也无链接时，在实时日志中显示完整邮件内容
- ✅ **系统链接过滤**: 自动过滤邮件签名、头像等系统区域链接，只保留有效链接
- ✅ **Service Worker兼容**: 使用正则表达式解析HTML，完全兼容Chrome扩展Service Worker环境
- ✅ **深色主题适配**: 优化邮件内容在深色主题下的显示效果，确保文字清晰可读
- ✅ **数据导入导出增强**: 支持完整的配置和流程数据备份与恢复
- ✅ **错误处理优化**: 改进验证码获取失败时的处理逻辑和用户反馈

### v1.2.0
- ✅ **自动化流程系统**: 完整的可视化流程创建和管理
- ✅ **智能步骤支持**: 填充输入框、点击按钮、等待元素、人机验证
- ✅ **变量系统**: 内置{{email}}和{{code}}变量自动替换
- ✅ **流程执行引擎**: 支持暂停、恢复、停止的流程控制
- ✅ **可视化编辑器**: 直观的流程编辑和配置界面
- ✅ **智能元素选择**: 自动生成和验证页面元素选择器
- ✅ **流程导入导出**: 支持流程的备份和分享
- ✅ **变量助手**: 快速插入变量的用户界面

### v1.1.0
- ✅ **侧边栏模式**: 改为Chrome侧边栏，提供持久化体验
- ✅ **简化配置**: 移除复杂配置，只保留核心设置
- ✅ **UI优化**: 专为侧边栏优化的响应式设计
- ✅ **固定API**: 内置tempmail.plus API地址，简化配置
- ✅ **布局优化**: 按钮与卡片宽度完全匹配
- ✅ **Cloudflare指南**: 详细的域名转发配置说明

### v1.0.0
- ✅ 智能邮箱生成 (姓氏+名字+6位数字格式)
- ✅ 自动验证码获取
- ✅ 多域名配置支持
- ✅ 独立窗口模式
- ✅ 历史记录管理
- ✅ 完整配置系统
- ✅ Cloudflare转发支持

### 计划功能
- 🔄 更多自动化步骤类型（滚动、悬停、条件判断等）
- 🔄 流程模板市场和分享
- 🔄 批量流程执行和管理
- 🔄 高级变量系统和自定义变量
- 🔄 流程执行统计和分析
- 🔄 智能元素识别和自动选择器生成
- 🔄 邮箱模板自定义
- 🔄 验证码格式识别优化
- 🔄 更多邮件服务支持
- 🔄 链接安全性检测和过滤
- 🔄 移动端适配和触摸操作支持

## ⚠️ 注意事项

### 使用限制
- 需要有效的tempmail.plus PIN码
- 依赖目标邮箱服务的稳定性
- 验证码获取速度取决于邮件服务响应时间
- Chrome侧边栏工具栏按钮无法隐藏（浏览器限制）

### 安装说明
- **CRX安装**: 需要开启Chrome开发者模式才能安装CRX文件
- **安全提示**: Chrome可能显示"无法验证此扩展程序"的警告，这是正常现象
- **更新方式**: 新版本发布时，下载新的CRX文件重新安装即可
- **数据保留**: 重新安装时会保留之前的配置和历史记录

### 隐私安全
- 所有数据仅存储在本地浏览器中
- 不会上传任何个人信息到服务器
- 建议定期清理历史记录

### 免责声明
- 本工具仅供学习和合法用途使用
- 请遵守相关网站的服务条款
- 使用本工具产生的后果由用户自行承担

## 🤝 支持与反馈

如有问题或建议，欢迎通过以下方式联系：

### GitHub
- **🐛 [报告问题](https://github.com/w154594742/tempmail-code-get/issues)**: 遇到Bug或错误
- **💡 [功能建议](https://github.com/w154594742/tempmail-code-get/issues)**: 提出新功能想法
- **� [下载更新](https://github.com/w154594742/tempmail-code-get/releases)**: 获取最新版本
- **⭐ [Star项目](https://github.com/w154594742/tempmail-code-get)**: 支持项目发展

### 贡献代码
- Fork项目并提交Pull Request
- 参与代码审查和讨论
- 帮助改进文档和测试

---

**感谢使用临时邮箱验证码获取工具！** 🎉
