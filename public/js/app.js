// 全局变量
let currentOfflineToolId = null;
let currentWebToolId = null;
let currentWebNoteId = null;
let currentCategory = null; // 当前选中的分类

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  console.log('页面加载完成，开始初始化...');
  
  // 检查并初始化配置文件
  checkAndInitConfig();
  console.log('配置文件检查完成');
  
  // 初始化导航
  initNavigation();
  console.log('导航初始化完成');
  
  // 初始化离线工具页面
  initOfflineToolsPage();
  console.log('离线工具页面初始化完成');
  
  // 初始化网页工具页面
  initWebToolsPage();
  console.log('网页工具页面初始化完成');
  
  // 初始化网页笔记页面
  initWebNotesPage();
  console.log('网页笔记页面初始化完成');
  
  // 初始化笔记面板的点击外部关闭功能
  initNotePanelClickOutside();
  console.log('笔记面板点击外部关闭功能初始化完成');
  
  // 初始化笔记面板的拖动调整功能
  initNotePanelResize();
  console.log('笔记面板拖动调整功能初始化完成');
  
  // 默认展开离线工具下拉菜单
  document.getElementById('offline-tools-dropdown').classList.add('open');
  
  // 设置定期自动同步（每5分钟）
  setInterval(silentSyncTools, 5 * 60 * 1000);
  
  // 立即执行一次静默同步，确保工具库是最新的
  setTimeout(silentSyncTools, 5000);
  
  // 初始化工具描述的点击展开功能
  initToolDescriptionExpand();
  console.log('工具描述点击展开功能初始化完成');
});

// 检查并初始化配置文件
function checkAndInitConfig() {
  console.log('开始检查配置文件...');
  
  // 检查工具根目录配置
  if (!localStorage.getItem('tools_root_dir')) {
    // 设置默认路径
    const defaultRootDir = ''; // 默认为空，需要用户设置
    localStorage.setItem('tools_root_dir', defaultRootDir);
    console.log('已初始化工具根目录配置');
  }
  
  // 检查上次视图配置
  if (!localStorage.getItem('last_view_category')) {
    // 默认不指定分类
    localStorage.setItem('last_view_category', '');
    console.log('已初始化上次视图配置');
  }
  
  // 检查终端配置
  if (!localStorage.getItem('terminal_config')) {
    let defaultTerminal = '';
    
    // 尝试检测操作系统并设置对应的默认终端
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('mac') !== -1) {
      // macOS
      defaultTerminal = '/System/Applications/Utilities/Terminal.app';
    } else if (userAgent.indexOf('win') !== -1) {
      // Windows
      defaultTerminal = 'cmd.exe';
    } else if (userAgent.indexOf('linux') !== -1) {
      // Linux
      defaultTerminal = 'gnome-terminal';
    }
    
    // 保存默认终端配置
    localStorage.setItem('terminal_config', JSON.stringify({
      path: defaultTerminal,
      args: ''
    }));
    
    console.log('已设置默认终端配置:', defaultTerminal);
  }
  
  // 初始化根目录快速切换下拉框
  initRootPathQuickSwitcher();
  
  // 获取上次视图分类
  const lastCategory = localStorage.getItem('last_view_category');
  
  // 根据上次视图情况加载工具列表
  if (lastCategory && lastCategory !== '') {
    // 设置当前分类
    currentCategory = lastCategory;
    console.log('加载上次视图分类:', currentCategory);
    
    // 将在分类菜单加载完成后激活对应分类
  } else {
    // 如果没有上次视图记录，加载全部工具
    loadOfflineTools();
  }
}

// 初始化导航
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link:not(.nav-dropdown-toggle)');
  const pages = document.querySelectorAll('.main-content > div');
  
  // 下拉菜单切换
  const offlineToolsToggle = document.getElementById('offline-tools-toggle');
  const offlineToolsDropdown = document.getElementById('offline-tools-dropdown');
  
  offlineToolsToggle.addEventListener('click', function(e) {
    e.preventDefault();
    offlineToolsDropdown.classList.toggle('open');
  });
  
  // 加载分类菜单
  loadCategoryMenu();
  
  // 常规导航链接
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 移除所有导航链接的活动状态
      navLinks.forEach(l => l.classList.remove('active'));
      document.querySelectorAll('.nav-dropdown-item').forEach(item => item.classList.remove('active'));
      
      // 添加当前链接的活动状态
      this.classList.add('active');
      
      // 隐藏所有页面
      pages.forEach(page => page.style.display = 'none');
      
      // 显示对应页面
      const targetId = this.getAttribute('id').replace('-link', '-page');
      document.getElementById(targetId).style.display = 'block';
    });
  });
}

// 加载分类菜单
function loadCategoryMenu(forceRefresh = false) {
  // 添加时间戳防止缓存
  const timestamp = new Date().getTime();
  
  // 直接从所有工具中获取分类信息
  fetch(`/api/offline-tools?t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
    .then(response => response.json())
    .then(result => {
      // 处理新的API响应格式
      let tools = result;
      
      // 如果是新格式 {success: true, tools: [...]} 则提取工具列表
      if (result && typeof result === 'object' && result.success === true && Array.isArray(result.tools)) {
        tools = result.tools;
      }
      
      // 从工具列表中提取分类信息
      const categories = {};
      
      // 统计每个分类的工具数量
      tools.forEach(tool => {
        if (tool.hidden) return; // 跳过隐藏的工具
        
        const category = tool.category || '未分类';
        if (!categories[category]) {
          categories[category] = 0;
        }
        categories[category]++;
      });
      
      // 转换为数组格式
      const categoryList = Object.keys(categories).map(name => {
        return {
          name: name,
          count: categories[name]
        };
      });
      
      // 按名称排序
      categoryList.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      
      // 渲染分类菜单
      renderCategoryMenu(categoryList, forceRefresh);
      
      // 默认展开分类菜单
      document.getElementById('offline-tools-dropdown').classList.add('open');
    })
    .catch(error => {
      console.error('加载分类列表出错:', error);
      // 加载失败时显示全部分类选项
      renderCategoryMenu([]);
    });
}

// 渲染分类菜单
function renderCategoryMenu(categories, forceRefresh = false) {
  const categoriesMenu = document.getElementById('offline-categories-menu');
  categoriesMenu.innerHTML = ''; // 清空菜单
  
  // 添加"全部"选项
  const allItem = document.createElement('a');
  allItem.className = 'nav-dropdown-item';
  allItem.setAttribute('data-category', 'all');
  allItem.innerHTML = `
    <span>全部工具</span>
    <span class="category-badge">${categories.reduce((total, cat) => total + cat.count, 0)}</span>
  `;
  categoriesMenu.appendChild(allItem);
  
  // 没有分类数据时，只显示全部选项
  if (!categories || categories.length === 0) {
    // 加载所有工具
    allItem.classList.add('active');
    loadOfflineTools(forceRefresh);
    
    allItem.addEventListener('click', function(e) {
      e.preventDefault();
      activateCategoryItem(this);
      currentCategory = null;
      localStorage.setItem('last_view_category', '');
      loadOfflineTools(forceRefresh);
    });
    
    return;
  }
  
  // 添加各个分类选项
  categories.forEach(category => {
    const count = category.count || 0;
    const item = document.createElement('a');
    item.className = 'nav-dropdown-item';
    // 如果是恢复上次视图的分类，设置为激活状态
    if (currentCategory === category.name) {
      item.classList.add('active');
    }
    item.setAttribute('data-category', category.name);
    item.innerHTML = `
      <span>${category.name}</span>
      <span class="category-badge">${count}</span>
    `;
    
    categoriesMenu.appendChild(item);
    
    // 添加点击事件
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 设置当前分类
      currentCategory = category.name;
      
      // 保存当前视图到localStorage
      localStorage.setItem('last_view_category', currentCategory);
      
      // 激活当前分类项
      activateCategoryItem(this);
      
      // 加载该分类的工具
      loadOfflineToolsByCategory(category.name, forceRefresh);
    });
  });
  
  // 全部工具的点击事件
  allItem.addEventListener('click', function(e) {
    e.preventDefault();
    
    // 清除当前分类
    currentCategory = null;
    
    // 激活当前分类项
    activateCategoryItem(this);
    
    // 加载所有工具
    loadOfflineTools(forceRefresh);
  });
  
  // 加载全部工具
  loadOfflineTools(forceRefresh);
}

// 激活分类菜单项
function activateCategoryItem(item) {
  // 移除所有导航链接的活动状态
  document.querySelectorAll('.nav-dropdown-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // 将当前项设为活动状态
  item.classList.add('active');
  
  // 显示离线工具页面
  const pages = document.querySelectorAll('.main-content > div');
  pages.forEach(page => page.style.display = 'none');
  document.getElementById('offline-tools-page').style.display = 'block';
}

// 加载离线工具列表
function loadOfflineTools(forceRefresh = false) {
  // 显示加载状态
  const grid = document.getElementById('offline-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 添加时间戳参数防止缓存
  const timestamp = new Date().getTime();
  
  fetch(`/api/offline-tools?t=${timestamp}&force=${forceRefresh ? 'true' : 'false'}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(result => {
      // 检查返回数据格式，处理不同响应结构
      let tools = result;
      
      // 如果是新格式 {success: true, tools: [...]} 则提取工具列表
      if (result && typeof result === 'object' && result.success === true && Array.isArray(result.tools)) {
        tools = result.tools;
      }
      
      // 过滤掉标记为隐藏的工具
      const visibleTools = tools.filter(tool => !tool.hidden);
      console.log(`加载了 ${tools.length} 个工具，显示 ${visibleTools.length} 个工具（过滤了 ${tools.length - visibleTools.length} 个隐藏工具）`);
      renderOfflineTools(visibleTools, true); // 需要分类显示
    })
    .catch(error => {
      console.error('加载离线工具出错:', error);
      grid.innerHTML = '<div class="error">加载工具列表失败: ' + error.message + '</div>';
    });
}

// 按分类加载离线工具
function loadOfflineToolsByCategory(category, forceRefresh = false) {
  // 显示加载状态
  const grid = document.getElementById('offline-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 添加时间戳防止缓存
  const timestamp = new Date().getTime();
  
  // 获取所有工具然后在前端过滤
  fetch(`/api/offline-tools?t=${timestamp}&force=${forceRefresh ? 'true' : 'false'}`, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(result => {
      // 检查返回数据格式，处理不同响应结构
      let tools = result;
      
      // 如果是新格式 {success: true, tools: [...]} 则提取工具列表
      if (result && typeof result === 'object' && result.success === true && Array.isArray(result.tools)) {
        tools = result.tools;
      }
      
      // 过滤掉隐藏的工具
      const visibleTools = tools.filter(tool => !tool.hidden);
      
      // 根据分类过滤工具
      const filteredTools = visibleTools.filter(tool => {
        return (tool.category || '未分类') === category;
      });
      
      console.log(`加载了 ${category} 分类的 ${filteredTools.length} 个工具`);
      renderOfflineTools(filteredTools, false); // 不需要分类显示
    })
    .catch(error => {
      console.error('加载分类工具出错:', error);
      grid.innerHTML = '<div class="error">加载工具列表失败: ' + error.message + '</div>';
    });
}

// 渲染离线工具列表
function renderOfflineTools(tools, showCategories = true) {
  const grid = document.getElementById('offline-tools-grid');
  grid.innerHTML = '';
  
  if (!tools || tools.length === 0) {
    grid.innerHTML = '<div class="no-data">暂无工具，请点击刷新按钮扫描工具目录</div>';
    return;
  }
  
  console.log('开始渲染', tools.length, '个工具');
  
  // 按名称字母顺序排序
  tools.sort((a, b) => {
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  
  // 直接渲染工具网格，不再显示分类标题
  renderToolsGrid(tools, grid);
  
  console.log('工具渲染完成');
}

// 渲染工具网格（通用函数，供上面的renderOfflineTools调用）
function renderToolsGrid(tools, gridElement) {
  // 清空网格
  gridElement.innerHTML = '';
  
  // 获取工具根目录
  const rootDir = localStorage.getItem('tools_root_dir') || '/Users/02_tool/myTool';
  
  tools.forEach(tool => {
    try {
      const card = document.createElement('div');
      card.className = 'card tool-card';
      card.dataset.toolType = tool.url ? 'web' : 'offline';
      
      // 计算创建时间
      let createdAt;
      try {
        createdAt = new Date(tool.created_at);
      } catch (e) {
        console.error('日期解析错误:', e);
        createdAt = new Date();
      }
      
      // 计算更新时间
      let updatedAt;
      try {
        updatedAt = tool.updated_at ? new Date(tool.updated_at) : createdAt;
      } catch (e) {
        console.error('更新日期解析错误:', e);
        updatedAt = createdAt;
      }
      
      // 确保tags是数组
      const tags = Array.isArray(tool.tags) ? tool.tags : [];
      
      // 获取描述文本，如果没有则显示"暂无描述"
      const description = tool.description || '暂无描述';
      
      // 根据工具类型构建不同的卡片内容
      if (tool.url) {
        // 网页工具
        const displayUrl = tool.url.length > 30 ? tool.url.substring(0, 30) + '...' : tool.url;
        
        card.innerHTML = `
          <div class="card-header">
            <div class="card-header-content">
              <h3 class="card-title">${tool.name}</h3>
              <div class="card-header-actions">
                <button class="btn-icon" data-action="edit" data-id="${tool.id}" title="编辑">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn-icon" data-action="delete" data-id="${tool.id}" title="删除">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="tool-meta">
              <span><i class="fas fa-link"></i> <a href="${tool.url}" target="_blank" title="${tool.url}">${displayUrl}</a></span>
              <span><i class="fas fa-chart-line"></i> ${tool.usage_count || 0}</span>
            </div>
            
            <div class="tags">
              ${tags.map(tag => `<span class="tag" data-tag="${tag}"><i class="fas fa-tag fa-xs"></i> ${tag}</span>`).join('')}
            </div>
            
            <div class="tool-description" data-tooltip="${description}">${description}</div>
            <div class="tool-description-full">${description}</div>
            
            <div class="tool-meta time-meta">
              <span><i class="fas fa-calendar-plus fa-xs"></i> ${createdAt.toLocaleDateString()}</span>
              <span><i class="fas fa-calendar-check fa-xs"></i> ${updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary btn-sm" data-action="open" data-id="${tool.id}">
              <i class="fas fa-external-link-alt"></i> 打开
            </button>
            <button class="btn btn-secondary btn-sm" data-action="note" data-id="${tool.id}">
              <i class="fas fa-sticky-note"></i> 笔记
            </button>
          </div>
        `;
      } else {
        // 离线工具
        // 处理工具路径显示，只显示从根目录后的相对路径
        const toolPath = tool.path || '';
        const fullPath = toolPath;
        let displayPath = toolPath;

        // 如果有根目录，且路径以根目录开头，则只显示相对路径部分
        if (rootDir && toolPath.startsWith(rootDir)) {
          // 计算从根目录开始的相对路径
          displayPath = toolPath.substring(rootDir.length);
          
          // 移除开头的斜杠
          if (displayPath.startsWith('/')) {
            displayPath = displayPath.substring(1);
          }
        }
        
        // 路径过长时进行省略（确保只有一行）
        if (displayPath.length > 30) {
          displayPath = displayPath.substring(0, 15) + '...' + displayPath.substring(displayPath.length - 10);
        }
        
        card.innerHTML = `
          <div class="card-header">
            <div class="card-header-content">
              <h3 class="card-title">${tool.name}</h3>
              <div class="card-header-actions">
                <button class="btn-icon" data-action="edit" data-id="${tool.id}" title="编辑">
                  <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="btn-icon" data-action="delete" data-id="${tool.id}" title="删除文件和配置">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
          <div class="card-body">
            <div class="tool-meta">
              <span class="tool-path" title="${fullPath}"><i class="fas fa-folder"></i> ${displayPath}</span>
              <span><i class="fas fa-chart-line"></i> ${tool.usage_count || 0}</span>
            </div>
            
            <div class="tags">
              ${tags.map(tag => `<span class="tag" data-tag="${tag}"><i class="fas fa-tag fa-xs"></i> ${tag}</span>`).join('')}
            </div>
            
            <div class="tool-description" data-tooltip="${description}">${description}</div>
            <div class="tool-description-full">${description}</div>
            
            <div class="tool-meta time-meta">
              <span><i class="fas fa-calendar-plus fa-xs"></i> ${createdAt.toLocaleDateString()}</span>
              <span><i class="fas fa-calendar-check fa-xs"></i> ${updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
          <div class="card-footer">
            <button class="btn btn-primary btn-sm" data-action="execute" data-id="${tool.id}">
              <i class="fas fa-play"></i> 执行
            </button>
            <button class="btn btn-secondary btn-sm" data-action="folder" data-id="${tool.id}">
              <i class="fas fa-folder-open"></i> 目录
            </button>
            <button class="btn btn-secondary btn-sm" data-action="note" data-id="${tool.id}">
              <i class="fas fa-sticky-note"></i> 笔记
            </button>
          </div>
        `;
      }
      
      gridElement.appendChild(card);
      
      // 添加按钮事件监听
      const buttons = card.querySelectorAll('button[data-action]');
      buttons.forEach(button => {
        button.addEventListener('click', function() {
          const action = this.getAttribute('data-action');
          const id = this.getAttribute('data-id');
          const isWebTool = card.dataset.toolType === 'web';
          
          if (isWebTool) {
            // 网页工具的按钮处理
            switch (action) {
              case 'open':
                openWebTool(id);
                break;
              case 'edit':
                showWebToolModal(id);
                break;
              case 'note':
                showWebToolNote(id);
                break;
              case 'delete':
                deleteWebTool(id);
                break;
            }
          } else {
            // 离线工具的按钮处理
            switch (action) {
              case 'execute':
                executeTool(id);
                break;
              case 'folder':
                openToolFolder(id);
                break;
              case 'note':
                showToolNote(id);
                break;
              case 'edit':
                showToolEditModal(id);
                break;
              case 'delete':
                deleteOfflineTool(id);
                break;
            }
          }
        });
      });
      
      // 添加标签点击事件
      const tagElements = card.querySelectorAll('.tag');
      tagElements.forEach(tag => {
        tag.addEventListener('click', function() {
          const tagValue = this.getAttribute('data-tag');
          if (tagValue) {
            console.log(`点击标签: ${tagValue}`);
            // 使用标签值执行搜索
            const isWebTool = card.dataset.toolType === 'web';
            if (isWebTool) {
              // 暂时使用普通搜索，未来可以扩展为标签搜索
              searchWebTools(tagValue);
            } else {
              // 离线工具使用标签搜索
              searchByTag(tagValue);
            }
            
            // 显示搜索框中的标签信息
            const searchInput = document.getElementById('offline-tools-search');
            if (searchInput) {
              searchInput.value = `标签: ${tagValue}`;
            }
          }
        });
        
        // 添加点击标签的样式
        tag.style.cursor = 'pointer';
        tag.title = `点击搜索包含「${tag.getAttribute('data-tag')}」的标签`;
      });
      
    } catch (error) {
      console.error('渲染工具卡片出错:', error, tool);
    }
  });
  
  // 如果没有结果，显示空状态
  if (tools.length === 0) {
    gridElement.innerHTML = '<div class="empty-state">没有找到匹配的工具</div>';
  }
}

// 通过标签搜索
function searchByTag(tag) {
  if (!tag) return;
  
  console.log(`执行标签搜索: ${tag}`);
  // 调用搜索函数，传入空查询和标签参数
  searchOfflineTools("", [tag]);
}

// 刷新离线工具列表
function refreshOfflineTools() {
  // 显示加载状态
  const grid = document.getElementById('offline-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div><div style="margin-top: 1rem;">正在扫描工具并同步配置文件...</div></div>';
  
  console.log('开始刷新工具列表...');
  
  // 从localStorage获取工具根目录
  const rootDir = localStorage.getItem('tools_root_dir') || '';
  
  // 构造请求参数 - 仅包含根目录和时间戳
  const params = {
    root_dir: rootDir,
    timestamp: new Date().getTime() // 添加时间戳防止缓存
  };
  
  // 构建URL查询参数
  const queryString = Object.keys(params).length > 0 
    ? '?' + Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&')
    : '';
  
  // 发送刷新请求 - 后端负责扫描文件、检查文件存在性和清理配置
  fetch('/api/offline-tools/refresh' + queryString, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('工具刷新结果:', data);
      
      // 清除本地缓存
      localStorage.removeItem('offline_tools_cache');
      
      // 重新加载分类菜单（添加时间戳避免缓存）
      loadCategoryMenu(true);
      
      // 如果有当前分类，则加载该分类的工具
      if (currentCategory) {
        loadOfflineToolsByCategory(currentCategory, true);
      } else {
        // 否则加载所有工具（添加true参数表示强制刷新）
        loadOfflineTools(true);
      }
      
      // 显示刷新完成通知，包含添加、删除和分类变更的工具数量
      let message = '工具库已成功同步';
      let details = [];
      
      // 检查是否有新增或删除的工具
      if (data.added > 0) {
        details.push(`新增${data.added}个工具`);
      }
      
      if (data.removed > 0) {
        details.push(`移除${data.removed}个无效工具`);
      }
      
      // 检查分类变更
      if (data.category_changed > 0) {
        details.push(`自动更新${data.category_changed}个工具的分类`);
        
        // 在控制台详细输出分类变更信息
        console.log('分类变更详情:', data.category_changes);
        
        // 如果有分类变更的工具，显示详细的通知
        let categoryChangeMessage = '以下工具分类已自动更新：<br>';
        for (const change of data.category_changes) {
          categoryChangeMessage += `- ${change.name}: ${change.old_category} → ${change.new_category}<br>`;
        }
        
        // 延迟显示分类变更通知，避免与主通知重叠
        setTimeout(() => {
          showNotification(categoryChangeMessage, 'info', 5000);
        }, 1000);
      }
      
      // 组合消息
      if (details.length > 0) {
        message = `工具库更新: ${details.join('，')}`;
      }
      
      showNotification(message, 'success');
    })
    .catch(error => {
      console.error('刷新工具出错:', error);
      grid.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i>刷新工具列表失败: ' + error.message + '</div>';
      
      // 显示错误通知
      showNotification('刷新工具列表失败: ' + error.message, 'error');
    });
}

// 搜索离线工具
function searchOfflineTools(query, tags) {
  const grid = document.getElementById('offline-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 添加时间戳防止缓存
  const timestamp = new Date().getTime();
  
  // 构建查询URL
  let url = `/api/offline-tools/search?t=${timestamp}`;
  
  // 添加查询参数
  if (query && query.trim() !== '') {
    url += `&query=${encodeURIComponent(query.trim())}`;
  }
  
  // 添加标签参数 - 支持数组或单个标签
  if (tags) {
    if (Array.isArray(tags)) {
      tags.forEach(tag => {
        if (tag && tag.trim() !== '') {
          url += `&tag=${encodeURIComponent(tag.trim())}`;
        }
      });
    } else if (typeof tags === 'string' && tags.trim() !== '') {
      url += `&tag=${encodeURIComponent(tags.trim())}`;
    }
  }
  
  console.log(`发送搜索请求: ${url}`);
  
  // 搜索所有工具
  fetch(url, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(tools => {
      // 确保tools是数组
      if (!Array.isArray(tools)) {
        console.error('搜索返回的数据不是数组:', tools);
        tools = [];
      }
      
      // 过滤掉隐藏的工具
      const visibleTools = tools.filter(tool => !tool.hidden);
      console.log(`搜索结果: ${visibleTools.length}个工具`);
      
      // 如果当前有选中的分类，且搜索内容不为空，进行前端过滤
      if (currentCategory && query && query.trim() !== '') {
        // 在前端根据分类过滤结果
        const filteredTools = visibleTools.filter(tool => {
          return (tool.category || '未分类') === currentCategory;
        });
        renderOfflineTools(filteredTools, false);
      } else {
        // 全局搜索结果
        renderOfflineTools(visibleTools, true);
      }
    })
    .catch(error => {
      console.error('搜索工具出错:', error);
      grid.innerHTML = `<div class="error">搜索失败: ${error.message}</div>`;
    });
}

// 执行工具
function executeTool(id) {
  console.log(`开始执行工具 ID: ${id}`);
  
  // 先获取工具信息，检查是否配置了命令
  fetch(`/api/offline-tools/${id}?t=${new Date().getTime()}`)
    .then(response => response.json())
    .then(tool => {
      // 检查工具是否设置了命令
      if (!tool.command || tool.command.trim() === '') {
        showNotification('该工具未设置执行命令，请先编辑工具添加命令', 'warning');
        return;
      }
      
      // 显示正在执行的通知
      showNotification('正在启动工具...', 'info');
      
      // 发送执行请求
      return fetch(`/api/offline-tools/${id}/execute`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      .then(response => response.json())
      .then(data => {
        console.log('工具执行结果:', data);
        
        if (data.success) {
          showNotification('工具启动成功', 'success');
        } else {
          showNotification(`工具启动失败: ${data.error || '未知错误'}`, 'error');
        }
        
        // 不再重新加载页面，保持当前视图状态
      });
    })
    .catch(error => {
      console.error('执行工具出错:', error);
      showNotification('执行工具时发生错误: ' + error.message, 'error');
    });
}

// 打开工具文件夹
function openToolFolder(id) {
  // 先获取工具信息
  fetch(`/api/offline-tools/${id}`)
    .then(response => response.json())
    .then(tool => {
      if (!tool) {
        console.error('找不到工具信息');
        showNotification('找不到工具信息', 'error');
        return;
      }
      
      // 发送打开文件夹请求
      return fetch(`/api/offline-tools/${id}/open-folder`);
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        showNotification('已打开工具文件夹', 'success');
      } else {
        showNotification('打开文件夹失败: ' + (result.message || '未知错误'), 'error');
      }
    })
    .catch(error => {
      console.error('打开文件夹出错:', error);
      showNotification('打开文件夹时发生错误: ' + error.message, 'error');
    });
}

// 显示工具笔记
function showToolNote(id) {
  currentOfflineToolId = id;
  
  // 获取工具信息
  fetch(`/api/offline-tools/${id}`)
    .then(response => response.json())
    .then(tool => {
      document.getElementById('offline-tool-note-title').textContent = `笔记 - ${tool.name}`;
      
      // 重置保存状态
      document.getElementById('offline-tool-note-status').textContent = '准备编辑';
      
      // 获取笔记内容
      return fetch(`/api/offline-tools/${id}/note`);
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById('offline-tool-note-content').value = data.note || '';
      document.getElementById('offline-tool-note-panel').classList.remove('closed');
      
      // 聚焦到文本框
      setTimeout(() => {
        document.getElementById('offline-tool-note-content').focus();
      }, 300);
    })
    .catch(error => {
      console.error('获取笔记出错:', error);
    });
}

// 保存离线工具笔记
function saveOfflineToolNote() {
  if (!currentOfflineToolId) return;
  
  const note = document.getElementById('offline-tool-note-content').value;
  const statusEl = document.getElementById('offline-tool-note-status');
  
  // 更新状态为保存中
  statusEl.textContent = '保存中...';
  
  fetch(`/api/offline-tools/${currentOfflineToolId}/note`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ note })
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        console.log('笔记保存成功');
        // 更新状态
        statusEl.textContent = '已保存';
        setTimeout(() => {
          if (statusEl.textContent === '已保存') {
            statusEl.textContent = '';
          }
        }, 2000);
      } else {
        console.error('笔记保存失败');
        statusEl.textContent = '保存失败';
      }
    })
    .catch(error => {
      console.error('保存笔记出错:', error);
      statusEl.textContent = '保存出错';
    });
}

// 显示离线工具配置 - 已不再使用，保留为空函数以避免潜在的调用错误
function showOfflineToolConfig() {
  console.log('配置按钮已禁用');
}

// 切换根路径
function switchRootPath(path) {
  if (!path) return;
  
  // 发送切换请求
  fetch('/api/offline-tools/switch-root', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({ path: path })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`切换根路径失败: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(result => {
    console.log('切换根路径结果:', result);
    
    // 更新本地存储
    if (result.config && result.config.scan_path) {
      localStorage.setItem('tools_root_dir', result.config.scan_path);
    }
    
    // 显示通知
    showNotification(`已切换到工具根目录: ${path}`, 'success');
    
    // 刷新工具列表
    loadOfflineTools(true);
    
    // 刷新分类菜单
    loadCategoryMenu(true);
  })
  .catch(error => {
    console.error('切换根路径出错:', error);
    showNotification('切换根路径失败: ' + error.message, 'error');
  });
}

// 保存工具配置 - 已不再使用，保留为空函数以避免潜在的调用错误
function saveOfflineToolConfig() {
  console.log('配置保存功能已禁用');
}

// 显示工具编辑模态框
function showToolEditModal(id) {
  fetch(`/api/offline-tools/${id}?t=${new Date().getTime()}`)
    .then(response => response.json())
    .then(tool => {
      // 填充表单数据
      document.getElementById('offline-tool-edit-id').value = tool.id;
      document.getElementById('offline-tool-edit-name').value = tool.name;
      document.getElementById('offline-tool-edit-description').value = tool.description || '';
      document.getElementById('offline-tool-edit-tags').value = tool.tags.join(',');
      
      // 使用工具中的命令，如果没有则显示空字符串
      document.getElementById('offline-tool-edit-command').value = tool.command || '';
      
      // 显示完整的工具分类路径
      const categoryPathElement = document.getElementById('offline-tool-edit-category-path');
      if (categoryPathElement) {
        // 使用完整的工具路径，不再截取目录部分
        const toolPath = tool.path ? tool.path : '';
        categoryPathElement.textContent = `工具路径: ${toolPath}`;
      }
      
      // 立即显示matu7程序路径（防止异步加载导致不显示）
      const matu7PathElement = document.getElementById('offline-tool-edit-matu7-path');
      if (matu7PathElement) {
        matu7PathElement.textContent = '程序路径: 加载中...';
      }
      
      // 获取matu7路径
      fetch('/api/offline-tools/config')
        .then(response => response.json())
        .then(config => {
          console.log('获取到配置信息:', config); // 添加调试日志
          // 显示matu7程序路径
          if (matu7PathElement) {
            // 确保配置中有BasePath
            const basePath = config && config.base_path ? config.base_path : '未知路径';
            matu7PathElement.textContent = `程序路径: ${basePath}`;
            console.log('设置程序路径显示:', basePath); // 添加调试日志
          }
        })
        .catch(error => {
          console.error('获取matu7配置信息出错:', error);
          if (matu7PathElement) {
            matu7PathElement.textContent = '程序路径: 获取失败';
          }
        });
      
      // 显示模态框
      document.getElementById('offline-tool-edit-modal').style.display = 'flex';
      
      // 重置文件浏览器状态
      const content = document.getElementById('file-browser-content');
      const toggle = document.getElementById('file-browser-toggle');
      
      if (content) {
        content.style.display = 'none';
      }
      
      if (toggle) {
        const icon = toggle.querySelector('.fa-chevron-up');
        if (icon) {
          icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        }
      }
    })
    .catch(error => {
      console.error('获取工具信息出错:', error);
      showNotification('获取工具信息失败', 'error');
    });
}

// 保存离线工具编辑
function saveOfflineToolEdit() {
  const id = document.getElementById('offline-tool-edit-id').value;
  const name = document.getElementById('offline-tool-edit-name').value;
  const description = document.getElementById('offline-tool-edit-description').value;
  const tags = document.getElementById('offline-tool-edit-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const command = document.getElementById('offline-tool-edit-command').value;
  
  // 验证必填字段
  if (!name) {
    showNotification('工具名称不能为空', 'error');
    return;
  }
  
  // 显示正在保存的通知
  showNotification('正在保存工具信息...', 'info');
  
  console.log('保存工具编辑，命令值:', command);
  
  // 禁用保存按钮，防止重复提交
  const saveBtn = document.getElementById('offline-tool-edit-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
  }
  
  // 先获取完整工具信息
  fetch(`/api/offline-tools/${id}?t=${new Date().getTime()}`, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`获取工具信息失败: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(tool => {
      // 更新工具信息
      tool.name = name;
      tool.description = description;
      tool.tags = tags;
      // 确保命令是用户输入的值，即使是空字符串
      tool.command = command;
      tool.updated_at = new Date().toISOString(); // 添加更新时间
      
      console.log('更新后的工具信息:', JSON.stringify(tool));
      
      // 保存工具信息
      return fetch(`/api/offline-tools/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(tool)
      });
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`保存工具信息失败: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('保存结果:', result);
      
      if (!result.success) {
        throw new Error(result.message || '保存失败，未知错误');
      }
      
      // 关闭模态框
      document.getElementById('offline-tool-edit-modal').style.display = 'none';
      
      // 显示成功通知
      showNotification('工具信息已保存', 'success');
      
      // 检查是否是搜索状态
      const searchInput = document.getElementById('offline-tools-search');
      if (searchInput && searchInput.value) {
        // 如果有搜索词，重新执行搜索以保持当前视图
        searchOfflineTools(searchInput.value);
      } else if (currentCategory) {
        // 如果有当前分类，保持分类视图
        loadOfflineToolsByCategory(currentCategory, true);
      } else {
        // 否则重新加载全部工具
        loadOfflineTools(true);
      }
    })
    .catch(error => {
      console.error('更新工具信息出错:', error);
      showNotification('工具信息更新失败: ' + error.message, 'error');
    })
    .finally(() => {
      // 无论成功失败，都恢复保存按钮状态
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-save"></i> 保存';
      }
    });
}

// =================== 网页工具操作函数 ===================

// 加载网页工具列表
function loadWebTools() {
  // 显示加载状态
  const grid = document.getElementById('web-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 添加时间戳参数防止缓存
  const timestamp = new Date().getTime();
  
  fetch(`/api/web-tools?t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
    .then(response => response.json())
    .then(tools => {
      renderWebTools(tools);
    })
    .catch(error => {
      console.error('加载网页工具出错:', error);
      grid.innerHTML = '<div class="error">加载工具列表失败: ' + error.message + '</div>';
    });
}

// 渲染网页工具列表
function renderWebTools(tools) {
  const grid = document.getElementById('web-tools-grid');
  grid.innerHTML = '';
  
  if (!tools || tools.length === 0) {
    grid.innerHTML = '<div class="no-data">暂无工具，点击添加按钮创建新工具</div>';
    return;
  }
  
  console.log('开始渲染', tools.length, '个网页工具');
  
  // 按名称字母顺序排序
  tools.sort((a, b) => {
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  
  // 直接渲染工具网格，不再显示分类标题
  renderToolsGrid(tools, grid);
  
  console.log('网页工具渲染完成');
}

// 搜索网页工具
function searchWebTools(query) {
  fetch(`/api/web-tools/search?query=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(tools => {
      renderWebTools(tools);
    })
    .catch(error => {
      console.error('搜索工具出错:', error);
    });
}

// 打开网页工具
function openWebTool(id) {
  console.log('打开网页工具:', id);
  
  fetch(`/api/web-tools/${id}`)
    .then(response => response.json())
    .then(tool => {
      if (tool && tool.url) {
        console.log('打开网址:', tool.url);
        window.open(tool.url, '_blank');
        
        // 更新使用次数
        fetch(`/api/web-tools/${id}/used`, {
          method: 'POST'
        })
          .then(response => response.json())
          .then(data => {
            console.log('更新使用次数成功');
            // 重新加载工具列表以更新显示
            loadWebTools();
          })
          .catch(error => {
            console.error('更新使用次数失败:', error);
          });
      } else {
        console.error('工具URL无效');
      }
    })
    .catch(error => {
      console.error('获取工具信息出错:', error);
    });
}

// 显示工具笔记
function showWebToolNote(id) {
  currentWebToolId = id;
  
  // 获取工具信息
  fetch(`/api/web-tools/${id}`)
    .then(response => response.json())
    .then(tool => {
      document.getElementById('web-tool-note-title').textContent = `笔记 - ${tool.name}`;
      
      // 重置保存状态
      document.getElementById('web-tool-note-status').textContent = '准备编辑';
      
      // 获取笔记内容
      return fetch(`/api/web-tools/${id}/note`);
    })
    .then(response => response.json())
    .then(data => {
      document.getElementById('web-tool-note-content').value = data.note || '';
      document.getElementById('web-tool-note-panel').classList.remove('closed');
      
      // 聚焦到文本框
      setTimeout(() => {
        document.getElementById('web-tool-note-content').focus();
      }, 300);
    })
    .catch(error => {
      console.error('获取笔记出错:', error);
    });
}

// 保存工具笔记
function saveWebToolNote() {
  if (!currentWebToolId) return;
  
  const note = document.getElementById('web-tool-note-content').value;
  const statusEl = document.getElementById('web-tool-note-status');
  
  // 更新状态为保存中
  statusEl.textContent = '保存中...';
  
  fetch(`/api/web-tools/${currentWebToolId}/note`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ note })
  })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        console.log('笔记保存成功');
        // 更新状态
        statusEl.textContent = '已保存';
        setTimeout(() => {
          if (statusEl.textContent === '已保存') {
            statusEl.textContent = '';
          }
        }, 2000);
      } else {
        console.error('笔记保存失败');
        statusEl.textContent = '保存失败';
      }
    })
    .catch(error => {
      console.error('保存笔记出错:', error);
      statusEl.textContent = '保存出错';
    });
}

// 显示工具模态框
function showWebToolModal(id = null) {
  if (id) {
    // 编辑模式
    fetch(`/api/web-tools/${id}`)
      .then(response => response.json())
      .then(tool => {
        document.getElementById('web-tool-modal-title').textContent = '编辑网页工具';
        document.getElementById('web-tool-id').value = tool.id;
        document.getElementById('web-tool-name').value = tool.name;
        document.getElementById('web-tool-url').value = tool.url;
        document.getElementById('web-tool-description').value = tool.description || '';
        document.getElementById('web-tool-tags').value = tool.tags.join(',');
        document.getElementById('web-tool-icon').value = tool.icon || '';
        document.getElementById('web-tool-modal').style.display = 'flex';
      })
      .catch(error => {
        console.error('获取工具信息出错:', error);
      });
  } else {
    // 添加模式
    document.getElementById('web-tool-modal-title').textContent = '添加网页工具';
    document.getElementById('web-tool-id').value = '';
    document.getElementById('web-tool-name').value = '';
    document.getElementById('web-tool-url').value = '';
    document.getElementById('web-tool-description').value = '';
    document.getElementById('web-tool-tags').value = '';
    document.getElementById('web-tool-icon').value = '';
    document.getElementById('web-tool-modal').style.display = 'flex';
  }
}

// 保存网页工具
function saveWebTool() {
  const id = document.getElementById('web-tool-id').value;
  const name = document.getElementById('web-tool-name').value;
  const url = document.getElementById('web-tool-url').value;
  const description = document.getElementById('web-tool-description').value;
  const tags = document.getElementById('web-tool-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const icon = document.getElementById('web-tool-icon').value;
  
  if (!name || !url) {
    showNotification('名称和URL是必填项', 'error');
    return;
  }
  
  // 显示正在保存的通知
  showNotification('正在保存...', 'info');
  
  const tool = {
    id,
    name,
    url,
    description,
    tags,
    icon,
    updated_at: new Date().toISOString() // 添加更新时间
  };
  
  if (id) {
    // 更新现有工具
    fetch(`/api/web-tools/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tool)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`更新工具失败: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        document.getElementById('web-tool-modal').style.display = 'none';
        loadWebTools(); // 重新加载工具列表
        showNotification('工具更新成功', 'success');
      })
      .catch(error => {
        console.error('更新工具出错:', error);
        showNotification('更新工具失败: ' + error.message, 'error');
      });
  } else {
    // 添加新工具
    fetch('/api/web-tools', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tool)
    })
      .then(response => response.json())
      .then(result => {
        document.getElementById('web-tool-modal').style.display = 'none';
        loadWebTools(); // 重新加载工具列表
        showNotification('工具添加成功', 'success');
      })
      .catch(error => {
        console.error('添加工具出错:', error);
        showNotification('添加工具失败: ' + error.message, 'error');
      });
  }
}

// =================== 网页笔记操作函数 ===================

// 加载网页笔记列表
function loadWebNotes() {
  fetch('/api/web-notes')
    .then(response => response.json())
    .then(notes => {
      renderWebNotes(notes);
    })
    .catch(error => {
      console.error('加载网页笔记出错:', error);
    });
}

// 渲染网页笔记列表
function renderWebNotes(notes) {
  const tableBody = document.querySelector('#web-notes-table tbody');
  tableBody.innerHTML = '';
  
  if (notes.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="5" class="no-data">暂无笔记，点击添加按钮创建新笔记</td>';
    tableBody.appendChild(tr);
    return;
  }
  
  notes.forEach(note => {
    const tr = document.createElement('tr');
    
    // 格式化时间
    const createdAt = new Date(note.created_at);
    const formattedDate = createdAt.toLocaleDateString();
    
    // 截断笔记内容
    const noteContent = note.note && note.note.length > 50 ? note.note.substring(0, 50) + '...' : (note.note || '');
    
    tr.innerHTML = `
      <td>${note.title}</td>
      <td>${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</td>
      <td title="${note.note || ''}">${noteContent}</td>
      <td>${formattedDate}</td>
      <td>
        <button class="btn btn-primary btn-sm" data-action="open" data-id="${note.id}">
          <i class="fas fa-external-link-alt"></i>
        </button>
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${note.id}">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${note.id}">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(tr);
    
    // 添加按钮事件监听
    const buttons = tr.querySelectorAll('button[data-action]');
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        const id = this.getAttribute('data-id');
        
        switch (action) {
          case 'open':
            openWebNoteURL(id);
            break;
          case 'edit':
            showWebNoteModal(id);
            break;
          case 'delete':
            deleteWebNote(id);
            break;
        }
      });
    });
  });
}

// 搜索网页笔记
function searchWebNotes(query) {
  fetch(`/api/web-notes/search?query=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(notes => {
      renderWebNotes(notes);
    })
    .catch(error => {
      console.error('搜索笔记出错:', error);
    });
}

// 打开网页笔记URL
function openWebNoteURL(id) {
  fetch(`/api/web-notes/${id}/open`)
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        // 打开成功，不需要特殊处理
      } else {
        alert('打开笔记URL失败');
      }
    })
    .catch(error => {
      console.error('打开笔记URL出错:', error);
    });
}

// 显示笔记模态框
function showWebNoteModal(id = null) {
  if (id) {
    // 编辑模式
    fetch(`/api/web-notes/${id}`)
      .then(response => response.json())
      .then(note => {
        document.getElementById('web-note-modal-title').textContent = '编辑网页笔记';
        document.getElementById('web-note-id').value = note.id;
        document.getElementById('web-note-title').value = note.title;
        document.getElementById('web-note-url').value = note.url;
        document.getElementById('web-note-tags').value = note.tags.join(',');
        document.getElementById('web-note-content').value = note.note || '';
        document.getElementById('web-note-modal').style.display = 'flex';
      })
      .catch(error => {
        console.error('获取笔记信息出错:', error);
      });
  } else {
    // 添加模式
    document.getElementById('web-note-modal-title').textContent = '添加网页笔记';
    document.getElementById('web-note-id').value = '';
    document.getElementById('web-note-title').value = '';
    document.getElementById('web-note-url').value = '';
    document.getElementById('web-note-tags').value = '';
    document.getElementById('web-note-content').value = '';
    document.getElementById('web-note-modal').style.display = 'flex';
  }
}

// 保存网页笔记
function saveWebNote() {
  const id = document.getElementById('web-note-id').value;
  const title = document.getElementById('web-note-title').value;
  const url = document.getElementById('web-note-url').value;
  const tags = document.getElementById('web-note-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const note = document.getElementById('web-note-content').value;
  
  if (!title || !url) {
    alert('标题和URL是必填项');
    return;
  }
  
  const noteData = {
    id,
    title,
    url,
    tags,
    note
  };
  
  if (id) {
    // 更新现有笔记
    fetch(`/api/web-notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteData)
    })
      .then(response => response.json())
      .then(result => {
        document.getElementById('web-note-modal').style.display = 'none';
        loadWebNotes(); // 重新加载笔记列表
        alert('笔记更新成功');
      })
      .catch(error => {
        console.error('更新笔记出错:', error);
      });
  } else {
    // 添加新笔记
    fetch('/api/web-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(noteData)
    })
      .then(response => response.json())
      .then(result => {
        document.getElementById('web-note-modal').style.display = 'none';
        loadWebNotes(); // 重新加载笔记列表
        alert('笔记添加成功');
      })
      .catch(error => {
        console.error('添加笔记出错:', error);
      });
  }
}

// 删除网页笔记
function deleteWebNote(id) {
  if (confirm('确定要删除此笔记吗？')) {
    // 显示删除中通知
    showNotification('正在删除笔记...', 'info');
    
    fetch(`/api/web-notes/${id}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        loadWebNotes(); // 重新加载笔记列表
        showNotification('笔记删除成功', 'success');
      } else {
        showNotification('笔记删除失败: ' + (result.error || '未知错误'), 'error');
      }
    })
    .catch(error => {
      console.error('删除笔记出错:', error);
      showNotification('删除笔记失败: ' + error.message, 'error');
    });
  }
}

// 初始化离线工具页面
function initOfflineToolsPage() {
  // 刷新按钮
  const refreshBtn = document.getElementById('offline-tools-refresh-btn');
  refreshBtn.addEventListener('click', function() {
    refreshOfflineTools();
  });
  
  // 搜索功能
  const searchBtn = document.getElementById('offline-tools-search-btn');
  const searchInput = document.getElementById('offline-tools-search');
  
  // 搜索按钮点击事件
  searchBtn.addEventListener('click', function() {
    processSearch(searchInput.value);
  });
  
  // 搜索框回车事件
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      processSearch(this.value);
    }
  });
  
  // 处理搜索输入内容
  function processSearch(searchText) {
    if (!searchText) {
      // 空搜索，加载所有工具
      loadOfflineTools(true);
      return;
    }
    
    // 检查是否是标签搜索（以"标签:"开头）
    if (searchText.match(/^标签[:：]\s*(.+)$/)) {
      const tag = searchText.match(/^标签[:：]\s*(.+)$/)[1].trim();
      console.log(`识别到标签模糊搜索: ${tag}`);
      showNotification(`正在搜索包含「${tag}」的标签`, 'info');
      searchOfflineTools("", [tag]);
    } 
    // 检查是否是使用tag:或tag=格式的标签搜索
    else if (searchText.match(/^tag[:=]\s*(.+)$/i)) {
      const tag = searchText.match(/^tag[:=]\s*(.+)$/i)[1].trim();
      console.log(`识别到tag:格式的标签模糊搜索: ${tag}`);
      showNotification(`正在搜索包含「${tag}」的标签`, 'info');
      searchOfflineTools("", [tag]);
    }
    // 普通文本搜索
    else {
      console.log(`执行普通文本搜索: ${searchText}`);
      searchOfflineTools(searchText);
    }
  }
  
  // 根目录快速切换功能
  const quickSwitchBtn = document.getElementById('quick-root-path-switch-btn');
  if (quickSwitchBtn) {
    quickSwitchBtn.addEventListener('click', function() {
      quickSwitchRootPath();
    });
  }
  
  // 根目录添加按钮
  const quickAddBtn = document.getElementById('quick-root-path-add-btn');
  if (quickAddBtn) {
    quickAddBtn.addEventListener('click', function() {
      addNewRootPath();
    });
  }
  
  // 根目录删除按钮
  const quickDeleteBtn = document.getElementById('quick-root-path-delete-btn');
  if (quickDeleteBtn) {
    quickDeleteBtn.addEventListener('click', function() {
      removeCurrentRootPath();
    });
  }
  
  // 根目录选择框变化事件
  const quickSelectElem = document.getElementById('quick-root-path-select');
  if (quickSelectElem) {
    quickSelectElem.addEventListener('change', function() {
      if (this.value === '__new__') {
        // 添加新路径的处理逻辑
        addNewRootPath();
      }
    });
  }
  
  // 笔记面板关闭按钮
  const noteCloseBtn = document.getElementById('offline-tool-note-close-btn');
  noteCloseBtn.addEventListener('click', function() {
    document.getElementById('offline-tool-note-panel').classList.add('closed');
  });
  
  // 笔记保存按钮
  const noteSaveBtn = document.getElementById('offline-tool-note-save-btn');
  noteSaveBtn.addEventListener('click', function() {
    saveOfflineToolNote();
  });
  
  // 离线工具编辑模态框
  const toolEditCloseBtn = document.getElementById('offline-tool-edit-close-btn');
  const toolEditCancelBtn = document.getElementById('offline-tool-edit-cancel-btn');
  const toolEditSaveBtn = document.getElementById('offline-tool-edit-save-btn');
  
  if (toolEditCloseBtn) {
    toolEditCloseBtn.addEventListener('click', function() {
      document.getElementById('offline-tool-edit-modal').style.display = 'none';
    });
  }
  
  if (toolEditCancelBtn) {
    toolEditCancelBtn.addEventListener('click', function() {
      document.getElementById('offline-tool-edit-modal').style.display = 'none';
    });
  }
  
  if (toolEditSaveBtn) {
    console.log('绑定工具编辑保存按钮事件');
    toolEditSaveBtn.addEventListener('click', function() {
      console.log('工具编辑保存按钮被点击');
      saveOfflineToolEdit();
    });
  } else {
    console.error('未找到工具编辑保存按钮');
  }
  
  // 初始化文件浏览器
  initFileBrowser();
}

// 初始化网页工具页面
function initWebToolsPage() {
  // 加载网页工具列表
  loadWebTools();
  
  // 添加按钮
  const addBtn = document.getElementById('web-tools-add-btn');
  addBtn.addEventListener('click', function() {
    showWebToolModal();
  });
  
  // 搜索功能
  const searchBtn = document.getElementById('web-tools-search-btn');
  const searchInput = document.getElementById('web-tools-search');
  
  searchBtn.addEventListener('click', function() {
    searchWebTools(searchInput.value);
  });
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchWebTools(this.value);
    }
  });
  
  // 笔记面板关闭按钮
  const noteCloseBtn = document.getElementById('web-tool-note-close-btn');
  noteCloseBtn.addEventListener('click', function() {
    document.getElementById('web-tool-note-panel').classList.add('closed');
    currentWebToolId = null;
  });
  
  // 笔记保存按钮
  const noteSaveBtn = document.getElementById('web-tool-note-save-btn');
  noteSaveBtn.addEventListener('click', function() {
    saveWebToolNote();
  });
  
  // 工具模态框
  const modalCloseBtn = document.getElementById('web-tool-modal-close-btn');
  const modalCancelBtn = document.getElementById('web-tool-cancel-btn');
  const modalSaveBtn = document.getElementById('web-tool-modal-save-btn');
  
  modalCloseBtn.addEventListener('click', function() {
    document.getElementById('web-tool-modal').style.display = 'none';
  });
  
  if (modalCancelBtn) {
    modalCancelBtn.addEventListener('click', function() {
      document.getElementById('web-tool-modal').style.display = 'none';
    });
  }
  
  if (modalSaveBtn) {
    modalSaveBtn.addEventListener('click', function() {
      saveWebTool();
    });
  } else {
    // 表单提交事件
    const form = document.getElementById('web-tool-form');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveWebTool();
      });
    }
  }
}

// 初始化网页笔记页面
function initWebNotesPage() {
  // 加载网页笔记列表
  loadWebNotes();
  
  // 添加按钮
  const addBtn = document.getElementById('web-notes-add-btn');
  addBtn.addEventListener('click', function() {
    showWebNoteModal();
  });
  
  // 搜索功能
  const searchBtn = document.getElementById('web-notes-search-btn');
  const searchInput = document.getElementById('web-notes-search');
  
  searchBtn.addEventListener('click', function() {
    searchWebNotes(searchInput.value);
  });
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      searchWebNotes(this.value);
    }
  });
  
  // 笔记模态框
  const modalCloseBtn = document.getElementById('web-note-modal-close-btn');
  const modalCancelBtn = document.getElementById('web-note-modal-cancel-btn');
  const modalSaveBtn = document.getElementById('web-note-modal-save-btn');
  
  modalCloseBtn.addEventListener('click', function() {
    document.getElementById('web-note-modal').style.display = 'none';
  });
  
  modalCancelBtn.addEventListener('click', function() {
    document.getElementById('web-note-modal').style.display = 'none';
  });
  
  modalSaveBtn.addEventListener('click', function() {
    saveWebNote();
  });
}

// 初始化笔记面板点击外部关闭功能
function initNotePanelClickOutside() {
  // 离线工具笔记面板
  const offlineNotePanel = document.getElementById('offline-tool-note-panel');
  const webNotePanel = document.getElementById('web-tool-note-panel');
  
  // 给文档添加点击事件
  document.addEventListener('click', function(event) {
    // 检查点击事件是否发生在离线工具笔记面板外部
    if (!offlineNotePanel.classList.contains('closed')) {
      // 检查点击是否在面板内部
      if (!offlineNotePanel.contains(event.target) && 
          !event.target.closest('[data-action="note"]')) {
        // 自动保存笔记内容
        saveOfflineToolNote();
        // 关闭面板
        offlineNotePanel.classList.add('closed');
      }
    }
    
    // 检查点击事件是否发生在网页工具笔记面板外部
    if (!webNotePanel.classList.contains('closed')) {
      // 检查点击是否在面板内部
      if (!webNotePanel.contains(event.target) && 
          !event.target.closest('[data-action="note"]')) {
        // 自动保存笔记内容
        saveWebToolNote();
        // 关闭面板
        webNotePanel.classList.add('closed');
      }
    }
  });
}

// 收藏/喜爱工具
function favoriteTool(id) {
  console.log('收藏功能已禁用');
  return;
  
  // 以下代码不会执行
  // 先获取工具信息
  fetch(`/api/offline-tools/${id}`)
    .then(response => response.json())
    .then(tool => {
      if (!tool) {
        console.error('找不到工具信息');
        return;
      }
      
      // 切换收藏状态
      const isFavorite = tool.is_favorite || tool.favorite || false;
      tool.is_favorite = !isFavorite;
      tool.favorite = !isFavorite;
      
      // 更新工具信息
      return fetch(`/api/offline-tools/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tool)
      });
    })
    .then(response => response.json())
    .then(result => {
      // 重新加载工具列表
      if (currentCategory) {
        loadOfflineToolsByCategory(currentCategory);
      } else {
        loadOfflineTools();
      }
    })
    .catch(error => {
      console.error('收藏工具出错:', error);
    });
}

// 执行静默同步（不显示加载状态，不更新UI）
function silentSyncTools() {
  const rootDir = localStorage.getItem('tools_root_dir') || '';
  
  // 构造请求参数
  const params = {
    root_dir: rootDir,
    silent: true, // 静默模式，不需要完整结果
    timestamp: new Date().getTime()
  };
  
  // 构建URL查询参数
  const queryString = Object.keys(params).length > 0 
    ? '?' + Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&')
    : '';
  
  // 执行同步请求 - 后端负责扫描文件和清理配置
  fetch('/api/offline-tools/refresh' + queryString, {
    method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(result => {
      console.log('静默同步结果:', result);
      
      // 如果有变更且离线工具页面可见，提示用户并重新加载
      if ((result.added > 0 || result.removed > 0) && 
          document.getElementById('offline-tools-page').style.display !== 'none') {
        // 清除本地缓存
        localStorage.removeItem('offline_tools_cache');
        
        // 显示通知
        let message = '工具库已更新';
        if (result.added > 0 && result.removed > 0) {
          message = `工具库更新: 新增${result.added}个工具，移除${result.removed}个无效工具`;
        } else if (result.added > 0) {
          message = `工具库更新: 新增${result.added}个工具`;
        } else if (result.removed > 0) {
          message = `工具库更新: 移除${result.removed}个无效工具`;
        }
        showNotification(message, 'info');
        
        // 重新加载工具列表
        loadOfflineTools(true);
        loadCategoryMenu(true);
      }
    })
    .catch(error => {
      console.error('静默同步出错:', error);
    });
}

// 显示通知
function showNotification(message, type = 'info') {
  // 移除所有现有通知
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(el => {
    el.remove();
  });
  
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  
  // 添加图标
  let icon = 'info-circle';
  switch (type) {
    case 'success':
      icon = 'check-circle';
      break;
    case 'error':
      icon = 'exclamation-circle';
      break;
    case 'warning':
      icon = 'exclamation-triangle';
      break;
  }
  
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${icon}"></i>
      <div>${message}</div>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  document.body.appendChild(notification);
  
  // 显示通知
  setTimeout(() => {
    notification.classList.add('notification-visible');
  }, 10);
  
  // 关闭按钮事件
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    hideNotification(notification);
  });
  
  // 自动隐藏通知
  const displayTime = type === 'error' ? 5000 : 3000; // 错误显示时间更长
  setTimeout(() => {
    hideNotification(notification);
  }, displayTime);
  
  // 返回通知对象，以便可以手动关闭
  return notification;
}

// 隐藏通知
function hideNotification(notification) {
  notification.classList.add('notification-closing');
  notification.classList.remove('notification-visible');
  
  // 动画结束后移除
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}

// 删除网页工具
function deleteWebTool(id) {
  if (confirm('确定要删除此工具吗？')) {
    // 显示删除中通知
    showNotification('正在删除工具...', 'info');
    
    fetch(`/api/web-tools/${id}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        loadWebTools(); // 重新加载工具列表
        showNotification('工具删除成功', 'success');
      } else {
        showNotification('工具删除失败: ' + (result.error || '未知错误'), 'error');
      }
    })
    .catch(error => {
      console.error('删除工具出错:', error);
      showNotification('删除工具失败: ' + error.message, 'error');
    });
  }
}

// 删除离线工具
function deleteOfflineTool(id) {
  if (confirm('警告: 这将永久删除工具的文件夹和所有文件。确定要删除此工具吗？')) {
    // 显示删除中状态
    showNotification('正在删除工具文件和配置...', 'info');
    
    // 保存当前分类，用于删除后恢复视图
    const currentCategory = localStorage.getItem('last_view_category') || '';
    
    // 从显示中移除此工具
    const toolCard = document.querySelector(`.tool-card button[data-id="${id}"]`).closest('.tool-card');
    if (toolCard) {
      toolCard.style.display = 'none';
    }
    
    // 调用删除API
    fetch(`/api/offline-tools/${id}`, {
      method: 'DELETE',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`删除失败: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(result => {
      if (result.success) {
        // 显示成功通知
        showNotification('工具已永久删除', 'success');
        
        // 清除本地缓存
        localStorage.removeItem('offline_tools_cache');
        
        // 创建一个等待分类菜单重新加载的函数
        const reloadCategory = () => {
          // 重新加载分类菜单但不切换视图
        loadCategoryMenu(true);
          
          // 等待分类菜单加载完成
          setTimeout(() => {
            if (currentCategory) {
              // 如果在特定分类中，找到对应分类菜单项并激活
              const categoryItem = document.querySelector(`.nav-dropdown-item[data-category="${currentCategory}"]`);
              if (categoryItem) {
                // 激活分类并加载该分类的工具
                activateCategoryItem(categoryItem);
                loadOfflineToolsByCategory(currentCategory, true);
              } else {
                // 如果找不到分类（比如删除的是此分类的最后一个工具），则加载全部工具
                const allCategoryItem = document.querySelector('.nav-dropdown-item[data-category="all"]');
                if (allCategoryItem) {
                  activateCategoryItem(allCategoryItem);
                }
                loadOfflineTools(true);
              }
            } else {
              // 如果在全部工具视图，加载全部工具
              loadOfflineTools(true);
            }
          }, 200);
        };
        
        // 执行重新加载
        reloadCategory();
      } else {
        showNotification(`删除失败: ${result.error || '未知错误'}`, 'error');
        // 恢复显示卡片
        if (toolCard) {
          toolCard.style.display = '';
        }
      }
    })
    .catch(error => {
      console.error('删除工具出错:', error);
      showNotification('删除工具时发生错误: ' + error.message, 'error');
      // 恢复显示卡片
      if (toolCard) {
        toolCard.style.display = '';
      }
    });
  }
}

// 初始化工具描述点击展开功能
function initToolDescriptionExpand() {
  // 使用事件委托，监听整个document上的点击事件
  document.addEventListener('click', function(event) {
    // 检查点击的目标是否是tool-description元素
    const description = event.target.closest('.tool-description');
    if (description) {
      // 获取描述文本和工具名称
      const text = description.textContent || '';
      // 尝试获取相关的工具名称
      let title = '详细描述';
      const card = description.closest('.tool-card');
      if (card) {
        const titleElem = card.querySelector('.card-title');
        if (titleElem) {
          title = titleElem.textContent;
        }
      }
      
      // 创建或重用全屏描述展示div
      let fullDescription = document.getElementById('full-description-overlay');
      if (!fullDescription) {
        fullDescription = document.createElement('div');
        fullDescription.id = 'full-description-overlay';
        fullDescription.className = 'tool-description-full';
        document.body.appendChild(fullDescription);
      }

      // 更新模态框内容
      fullDescription.innerHTML = `
        <div class="modal-content description-modal">
          <div class="full-description-header">
            <h3>${title}</h3>
            <button class="btn-icon" id="close-full-description">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="full-description-content">${text}</div>
        </div>
      `;
      
      // 添加关闭按钮事件
      document.getElementById('close-full-description').addEventListener('click', function() {
        fullDescription.style.display = 'none';
      });
      
      // 点击背景关闭
      fullDescription.addEventListener('click', function(e) {
        if (e.target === fullDescription) {
          fullDescription.style.display = 'none';
        }
      });
      
      // 显示
      fullDescription.style.display = 'flex';
    }
  });

  // 按ESC键关闭
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      const fullDescription = document.getElementById('full-description-overlay');
      if (fullDescription && fullDescription.style.display === 'flex') {
        fullDescription.style.display = 'none';
      }
    }
  });
}

// 初始化根目录快速切换下拉框
function initRootPathQuickSwitcher() {
  // 获取下拉框元素
  const selectElement = document.getElementById('quick-root-path-select');
  
  // 如果元素不存在，直接返回
  if (!selectElement) {
    console.error('未找到根目录快速切换下拉框元素');
    return;
  }
  
  // 先清空下拉框
  selectElement.innerHTML = '';
  
  // 添加加载中选项
  const loadingOption = document.createElement('option');
  loadingOption.value = '';
  loadingOption.textContent = '加载中...';
  selectElement.appendChild(loadingOption);
  selectElement.disabled = true;
  
  // 从后端获取根目录列表
  fetch('/api/offline-tools/roots?t=' + new Date().getTime(), {
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(rootData => {
    const rootPaths = rootData.paths || [];
    const currentPath = rootData.current || '';
    
    // 存储当前根路径到本地
    if (currentPath) {
      localStorage.setItem('tools_root_dir', currentPath);
    }
    
    // 清空下拉框
    selectElement.innerHTML = '';
    
    // 添加根目录选项
    if (rootPaths.length === 0) {
      // 无根目录时添加提示选项
      const noPathOption = document.createElement('option');
      noPathOption.value = '';
      noPathOption.textContent = '无根目录';
      selectElement.appendChild(noPathOption);
    } else {
      // 添加当前根目录选项
      rootPaths.forEach(path => {
        const option = document.createElement('option');
        option.value = path;
        option.textContent = path;
        if (path === currentPath) {
          option.selected = true;
        }
        selectElement.appendChild(option);
      });
      
      // 添加新建选项
      const newOption = document.createElement('option');
      newOption.value = '__new__';
      newOption.textContent = '添加新路径...';
      selectElement.appendChild(newOption);
    }
    
    // 启用下拉框
    selectElement.disabled = false;
  })
  .catch(error => {
    console.error('获取根目录列表出错:', error);
    
    // 清空下拉框并添加错误提示
    selectElement.innerHTML = '';
    const errorOption = document.createElement('option');
    errorOption.value = '';
    errorOption.textContent = '加载失败';
    selectElement.appendChild(errorOption);
    
    // 启用下拉框
    selectElement.disabled = false;
  });
}

// 根目录快速切换
function quickSwitchRootPath() {
  const selectElement = document.getElementById('quick-root-path-select');
  const selectedPath = selectElement.value;
  
  if (!selectedPath || selectedPath === '') {
    showNotification('请选择有效的根目录', 'warning');
    return;
  }
  
  if (selectedPath === '__new__') {
    // 如果选择了"添加新路径"，打开配置模态框
    showOfflineToolConfig();
    return;
  }
  
  // 显示正在切换的通知
  showNotification('正在切换根目录...', 'info');
  
  // 保存当前分类视图
  if (currentCategory) {
    localStorage.setItem('last_view_category', currentCategory);
  } else {
    localStorage.setItem('last_view_category', '');
  }
  
  // 发送切换请求
  fetch('/api/offline-tools/switch-root', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({ path: selectedPath })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`切换根路径失败: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(result => {
    console.log('切换根路径结果:', result);
    
    // 更新本地存储
    if (result.config && result.config.scan_path) {
      localStorage.setItem('tools_root_dir', result.config.scan_path);
    }
    
    // 显示通知
    showNotification(`已切换到工具根目录: ${selectedPath}`, 'success');
    
    // 重新加载根目录下拉框
    initRootPathQuickSwitcher();
    
    // 刷新分类菜单
    loadCategoryMenu(true);
    
    // 刷新工具列表（根据上次视图）
    if (currentCategory) {
      loadOfflineToolsByCategory(currentCategory, true);
    } else {
      loadOfflineTools(true);
    }
  })
  .catch(error => {
    console.error('切换根路径出错:', error);
    showNotification('切换根路径失败: ' + error.message, 'error');
  });
}

// 添加新的根目录
function addNewRootPath() {
  // 打开一个简单的输入对话框
  const newPath = prompt('请输入新的工具根目录路径:');
  
  if (!newPath || newPath.trim() === '') {
    return; // 用户取消或未输入
  }
  
  // 保存当前分类视图
  if (currentCategory) {
    localStorage.setItem('last_view_category', currentCategory);
  } else {
    localStorage.setItem('last_view_category', '');
  }
  
  // 准备配置数据
  const configData = {
    scan_path: newPath.trim(),
    auto_refresh: true
  };
  
  // 显示加载中通知
  showNotification('正在添加新根目录...', 'info');
  
  // 保存到后端
  fetch('/api/offline-tools/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify(configData)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`添加根目录失败: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(result => {
    console.log('添加根目录结果:', result);
    
    // 更新本地存储的扫描路径
    localStorage.setItem('tools_root_dir', newPath.trim());
    
    // 显示通知
    showNotification('已添加新的工具根目录', 'success');
    
    // 重新加载根目录下拉框
    initRootPathQuickSwitcher();
    
    // 刷新工具列表
    refreshOfflineTools();
    
    // 刷新分类菜单
    loadCategoryMenu(true);
  })
  .catch(error => {
    console.error('添加根目录出错:', error);
    showNotification('添加根目录失败: ' + error.message, 'error');
  });
}

// 移除当前根目录（保留配置）
function removeCurrentRootPath() {
  const selectElement = document.getElementById('quick-root-path-select');
  const currentPath = selectElement.value;
  
  if (!currentPath || currentPath === '' || currentPath === '__new__') {
    showNotification('请选择有效的根目录', 'warning');
    return;
  }
  
  // 二次确认
  if (!confirm(`确定要从列表中移除根目录 "${currentPath}" 吗？\n注意：配置文件将被保留，可以随时重新添加。`)) {
    return;
  }
  
  // 显示加载中通知
  showNotification('正在移除根目录...', 'info');
  
  // 保存当前分类视图
  if (currentCategory) {
    localStorage.setItem('last_view_category', currentCategory);
  } else {
    localStorage.setItem('last_view_category', '');
  }
  
  // 发送移除请求
  fetch('/api/offline-tools/remove-root', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    },
    body: JSON.stringify({ path: currentPath })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`移除根目录失败: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(result => {
    console.log('移除根目录结果:', result);
    
    // 更新本地存储，使用新返回的当前配置
    if (result.config && result.config.scan_path) {
      localStorage.setItem('tools_root_dir', result.config.scan_path);
    }
    
    // 显示通知
    showNotification(`已从列表中移除根目录: ${currentPath}`, 'success');
    
    // 重新加载根目录下拉框
    initRootPathQuickSwitcher();
    
    // 刷新分类菜单
    loadCategoryMenu(true);
    
    // 刷新工具列表
    loadOfflineTools(true);
  })
  .catch(error => {
    console.error('移除根目录出错:', error);
    showNotification('移除根目录失败: ' + error.message, 'error');
  });
}

// 初始化文件浏览器折叠功能
function initFileBrowser() {
  const toggle = document.getElementById('file-browser-toggle');
  const content = document.getElementById('file-browser-content');
  
  if (toggle && content) {
    toggle.addEventListener('click', function() {
      // 切换显示状态
      if (content.style.display === 'none') {
        content.style.display = 'block';
        toggle.querySelector('.fa-chevron-down').classList.replace('fa-chevron-down', 'fa-chevron-up');
        // 加载文件列表
        loadToolFiles();
      } else {
        content.style.display = 'none';
        toggle.querySelector('.fa-chevron-up').classList.replace('fa-chevron-up', 'fa-chevron-down');
      }
    });
  }
}

// 加载工具文件列表
function loadToolFiles() {
  const content = document.getElementById('file-browser-content');
  const listElement = content.querySelector('.file-browser-list');
  const loadingElement = content.querySelector('.file-browser-loading');
  
  // 获取当前编辑的工具ID
  const toolId = document.getElementById('offline-tool-edit-id').value;
  
  if (!toolId) {
    listElement.innerHTML = '<div class="error">无法获取工具ID</div>';
    loadingElement.style.display = 'none';
    return;
  }
  
  // 显示加载中
  listElement.innerHTML = '';
  loadingElement.style.display = 'block';
  
  // 获取文件列表
  fetch(`/api/offline-tools/${toolId}/files?t=${new Date().getTime()}`, {
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`获取文件列表失败: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    // 隐藏加载中
    loadingElement.style.display = 'none';
    
    if (!data.success) {
      listElement.innerHTML = `<div class="error">${data.error || '获取文件列表失败'}</div>`;
      return;
    }
    
    const files = data.files || [];
    
    if (files.length === 0) {
      listElement.innerHTML = '<div class="empty">该目录为空</div>';
      return;
    }
    
    // 先对文件进行排序：文件夹在前，文件在后，按名称字母顺序排序
    files.sort((a, b) => {
      if (a.is_dir && !b.is_dir) return -1;
      if (!a.is_dir && b.is_dir) return 1;
      return a.name.localeCompare(b.name);
    });
    
    // 渲染文件列表
    listElement.innerHTML = '';
    
    files.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = `file-item file-type-${file.type}`;
      fileItem.dataset.name = file.name;
      fileItem.dataset.path = file.path;
      fileItem.innerHTML = `
        <i class="fas fa-${file.icon}"></i>
        <span class="file-item-name">${file.name}</span>
      `;
      
      // 点击复制文件名
      fileItem.addEventListener('click', function() {
        // 复制文件名到剪贴板
        navigator.clipboard.writeText(file.name)
          .then(() => {
            // 显示复制成功的视觉反馈
            fileItem.classList.add('file-copied');
            setTimeout(() => {
              fileItem.classList.remove('file-copied');
            }, 1000);
            
            // 可选：将文件名添加到命令输入框
            const commandInput = document.getElementById('offline-tool-edit-command');
            const currentValue = commandInput.value;
            const caretPos = commandInput.selectionStart;
            
            // 如果命令框有光标，则在光标位置插入
            if (typeof caretPos === 'number') {
              commandInput.value = currentValue.substring(0, caretPos) + 
                                   file.name + 
                                   currentValue.substring(caretPos);
              // 设置新的光标位置
              const newPos = caretPos + file.name.length;
              commandInput.setSelectionRange(newPos, newPos);
            } else {
              // 如果没有光标位置，则追加到末尾
              commandInput.value += (currentValue ? ' ' : '') + file.name;
            }
            
            // 聚焦到命令输入框
            commandInput.focus();
          })
          .catch(err => {
            console.error('复制失败:', err);
            showNotification('复制文件名失败', 'error');
          });
      });
      
      // 添加悬停提示
      fileItem.addEventListener('mouseenter', function(e) {
        const tooltip = document.createElement('div');
        tooltip.className = 'file-tooltip';
        tooltip.textContent = `${file.name} (${file.size})`;
        tooltip.style.left = `${e.pageX + 10}px`;
        tooltip.style.top = `${e.pageY + 10}px`;
        document.body.appendChild(tooltip);
        fileItem.dataset.tooltip = Date.now();
      });
      
      fileItem.addEventListener('mousemove', function(e) {
        const tooltip = document.querySelector('.file-tooltip');
        if (tooltip) {
          tooltip.style.left = `${e.pageX + 10}px`;
          tooltip.style.top = `${e.pageY + 10}px`;
        }
      });
      
      fileItem.addEventListener('mouseleave', function() {
        const tooltip = document.querySelector('.file-tooltip');
        if (tooltip) {
          tooltip.remove();
        }
      });
      
      listElement.appendChild(fileItem);
    });
  })
  .catch(error => {
    console.error('获取文件列表出错:', error);
    loadingElement.style.display = 'none';
    listElement.innerHTML = `<div class="error">${error.message}</div>`;
  });
}

// 初始化笔记面板的拖动调整功能
function initNotePanelResize() {
  const offlineToolNotePanel = document.getElementById('offline-tool-note-panel');
  const webToolNotePanel = document.getElementById('web-tool-note-panel');
  
  const offlineToolNoteResizeHandle = document.getElementById('offline-tool-note-resize-handle');
  const webToolNoteResizeHandle = document.getElementById('web-tool-note-resize-handle');
  
  // 离线工具笔记面板拖动调整
  if (offlineToolNoteResizeHandle && offlineToolNotePanel) {
    offlineToolNoteResizeHandle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      
      // 记录初始位置和宽度
      const startX = e.clientX;
      const startWidth = offlineToolNotePanel.clientWidth;
      
      // 创建鼠标移动处理函数
      function handleMouseMove(e) {
        // 计算新宽度 (注意这里使用的是负值，因为是从右侧向左侧调整)
        const newWidth = startWidth - (e.clientX - startX);
        
        // 限制最小宽度
        if (newWidth >= 250 && newWidth <= window.innerWidth * 0.9) {
          offlineToolNotePanel.style.width = newWidth + 'px';
        }
      }
      
      // 创建鼠标释放处理函数
      function handleMouseUp() {
        // 移除事件监听器
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
      
      // 添加事件监听器
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }
  
  // 网页工具笔记面板拖动调整
  if (webToolNoteResizeHandle && webToolNotePanel) {
    webToolNoteResizeHandle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      
      // 记录初始位置和宽度
      const startX = e.clientX;
      const startWidth = webToolNotePanel.clientWidth;
      
      // 创建鼠标移动处理函数
      function handleMouseMove(e) {
        // 计算新宽度 (注意这里使用的是负值，因为是从右侧向左侧调整)
        const newWidth = startWidth - (e.clientX - startX);
        
        // 限制最小宽度
        if (newWidth >= 250 && newWidth <= window.innerWidth * 0.9) {
          webToolNotePanel.style.width = newWidth + 'px';
        }
      }
      
      // 创建鼠标释放处理函数
      function handleMouseUp() {
        // 移除事件监听器
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
      
      // 添加事件监听器
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
  }
}