// 配置页面管理器
class OptionsManager {
  constructor() {
    this.init();
  }

  async init() {
    // 绑定事件监听器
    this.bindEventListeners();
    
    // 加载当前配置
    await this.loadCurrentConfig();
    
    console.log('Options页面初始化完成');
  }

  // 绑定事件监听器
  bindEventListeners() {
    // 保存和重置按钮
    document.getElementById('saveBtn').addEventListener('click', () => this.saveConfig());
    document.getElementById('resetBtn').addEventListener('click', () => this.resetConfig());


    
    // 导入导出配置
    document.getElementById('exportConfigBtn').addEventListener('click', () => this.exportConfig());
    document.getElementById('importConfigBtn').addEventListener('click', () => this.importConfig());
    document.getElementById('importFileInput').addEventListener('change', (e) => this.handleImportFile(e));
    

    
    // 输入验证
    this.bindInputValidation();

    // 帮助提示
    this.bindHelpTooltips();
  }

  // 绑定输入验证
  bindInputValidation() {
    // 数字输入验证
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
      input.addEventListener('input', () => this.validateNumberInput(input));
      input.addEventListener('blur', () => this.validateNumberInput(input));
    });

    // URL输入验证
    const urlInputs = document.querySelectorAll('input[type="url"]');
    urlInputs.forEach(input => {
      input.addEventListener('input', () => this.validateUrlInput(input));
      input.addEventListener('blur', () => this.validateUrlInput(input));
    });

    // 域名输入验证
    const domainsInput = document.getElementById('domainsInput');
    if (domainsInput) {
      domainsInput.addEventListener('input', () => this.validateDomainsInput(domainsInput));
      domainsInput.addEventListener('blur', () => this.validateDomainsInput(domainsInput));
    }

    // 目标邮箱验证
    const targetEmailInput = document.getElementById('targetEmailInput');
    if (targetEmailInput) {
      targetEmailInput.addEventListener('input', () => this.validateEmailInput(targetEmailInput));
      targetEmailInput.addEventListener('blur', () => this.validateEmailInput(targetEmailInput));
    }
  }

  // 绑定帮助提示
  bindHelpTooltips() {
    const helpIcons = document.querySelectorAll('.help-icon');
    const tooltip = document.getElementById('tooltip');
    const tooltipClose = document.querySelector('.tooltip-close');

    helpIcons.forEach(icon => {
      icon.addEventListener('click', (e) => {
        e.preventDefault();
        this.showTooltip();
      });
    });

    // 关闭按钮
    if (tooltipClose) {
      tooltipClose.addEventListener('click', () => {
        this.hideTooltip();
      });
    }

    // 点击背景关闭
    if (tooltip) {
      tooltip.addEventListener('click', (e) => {
        if (e.target === tooltip) {
          this.hideTooltip();
        }
      });
    }

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tooltip.style.display !== 'none') {
        this.hideTooltip();
      }
    });
  }

  // 显示帮助提示
  showTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // 防止背景滚动
    }
  }

  // 隐藏帮助提示
  hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
      document.body.style.overflow = ''; // 恢复滚动
    }
  }

  // 加载当前配置
  async loadCurrentConfig() {
    try {
      this.showLoading('加载配置中...');

      // 获取所有配置
      const configs = await Promise.all([
        this.sendMessageToBackground({ action: 'getConfig', key: 'emailConfig' }),
        this.sendMessageToBackground({ action: 'getConfig', key: 'tempMailConfig' })
      ]);

      const [emailConfig, tempMailConfig] = configs.map(c => c.config);

      // 填充邮箱设置
      document.getElementById('domainsInput').value = emailConfig.domains || '';
      document.getElementById('targetEmailInput').value = emailConfig.targetEmail || '';

      // 填充PIN码设置
      document.getElementById('epinInput').value = tempMailConfig.epin || '';

      this.hideLoading();
      this.showStatusMessage('配置加载完成', 'success');
    } catch (error) {
      console.error('加载配置失败:', error);
      this.hideLoading();
      this.showStatusMessage('加载配置失败: ' + error.message, 'error');
    }
  }







  // 保存配置
  async saveConfig() {
    try {
      // 验证所有输入
      // 验证所有输入并获取详细错误信息
      const validationErrors = this.validateAllInputsWithDetails();
      if (validationErrors.length > 0) {
        this.showStatusMessage('配置验证失败：\n' + validationErrors.join('\n'), 'error');
        return;
      }

      this.showLoading('保存配置中...');

      // 收集邮箱配置数据
      const emailConfig = {
        domains: document.getElementById('domainsInput').value.trim(),
        targetEmail: document.getElementById('targetEmailInput').value.trim(),
        currentDomainIndex: 0 // 重置索引（虽然现在使用随机选择）
      };

      // 收集PIN码配置数据
      const tempMailConfig = {
        epin: document.getElementById('epinInput').value.trim()
      };

      // 保存所有配置
      const savePromises = [
        this.sendMessageToBackground({ action: 'setConfig', key: 'emailConfig', value: emailConfig }),
        this.sendMessageToBackground({ action: 'setConfig', key: 'tempMailConfig', value: tempMailConfig })
      ];

      const results = await Promise.all(savePromises);
      const allSuccess = results.every(result => result.success);

      this.hideLoading();

      if (allSuccess) {
        this.showStatusMessage('配置保存成功', 'success');
      } else {
        this.showStatusMessage('部分配置保存失败', 'warning');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      this.hideLoading();
      this.showStatusMessage('保存配置失败: ' + error.message, 'error');
    }
  }

  // 重置配置
  async resetConfig() {
    if (!confirm('确定要重置所有设置吗？这将清除所有配置和历史记录，此操作不可撤销。')) {
      return;
    }

    try {
      this.showLoading('重置配置中...');

      const response = await this.sendMessageToBackground({ action: 'resetConfig' });

      if (response.success) {
        await this.loadCurrentConfig();
        this.showStatusMessage('配置重置成功', 'success');
      } else {
        throw new Error('重置配置失败');
      }
    } catch (error) {
      console.error('重置配置失败:', error);
      this.hideLoading();
      this.showStatusMessage('重置配置失败: ' + error.message, 'error');
    }
  }

  // 导出配置
  async exportConfig() {
    try {
      this.showLoading('导出配置中...');

      const response = await this.sendMessageToBackground({ action: 'exportConfig' });

      if (response.success) {
        const configData = response.config;
        const blob = new Blob([configData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `tempmail_config_${Date.now()}.json`;
        a.click();

        URL.revokeObjectURL(url);
        this.hideLoading();
        this.showStatusMessage('配置导出成功', 'success');
      } else {
        throw new Error('导出配置失败');
      }
    } catch (error) {
      console.error('导出配置失败:', error);
      this.hideLoading();
      this.showStatusMessage('导出配置失败: ' + error.message, 'error');
    }
  }

  // 导入配置
  importConfig() {
    document.getElementById('importFileInput').click();
  }

  // 处理导入文件
  async handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      this.showLoading('导入配置中...');

      const text = await this.readFileAsText(file);
      const configData = JSON.parse(text);

      const response = await this.sendMessageToBackground({ 
        action: 'importConfig', 
        configData: JSON.stringify(configData)
      });

      if (response.success) {
        await this.loadCurrentConfig();
        this.showStatusMessage('配置导入成功', 'success');
      } else {
        throw new Error('导入配置失败');
      }
    } catch (error) {
      console.error('导入配置失败:', error);
      this.hideLoading();
      this.showStatusMessage('导入配置失败: ' + error.message, 'error');
    } finally {
      // 清空文件输入
      event.target.value = '';
    }
  }





  // 验证所有输入
  validateAllInputs() {
    const inputs = document.querySelectorAll('.setting-input, .setting-textarea, .setting-select');
    let allValid = true;

    inputs.forEach(input => {
      const isValid = this.validateInput(input);
      if (!isValid) {
        allValid = false;
      }
    });

    return allValid;
  }

  // 验证所有输入并返回详细错误信息
  validateAllInputsWithDetails() {
    const errors = [];

    // 验证域名配置
    const domainsInput = document.getElementById('domainsInput');
    if (domainsInput) {
      const domainsValue = domainsInput.value.trim();
      if (!domainsValue) {
        errors.push('• 可用域名不能为空');
      } else {
        const domains = domainsValue.split(/[,，]/).map(d => d.trim()).filter(d => d.length > 0);
        if (domains.length === 0) {
          errors.push('• 请至少配置一个有效域名');
        } else {
          const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
          const invalidDomains = domains.filter(domain => !domainRegex.test(domain));
          if (invalidDomains.length > 0) {
            errors.push(`• 域名格式错误: ${invalidDomains.join(', ')} (不需要@符号)`);
          }
        }
      }
    }

    // 验证目标邮箱
    const targetEmailInput = document.getElementById('targetEmailInput');
    if (targetEmailInput) {
      const emailValue = targetEmailInput.value.trim();
      if (!emailValue) {
        errors.push('• 目标邮箱不能为空');
      } else {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(emailValue)) {
          errors.push('• 目标邮箱格式不正确 (如: user@example.com)');
        }
      }
    }

    // 验证PIN码
    const epinInput = document.getElementById('epinInput');
    if (epinInput) {
      const epinValue = epinInput.value.trim();
      if (!epinValue) {
        errors.push('• PIN码不能为空');
      } else if (epinValue.length < 6) {
        errors.push('• PIN码长度至少6位');
      }
    }



    return errors;
  }

  // 验证单个输入
  validateInput(input) {
    const value = input.value.trim();
    let isValid = true;

    // 移除之前的验证类
    input.classList.remove('valid', 'invalid');

    switch (input.type) {
      case 'number':
        isValid = this.validateNumberInput(input);
        break;
      case 'url':
        isValid = this.validateUrlInput(input);
        break;
      default:
        if (input.id === 'domainsInput') {
          isValid = this.validateDomainsInput(input);
        } else if (input.id === 'targetEmailInput') {
          isValid = this.validateEmailInput(input);
        } else if (input.required && !value) {
          isValid = false;
        }
    }

    // 添加验证类
    input.classList.add(isValid ? 'valid' : 'invalid');
    return isValid;
  }

  // 验证数字输入
  validateNumberInput(input) {
    const value = parseInt(input.value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    return !isNaN(value) && value >= min && value <= max;
  }

  // 验证URL输入
  validateUrlInput(input) {
    const value = input.value.trim();
    if (!value) return false;

    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  // 验证域名输入
  validateDomainInput(input) {
    const value = input.value.trim();
    if (!value) return false;

    // 简单的域名格式验证
    const domainRegex = /^@[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
    return domainRegex.test(value);
  }

  // 验证多域名输入
  validateDomainsInput(input) {
    const value = input.value.trim();
    if (!value) return false;

    // 支持中文逗号和英文逗号分隔
    const domains = value.split(/[,，]/).map(domain => domain.trim()).filter(domain => domain.length > 0);
    if (domains.length === 0) return false;

    // 验证每个域名格式（不包含@符号）
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
    return domains.every(domain => domainRegex.test(domain));
  }

  // 验证多域名输入
  validateDomainsInput(input) {
    const value = input.value.trim();
    if (!value) return false;

    // 支持中文逗号和英文逗号分隔
    const domains = value.split(/[,，]/).map(domain => domain.trim()).filter(domain => domain.length > 0);
    if (domains.length === 0) return false;

    // 验证每个域名格式（不包含@符号）
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/;
    return domains.every(domain => domainRegex.test(domain));
  }

  // 验证邮箱输入
  validateEmailInput(input) {
    const value = input.value.trim();
    if (!value) return false;

    // 简单的邮箱格式验证
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(value);
  }

  // 解析文本域行
  parseTextareaLines(elementId) {
    const textarea = document.getElementById(elementId);
    const lines = textarea.value.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    return lines;
  }

  // 读取文件为文本
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('文件读取失败'));
      reader.readAsText(file);
    });
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

  // 显示状态消息
  showStatusMessage(message, type = 'info') {
    const statusMessage = document.getElementById('statusMessage');

    // 支持多行消息显示
    if (message.includes('\n')) {
      // 将换行符转换为HTML换行
      statusMessage.innerHTML = message.replace(/\n/g, '<br>');
    } else {
      statusMessage.textContent = message;
    }

    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    // 5秒后自动隐藏
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);

    // 不自动滚动，让用户保持在当前位置
    // statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

  // 添加工具提示
  addTooltip(element, text) {
    element.setAttribute('data-tooltip', text);
    element.classList.add('tooltip');
  }

  // 移除工具提示
  removeTooltip(element) {
    element.removeAttribute('data-tooltip');
    element.classList.remove('tooltip');
  }

  // 检查配置完整性
  checkConfigIntegrity(config) {
    const requiredFields = {
      emailConfig: ['domains', 'targetEmail'],
      tempMailConfig: ['apiBaseUrl', 'epin'],
      retryConfig: ['maxRetries', 'retryInterval', 'timeout'],
      historyData: ['maxEmailHistory', 'maxCodeHistory'],
      uiConfig: ['logLevel', 'autoRefresh']
    };

    for (const [section, fields] of Object.entries(requiredFields)) {
      if (!config[section]) {
        return { valid: false, error: `缺少配置节: ${section}` };
      }

      for (const field of fields) {
        if (config[section][field] === undefined || config[section][field] === null) {
          return { valid: false, error: `缺少配置项: ${section}.${field}` };
        }
      }
    }

    return { valid: true };
  }

  // 生成配置摘要
  generateConfigSummary() {
    const summary = {
      domains: document.getElementById('domainsInput').value,
      targetEmail: document.getElementById('targetEmailInput').value,
      apiBaseUrl: document.getElementById('apiBaseUrlInput').value,
      maxRetries: document.getElementById('maxRetriesInput').value,
      retryInterval: document.getElementById('retryIntervalInput').value,
      maxEmailHistory: document.getElementById('maxEmailHistoryInput').value,
      maxCodeHistory: document.getElementById('maxCodeHistoryInput').value,
      logLevel: document.getElementById('logLevelSelect').value,
      autoRefresh: document.getElementById('autoRefreshCheckbox').checked
    };

    return summary;
  }

  // 比较配置差异
  compareConfigs(oldConfig, newConfig) {
    const differences = [];

    for (const [key, value] of Object.entries(newConfig)) {
      if (oldConfig[key] !== value) {
        differences.push({
          field: key,
          oldValue: oldConfig[key],
          newValue: value
        });
      }
    }

    return differences;
  }

  // 验证配置兼容性
  validateConfigCompatibility(config) {
    const warnings = [];

    // 检查域名配置
    if (config.domains) {
      const domains = config.domains.split(/[,，]/).map(d => d.trim()).filter(d => d.length > 0);
      if (domains.length === 0) {
        warnings.push('请至少配置一个域名');
      } else if (domains.some(d => d.includes('@'))) {
        warnings.push('域名不需要包含@符号');
      }
    }

    // 检查目标邮箱
    if (config.targetEmail && !config.targetEmail.includes('@')) {
      warnings.push('目标邮箱格式不正确');
    }

    // 检查重试配置
    if (config.maxRetries > 8) {
      warnings.push('过多的重试次数可能导致长时间等待');
    }

    if (config.retryInterval < 2) {
      warnings.push('过短的重试间隔可能导致API限制');
    }

    // 检查历史记录配置
    if (config.maxEmailHistory > 200) {
      warnings.push('过多的邮箱历史记录可能影响性能');
    }

    return warnings;
  }
}

// 初始化Options管理器
document.addEventListener('DOMContentLoaded', () => {
  new OptionsManager();
});
