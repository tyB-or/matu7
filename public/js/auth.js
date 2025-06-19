// 认证相关函数

// 检查用户是否已登录
function checkAuth() {
  const token = localStorage.getItem('auth_token');
  
  // 如果没有token，重定向到登录页面
  if (!token) {
    console.log('未检测到认证令牌，重定向到登录页面');
    window.location.href = '/login';
    return false;
  }
  
  return true;
}

// 添加认证令牌到API请求
function addAuthHeader(headers = {}) {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return {
      ...headers,
      'Authorization': token
    };
  }
  return headers;
}

// 退出登录
function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}

// 初始化退出按钮
function initLogoutButton() {
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'logout-btn';
  logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> 退出';
  logoutBtn.onclick = logout;
  
  // 添加到侧边栏logo区域旁边
  const checkInterval = setInterval(() => {
    const logoArea = document.querySelector('.sidebar .logo');
    if (logoArea) {
      clearInterval(checkInterval);
      
      // 创建一个容器来包含logo和退出按钮
      const container = document.createElement('div');
      container.className = 'logo-container';
      
      // 获取原始logo元素的内容
      const logoContent = logoArea.innerHTML;
      
      // 清空原始logo元素
      logoArea.innerHTML = '';
      
      // 创建logo内容元素
      const logoElement = document.createElement('div');
      logoElement.className = 'logo-text';
      logoElement.innerHTML = logoContent;
      
      // 将logo内容和退出按钮添加到容器中
      container.appendChild(logoElement);
      container.appendChild(logoutBtn);
      
      // 将容器添加到原始logo元素中
      logoArea.appendChild(container);
    }
  }, 100);
  
  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .logo-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .logo-text {
      display: flex;
      align-items: center;
    }
    .logout-btn {
      background-color: #f5222d;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      cursor: pointer;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: background-color 0.2s;
    }
    .logout-btn:hover {
      background-color: #ff4d4f;
    }
    .logout-btn i {
      font-size: 13px;
    }
  `;
  document.head.appendChild(style);
}

// 页面加载时检查认证状态
document.addEventListener('DOMContentLoaded', function() {
  // 如果当前不是登录页面，检查认证状态
  if (!window.location.pathname.includes('/login')) {
    if (!checkAuth()) {
      return; // 如果未认证，checkAuth 会自动重定向
    }
    
    // 初始化退出按钮
    initLogoutButton();
    
    // 拦截所有 fetch 请求，添加认证头
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
      // 如果是API请求，添加认证头
      if (url.startsWith('/api/')) {
        options.headers = addAuthHeader(options.headers || {});
      }
      return originalFetch(url, options);
    };
  }
}); 