// 存储管理工具
class StorageManager {
  constructor() {
    this.defaultConfig = {
      emailConfig: {
        domains: "demoan1.com,demoan2.com,demoan3.com",
        targetEmail: "abcd123@mailto.plus",
        currentDomainIndex: 0
      },
      tempMailConfig: {
        epin: ""
      },
      historyData: {
        lastEmail: null,
        lastVerificationCode: null,
        emailHistory: [],
        codeHistory: [],
        maxEmailHistory: 100,
        maxCodeHistory: 10
      }
    };
  }

  // 获取配置项
  async getConfig(key = null) {
    try {
      const result = await chrome.storage.local.get(null);
      const config = { ...this.defaultConfig, ...result };

      if (key) {
        return config[key] || this.defaultConfig[key];
      }
      return config;
    } catch (error) {
      console.error('获取配置失败:', error);
      return key ? this.defaultConfig[key] : this.defaultConfig;
    }
  }

  // 设置配置项
  async setConfig(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error('设置配置失败:', error);
      return false;
    }
  }

  // 重置配置
  async resetConfig() {
    try {
      await chrome.storage.local.clear();
      await chrome.storage.local.set(this.defaultConfig);
      return true;
    } catch (error) {
      console.error('重置配置失败:', error);
      return false;
    }
  }

  // 保存最新邮箱
  async saveLastEmail(email) {
    try {
      const historyData = await this.getConfig('historyData');
      historyData.lastEmail = email;
      await this.setConfig('historyData', historyData);
      return true;
    } catch (error) {
      console.error('保存最新邮箱失败:', error);
      return false;
    }
  }

  // 保存最新验证码
  async saveLastCode(code) {
    try {
      const historyData = await this.getConfig('historyData');
      historyData.lastVerificationCode = code;
      await this.setConfig('historyData', historyData);
      return true;
    } catch (error) {
      console.error('保存最新验证码失败:', error);
      return false;
    }
  }

  // 添加邮箱到历史记录
  async addEmailToHistory(email) {
    try {
      const historyData = await this.getConfig('historyData');
      const emailItem = {
        email: email,
        timestamp: Date.now(),
        id: this.generateId()
      };

      // 检查是否已存在
      const existingIndex = historyData.emailHistory.findIndex(item => item.email === email);
      if (existingIndex !== -1) {
        historyData.emailHistory.splice(existingIndex, 1);
      }

      // 添加到开头
      historyData.emailHistory.unshift(emailItem);

      // 保持最大数量限制
      if (historyData.emailHistory.length > historyData.maxEmailHistory) {
        historyData.emailHistory = historyData.emailHistory.slice(0, historyData.maxEmailHistory);
      }

      await this.setConfig('historyData', historyData);
      return true;
    } catch (error) {
      console.error('添加邮箱历史失败:', error);
      return false;
    }
  }

  // 添加验证码到历史记录
  async addCodeToHistory(code, email) {
    try {
      const historyData = await this.getConfig('historyData');
      const codeItem = {
        code: code,
        email: email,
        timestamp: Date.now(),
        id: this.generateId()
      };

      // 添加到开头
      historyData.codeHistory.unshift(codeItem);

      // 保持最大数量限制
      if (historyData.codeHistory.length > historyData.maxCodeHistory) {
        historyData.codeHistory = historyData.codeHistory.slice(0, historyData.maxCodeHistory);
      }

      await this.setConfig('historyData', historyData);
      return true;
    } catch (error) {
      console.error('添加验证码历史失败:', error);
      return false;
    }
  }

  // 获取邮箱历史记录
  async getEmailHistory() {
    try {
      const historyData = await this.getConfig('historyData');
      return historyData.emailHistory || [];
    } catch (error) {
      console.error('获取邮箱历史失败:', error);
      return [];
    }
  }

  // 获取验证码历史记录
  async getCodeHistory() {
    try {
      const historyData = await this.getConfig('historyData');
      return historyData.codeHistory || [];
    } catch (error) {
      console.error('获取验证码历史失败:', error);
      return [];
    }
  }

  // 清除历史记录
  async clearHistory(type) {
    try {
      const historyData = await this.getConfig('historyData');
      
      if (type === 'email') {
        historyData.emailHistory = [];
      } else if (type === 'code') {
        historyData.codeHistory = [];
      } else if (type === 'all') {
        historyData.emailHistory = [];
        historyData.codeHistory = [];
        historyData.lastEmail = null;
        historyData.lastVerificationCode = null;
      }

      await this.setConfig('historyData', historyData);
      return true;
    } catch (error) {
      console.error('清除历史记录失败:', error);
      return false;
    }
  }

  // 获取上次邮箱
  async getLastEmail() {
    try {
      const historyData = await this.getConfig('historyData');
      return historyData.lastEmail;
    } catch (error) {
      console.error('获取上次邮箱失败:', error);
      return null;
    }
  }

  // 获取上次验证码
  async getLastCode() {
    try {
      const historyData = await this.getConfig('historyData');
      return historyData.lastVerificationCode;
    } catch (error) {
      console.error('获取上次验证码失败:', error);
      return null;
    }
  }

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // 导出配置
  async exportConfig() {
    try {
      const config = await this.getConfig();
      return JSON.stringify(config, null, 2);
    } catch (error) {
      console.error('导出配置失败:', error);
      return null;
    }
  }

  // 导入配置
  async importConfig(configData) {
    try {
      const config = JSON.parse(configData);
      await chrome.storage.local.clear();
      await chrome.storage.local.set(config);
      return true;
    } catch (error) {
      console.error('导入配置失败:', error);
      return false;
    }
  }
}

// 导出单例
const storageManager = new StorageManager();

// 兼容不同的模块系统
if (typeof module !== 'undefined' && module.exports) {
  module.exports = storageManager;
} else if (typeof window !== 'undefined') {
  globalThis.storageManager = storageManager;
} else {
  // Service Worker环境
  globalThis.storageManager = storageManager;
}
