// Popup界面逻辑
class PopupManager {
  constructor() {
    this.isGettingCode = false;
    this.currentHistoryType = null;
    this.init();
  }

  async init() {
    // 检查是否在独立窗口中
    this.checkWindowType();

    // 绑定事件监听器
    this.bindEventListeners();

    // 监听来自background的消息
    this.listenToBackgroundMessages();

    // 加载初始数据
    await this.loadInitialData();

    console.log('Popup初始化完成');
  }

  // 检查窗口类型
  checkWindowType() {
    // 侧边栏模式
    document.body.classList.add('sidepanel');
    document.title = '临时邮箱工具';
  }

  // 绑定事件监听器
  bindEventListeners() {
    // 邮箱相关
    document.getElementById('generateEmailBtn').addEventListener('click', () => this.generateEmail());
    document.getElementById('copyEmailBtn').addEventListener('click', () => this.copyEmail());
    document.getElementById('emailHistoryBtn').addEventListener('click', () => this.showEmailHistory());

    // 验证码相关
    document.getElementById('getCodeBtn').addEventListener('click', () => this.getVerificationCode());
    document.getElementById('stopCodeBtn').addEventListener('click', () => this.stopGettingCode());
    document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyCode());
    document.getElementById('codeHistoryBtn').addEventListener('click', () => this.showCodeHistory());

    // 设置相关
    document.getElementById('settingsBtn').addEventListener('click', () => this.showSettings());

    // 模态框相关
    document.getElementById('closeHistoryModal').addEventListener('click', () => this.closeHistoryModal());
    document.getElementById('clearHistoryBtn').addEventListener('click', () => this.clearHistory());
    document.getElementById('exportHistoryBtn').addEventListener('click', () => this.exportHistory());

    // 搜索功能
    document.getElementById('searchInput').addEventListener('input', (e) => this.searchHistory(e.target.value));

    // 点击模态框外部关闭
    document.getElementById('historyModal').addEventListener('click', (e) => {
      if (e.target.id === 'historyModal') {
        this.closeHistoryModal();
      }
    });


  }

  // 监听来自background的消息
  listenToBackgroundMessages() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case 'codeProgress':
          this.updateCodeProgress(message.progress);
          break;
        case 'codeResult':
          this.handleCodeResult(message);
          break;
        case 'codeStopped':
          this.handleCodeStopped(message);
          break;
      }
    });
  }

  // 加载初始数据
  async loadInitialData() {
    try {
      this.showLoading('加载数据中...');
      
      // 获取上次的邮箱和验证码
      const response = await this.sendMessageToBackground({ action: 'getLastData' });
      
      if (response.success) {
        if (response.lastEmail) {
          document.getElementById('emailInput').value = response.lastEmail;
        }
        if (response.lastCode) {
          document.getElementById('codeInput').value = response.lastCode;
        }
      }



      // 清除默认状态并添加初始状态
      this.clearStatus();

      this.hideLoading();
      this.updateStatus('就绪', 'ready');
    } catch (error) {
      console.error('加载初始数据失败:', error);
      this.hideLoading();
      this.showNotification('加载数据失败', 'error');
    }
  }

  // 生成邮箱
  async generateEmail() {
    try {
      this.showLoading('生成邮箱中...');
      this.updateStatus('正在生成邮箱...', 'working');

      const response = await this.sendMessageToBackground({ action: 'generateEmail' });
      
      if (response.success) {
        document.getElementById('emailInput').value = response.email;
        this.updateStatus('邮箱生成成功', 'success');
        this.showNotification('邮箱生成成功', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('生成邮箱失败:', error);
      this.updateStatus('生成邮箱失败: ' + error.message, 'error');
      this.showNotification('生成邮箱失败', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // 复制邮箱
  async copyEmail() {
    const email = document.getElementById('emailInput').value;
    if (!email) {
      this.showNotification('没有邮箱可复制', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(email);
      this.showNotification('邮箱已复制', 'success');
    } catch (error) {
      console.error('复制邮箱失败:', error);
      this.showNotification('复制失败', 'error');
    }
  }

  // 获取验证码
  async getVerificationCode() {
    if (this.isGettingCode) {
      this.showNotification('正在获取验证码中...', 'warning');
      return;
    }

    try {
      this.isGettingCode = true;
      this.updateButtonStates(true);
      this.updateStatus('开始获取验证码...', 'working');

      const response = await this.sendMessageToBackground({ 
        action: 'getVerificationCode',
        maxRetries: 5,
        retryInterval: 3000
      });
      
      if (!response.success) {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('获取验证码失败:', error);
      this.updateStatus('获取验证码失败: ' + error.message, 'error');
      this.showNotification('获取验证码失败', 'error');
      this.isGettingCode = false;
      this.updateButtonStates(false);
    }
  }

  // 停止获取验证码
  async stopGettingCode() {
    try {
      // 立即更新UI状态
      this.isGettingCode = false;
      this.updateButtonStates(false);
      this.updateStatus('正在停止获取验证码...', 'warning');

      const response = await this.sendMessageToBackground({ action: 'stopGettingCode' });

      if (response.success) {
        this.updateStatus('已停止获取验证码', 'ready');
      } else {
        this.updateStatus('停止失败', 'error');
        this.showNotification('停止失败', 'error');
      }
    } catch (error) {
      console.error('停止获取验证码失败:', error);
      this.updateStatus('停止失败', 'error');
      this.showNotification('停止失败', 'error');
    }
  }

  // 复制验证码
  async copyCode() {
    const code = document.getElementById('codeInput').value;
    if (!code) {
      this.showNotification('没有验证码可复制', 'warning');
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      this.showNotification('验证码已复制', 'success');
    } catch (error) {
      console.error('复制验证码失败:', error);
      this.showNotification('复制失败', 'error');
    }
  }

  // 显示邮箱历史
  async showEmailHistory() {
    this.currentHistoryType = 'email';
    await this.showHistory('email', '📧 邮箱历史记录');
  }

  // 显示验证码历史
  async showCodeHistory() {
    this.currentHistoryType = 'code';
    await this.showHistory('code', '🔐 验证码历史记录');
  }



  // 显示历史记录
  async showHistory(type, title) {
    try {
      this.showLoading('加载历史记录...');
      
      const response = await this.sendMessageToBackground({ 
        action: 'getHistory',
        type: type
      });
      
      if (response.success) {
        document.getElementById('historyModalTitle').textContent = title;
        
        // 显示/隐藏搜索框
        const searchContainer = document.getElementById('searchContainer');
        if (type === 'email') {
          searchContainer.style.display = 'block';
        } else {
          searchContainer.style.display = 'none';
        }
        
        this.renderHistoryList(response.history, type);
        document.getElementById('historyModal').style.display = 'block';
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
      this.showNotification('加载历史记录失败', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // 渲染历史列表
  renderHistoryList(history, type) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-item">暂无历史记录</div>';
      return;
    }

    history.forEach(item => {
      const historyItem = document.createElement('div');
      historyItem.className = 'history-item';
      historyItem.addEventListener('click', () => this.selectHistoryItem(item, type));

      if (type === 'email') {
        historyItem.innerHTML = `
          <div class="history-email">${item.email}</div>
          <div class="history-time">${this.formatTime(item.timestamp)}</div>
        `;
      } else if (type === 'code') {
        historyItem.innerHTML = `
          <div class="history-code">${item.code}</div>
          <div class="history-related">${item.email}</div>
          <div class="history-time">${this.formatTime(item.timestamp)}</div>
        `;
      }

      historyList.appendChild(historyItem);
    });
  }

  // 选择历史项目
  async selectHistoryItem(item, type) {
    try {
      if (type === 'email') {
        document.getElementById('emailInput').value = item.email;
        await navigator.clipboard.writeText(item.email);
        this.showNotification('邮箱已选择并复制', 'success');
      } else if (type === 'code') {
        document.getElementById('codeInput').value = item.code;
        await navigator.clipboard.writeText(item.code);
        this.showNotification('验证码已选择并复制', 'success');
      }
      
      this.closeHistoryModal();
    } catch (error) {
      console.error('选择历史项目失败:', error);
      this.showNotification('操作失败', 'error');
    }
  }

  // 搜索历史记录
  searchHistory(query) {
    const historyItems = document.querySelectorAll('.history-item');
    
    historyItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      const isVisible = text.includes(query.toLowerCase());
      item.style.display = isVisible ? 'block' : 'none';
    });
  }

  // 清除历史记录
  async clearHistory() {
    if (!this.currentHistoryType) return;

    const confirmMessage = this.currentHistoryType === 'email' ? 
      '确定要清除所有邮箱历史记录吗？' : 
      '确定要清除所有验证码历史记录吗？';

    if (!confirm(confirmMessage)) return;

    try {
      this.showLoading('清除历史记录...');
      
      const response = await this.sendMessageToBackground({ 
        action: 'clearHistory',
        type: this.currentHistoryType
      });
      
      if (response.success) {
        this.showNotification('历史记录已清除', 'success');
        this.closeHistoryModal();
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('清除历史记录失败:', error);
      this.showNotification('清除失败', 'error');
    } finally {
      this.hideLoading();
    }
  }

  // 导出历史记录
  async exportHistory() {
    if (!this.currentHistoryType) return;

    try {
      const response = await this.sendMessageToBackground({ 
        action: 'getHistory',
        type: this.currentHistoryType
      });
      
      if (response.success) {
        const data = JSON.stringify(response.history, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentHistoryType}_history_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('历史记录已导出', 'success');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('导出历史记录失败:', error);
      this.showNotification('导出失败', 'error');
    }
  }

  // 显示设置
  async showSettings() {
    try {
      // 打开options页面
      chrome.runtime.openOptionsPage();
    } catch (error) {
      console.error('打开设置页面失败:', error);
      this.showNotification('打开设置失败', 'error');
    }
  }



  // 关闭历史模态框
  closeHistoryModal() {
    document.getElementById('historyModal').style.display = 'none';
    document.getElementById('searchInput').value = '';
    this.currentHistoryType = null;
  }



  // 更新验证码进度
  updateCodeProgress(progress) {
    if (progress.success) {
      document.getElementById('codeInput').value = progress.code;
      this.updateStatus(progress.message, 'success');
      this.isGettingCode = false;
      this.updateButtonStates(false);
    } else if (progress.failed) {
      this.updateStatus(progress.message, 'error');
      this.isGettingCode = false;
      this.updateButtonStates(false);
    } else if (progress.error) {
      this.updateStatus(progress.message, 'error');
    } else {
      this.updateStatus(progress.message, 'working');
    }
  }

  // 处理验证码结果
  handleCodeResult(result) {
    if (result.success) {
      document.getElementById('codeInput').value = result.code;
      this.updateStatus('验证码获取成功', 'success');
    } else {
      this.updateStatus('验证码获取失败: ' + result.error, 'error');
    }

    this.isGettingCode = false;
    this.updateButtonStates(false);
  }

  // 处理验证码停止
  handleCodeStopped(result) {
    this.updateStatus(result.message, 'ready');
    this.isGettingCode = false;
    this.updateButtonStates(false);
  }

  // 更新按钮状态
  updateButtonStates(isGetting) {
    const getCodeBtn = document.getElementById('getCodeBtn');
    const stopCodeBtn = document.getElementById('stopCodeBtn');

    if (isGetting) {
      getCodeBtn.style.display = 'none';
      stopCodeBtn.style.display = 'inline-block';
    } else {
      getCodeBtn.style.display = 'inline-block';
      stopCodeBtn.style.display = 'none';
    }
  }

  // 清除状态
  clearStatus() {
    const statusContainer = document.getElementById('statusContainer');
    statusContainer.innerHTML = '';
  }

  // 更新状态
  updateStatus(message, type = 'info') {
    const statusContainer = document.getElementById('statusContainer');
    const statusItem = document.createElement('div');
    statusItem.className = 'status-item';

    const statusDot = document.createElement('span');
    statusDot.className = `status-dot ${type}`;

    const statusText = document.createElement('span');
    statusText.className = 'status-text';

    // 添加时间戳
    const now = new Date();
    const timeStr = now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    statusText.textContent = `[${timeStr}] ${message}`;

    statusItem.appendChild(statusDot);
    statusItem.appendChild(statusText);

    // 添加到底部（最新消息在下方）
    statusContainer.appendChild(statusItem);

    // 限制状态项数量，删除最旧的（顶部的）
    const statusItems = statusContainer.querySelectorAll('.status-item');
    if (statusItems.length > 5) {
      statusContainer.removeChild(statusItems[0]);
    }

    // 自动滚动到最新消息
    statusContainer.scrollTop = statusContainer.scrollHeight;
  }

  // 显示加载遮罩
  showLoading(text = '处理中...') {
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.querySelector('.loading-text');
    loadingText.textContent = text;
    loadingOverlay.style.display = 'flex';
  }

  // 隐藏加载遮罩
  hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
  }

  // 显示通知
  showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    // 3秒后自动隐藏
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }

  // 发送消息到background
  async sendMessageToBackground(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  // 格式化时间
  formatTime(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }


}

// 初始化Popup管理器
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
