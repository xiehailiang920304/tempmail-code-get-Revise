// Service Worker - 后台脚本
importScripts('utils/storage.js', 'utils/email-generator.js', 'utils/api.js');

class BackgroundService {
  constructor() {
    this.isGettingCode = false;
    this.codeRequestController = null;
    this.init();
  }

  async init() {
    // 监听消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 保持消息通道开放
    });

    // 监听插件安装
    chrome.runtime.onInstalled.addListener((details) => {
      this.handleInstalled(details);
    });

    // 监听插件启动
    chrome.runtime.onStartup.addListener(() => {
      this.handleStartup();
    });

    // 监听插件图标点击
    chrome.action.onClicked.addListener((tab) => {
      this.handleActionClick(tab);
    });

    console.log('Background Service 初始化完成');
  }

  // 处理消息
  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'generateEmail':
          await this.handleGenerateEmail(message, sendResponse);
          break;
        
        case 'getVerificationCode':
          await this.handleGetVerificationCode(message, sendResponse);
          break;
        
        case 'stopGettingCode':
          await this.handleStopGettingCode(message, sendResponse);
          break;
        
        case 'getHistory':
          await this.handleGetHistory(message, sendResponse);
          break;
        
        case 'clearHistory':
          await this.handleClearHistory(message, sendResponse);
          break;
        
        case 'getLastData':
          await this.handleGetLastData(message, sendResponse);
          break;
        
        case 'testConnection':
          await this.handleTestConnection(message, sendResponse);
          break;


        
        case 'getConfig':
          await this.handleGetConfig(message, sendResponse);
          break;
        
        case 'setConfig':
          await this.handleSetConfig(message, sendResponse);
          break;

        case 'resetConfig':
          await this.handleResetConfig(message, sendResponse);
          break;

        case 'exportConfig':
          await this.handleExportConfig(message, sendResponse);
          break;

        case 'importConfig':
          await this.handleImportConfig(message, sendResponse);
          break;

        default:
          sendResponse({ success: false, error: '未知的操作类型' });
      }
    } catch (error) {
      console.error('处理消息失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 生成邮箱
  async handleGenerateEmail(message, sendResponse) {
    try {
      const email = await emailGenerator.generateEmail();
      sendResponse({ 
        success: true, 
        email: email,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('生成邮箱失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 获取验证码
  async handleGetVerificationCode(message, sendResponse) {
    if (this.isGettingCode) {
      sendResponse({ success: false, error: '正在获取验证码中，请稍候' });
      return;
    }

    try {
      this.isGettingCode = true;
      this.codeRequestController = new AbortController();

      const { maxRetries = 5, retryInterval = 3000 } = message;

      // 发送初始状态
      sendResponse({ 
        success: true, 
        message: '开始获取验证码...',
        status: 'started'
      });

      // 获取验证码
      const code = await apiManager.getVerificationCode(
        maxRetries,
        retryInterval,
        (progress) => {
          // 发送进度更新
          this.sendMessageToPopup({
            type: 'codeProgress',
            progress: progress
          });
        },
        this.codeRequestController.signal
      );

      this.isGettingCode = false;
      
      // 发送成功结果
      this.sendMessageToPopup({
        type: 'codeResult',
        success: true,
        code: code,
        timestamp: Date.now()
      });

    } catch (error) {
      this.isGettingCode = false;
      console.error('获取验证码失败:', error);

      // 如果是中断错误，不发送失败消息
      if (error.message === '获取验证码已被中断' || error.message === '延迟被中断') {
        console.log('验证码获取已被用户中断');
        return;
      }

      // 发送失败结果
      this.sendMessageToPopup({
        type: 'codeResult',
        success: false,
        error: error.message
      });
    }
  }

  // 停止获取验证码
  async handleStopGettingCode(message, sendResponse) {
    if (this.codeRequestController) {
      this.codeRequestController.abort();
      this.codeRequestController = null;
    }

    this.isGettingCode = false;

    sendResponse({
      success: true,
      message: '已停止获取验证码'
    });
  }

  // 获取历史记录
  async handleGetHistory(message, sendResponse) {
    try {
      const { type } = message;
      let history = [];

      if (type === 'email') {
        history = await storageManager.getEmailHistory();
      } else if (type === 'code') {
        history = await storageManager.getCodeHistory();
      }

      sendResponse({ 
        success: true, 
        history: history,
        type: type
      });
    } catch (error) {
      console.error('获取历史记录失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 清除历史记录
  async handleClearHistory(message, sendResponse) {
    try {
      const { type } = message;
      const result = await storageManager.clearHistory(type);
      
      sendResponse({ 
        success: result, 
        message: result ? '历史记录已清除' : '清除历史记录失败'
      });
    } catch (error) {
      console.error('清除历史记录失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 获取上次数据
  async handleGetLastData(message, sendResponse) {
    try {
      const lastEmail = await storageManager.getLastEmail();
      const lastCode = await storageManager.getLastCode();
      
      sendResponse({ 
        success: true, 
        lastEmail: lastEmail,
        lastCode: lastCode
      });
    } catch (error) {
      console.error('获取上次数据失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 测试连接
  async handleTestConnection(message, sendResponse) {
    try {
      const result = await apiManager.testConnection();
      sendResponse({ 
        success: true, 
        connected: result,
        message: result ? 'API连接正常' : 'API连接失败'
      });
    } catch (error) {
      console.error('测试连接失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 获取配置
  async handleGetConfig(message, sendResponse) {
    try {
      const { key } = message;
      const config = await storageManager.getConfig(key);
      
      sendResponse({ 
        success: true, 
        config: config
      });
    } catch (error) {
      console.error('获取配置失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 设置配置
  async handleSetConfig(message, sendResponse) {
    try {
      const { key, value } = message;
      const result = await storageManager.setConfig(key, value);

      sendResponse({
        success: result,
        message: result ? '配置已保存' : '保存配置失败'
      });
    } catch (error) {
      console.error('设置配置失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 重置配置
  async handleResetConfig(message, sendResponse) {
    try {
      const result = await storageManager.resetConfig();

      sendResponse({
        success: result,
        message: result ? '配置已重置' : '重置配置失败'
      });
    } catch (error) {
      console.error('重置配置失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 导出配置
  async handleExportConfig(message, sendResponse) {
    try {
      const config = await storageManager.exportConfig();

      if (config) {
        sendResponse({
          success: true,
          config: config
        });
      } else {
        sendResponse({ success: false, error: '导出配置失败' });
      }
    } catch (error) {
      console.error('导出配置失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 导入配置
  async handleImportConfig(message, sendResponse) {
    try {
      const { configData } = message;
      const result = await storageManager.importConfig(configData);

      sendResponse({
        success: result,
        message: result ? '配置已导入' : '导入配置失败'
      });
    } catch (error) {
      console.error('导入配置失败:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // 发送消息到popup
  async sendMessageToPopup(message) {
    try {
      await chrome.runtime.sendMessage(message);
    } catch (error) {
      // popup可能未打开，忽略错误
      console.log('发送消息到popup失败 (popup可能未打开):', error.message);
    }
  }

  // 处理插件安装
  async handleInstalled(details) {
    console.log('插件安装/更新:', details.reason);
    
    if (details.reason === 'install') {
      // 首次安装，初始化默认配置
      await storageManager.resetConfig();
      console.log('首次安装，已初始化默认配置');
    } else if (details.reason === 'update') {
      // 更新版本，可能需要迁移数据
      console.log('插件已更新到版本:', chrome.runtime.getManifest().version);
    }
  }

  // 处理插件图标点击
  async handleActionClick(tab) {
    try {
      // 打开侧边栏
      await chrome.sidePanel.open({ tabId: tab.id });
    } catch (error) {
      console.error('打开侧边栏失败:', error);
    }
  }

  // 处理插件启动
  async handleStartup() {
    console.log('插件启动');
    // 可以在这里执行一些启动时的初始化操作
  }
}

// 创建后台服务实例
const backgroundService = new BackgroundService();
