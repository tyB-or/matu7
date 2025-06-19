// 全局变量
let currentOfflineToolId = null;
let currentWebToolId = null;
let currentWebNoteId = null;
let currentCategory = null; // 当前选中的分类
let currentWebCategory = null; // 当前选中的网页工具分类
let webToolAllTags = []; // 所有可用的标签

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  console.log('页面加载完成，开始初始化...');
  
  // 检查并初始化配置文件
  checkAndInitConfig();
  console.log('配置文件检查完成');
  
  // 初始化导航
  initNavigation();
  console.log('导航初始化完成');
  
  // 初始化搜索框清除按钮
  initClearButtons();
  console.log('搜索框清除按钮初始化完成');
  
  // 初始化离线工具页面
  initOfflineToolsPage();
  console.log('离线工具页面初始化完成');
  
  // 初始化网页工具页面
  initWebToolsPage();
  console.log('网页工具页面初始化完成');
  
  // 初始化网页笔记页面
  initWebNotesPage();
  console.log('网页笔记页面初始化完成');
  
  // 初始化标签输入组件
  initTagsInput();
  console.log('离线工具标签输入组件初始化完成');
  
  // 初始化网页工具标签输入组件
  initWebTagsInput();
  console.log('网页工具标签输入组件初始化完成');
  
  // 初始化网页工具分类输入组件
  initWebCategoryInput();
  console.log('网页工具分类输入组件初始化完成');
  
  // 初始化网页笔记标签输入组件
  initWebNoteTagsInput();
  console.log('网页笔记标签输入组件初始化完成');
  
  // 初始化网页笔记工具输入组件
  initWebNoteToolInput();
  console.log('网页笔记工具输入组件初始化完成');
  
  // 初始化笔记面板的点击外部关闭功能
  initNotePanelClickOutside();
  console.log('笔记面板点击外部关闭功能初始化完成');
  
  // 初始化笔记面板的拖动调整功能
  initNotePanelResize();
  console.log('笔记面板拖动调整功能初始化完成');
  
  // 设置定期自动同步（每5分钟）
  setInterval(silentSyncTools, 5 * 60 * 1000);
  
  // 立即执行一次静默同步，确保工具库是最新的
  setTimeout(silentSyncTools, 5000);
  
  // 初始化工具描述的点击展开功能
  initToolDescriptionExpand();
  console.log('工具描述点击展开功能初始化完成');
  
  // 默认展开网页工具下拉菜单
  setTimeout(function() {
    document.getElementById('web-tools-dropdown').classList.add('open');
  }, 1000);
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
  
  // 离线工具下拉菜单切换
  const offlineToolsToggle = document.getElementById('offline-tools-toggle');
  const offlineToolsDropdown = document.getElementById('offline-tools-dropdown');
  
  offlineToolsToggle.addEventListener('click', function(e) {
    e.preventDefault();
    offlineToolsDropdown.classList.toggle('open');
  });
  
  // 网页工具下拉菜单切换
  const webToolsToggle = document.getElementById('web-tools-toggle');
  const webToolsDropdown = document.getElementById('web-tools-dropdown');
  
  webToolsToggle.addEventListener('click', function(e) {
    e.preventDefault();
    // 只进行展开/收起操作，不加载工具列表
    webToolsDropdown.classList.toggle('open');
  });
  
  // 加载分类菜单
  loadCategoryMenu();
  
  // 默认展开离线工具下拉菜单
  offlineToolsDropdown.classList.add('open');
  
  // 默认展开网页工具下拉菜单
  webToolsDropdown.classList.add('open');
  
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
      const targetPage = document.getElementById(targetId);
      
      // 确保目标页面存在
      if (targetPage) {
        targetPage.style.display = 'block';
        
        // 如果是网页工具，加载全部工具
        if (targetId === 'web-tools-page') {
          loadWebTools();
        }
      }
    });
  });
}

// 加载分类菜单
function loadCategoryMenu(forceRefresh = false) {
  // 添加时间戳防止缓存
  const timestamp = new Date().getTime();
  
  console.log('开始加载离线工具分类菜单, 强制刷新:', forceRefresh);
  
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
      
      // 过滤掉隐藏的工具
      const visibleTools = tools.filter(tool => !tool.hidden);
      
      console.log(`加载了 ${tools.length} 个工具，显示 ${visibleTools.length} 个工具（过滤了 ${tools.length - visibleTools.length} 个隐藏工具）`);
      
      // 从工具列表中提取分类信息
      const categories = {};
      
      // 统计每个分类的工具数量
      visibleTools.forEach(tool => {
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
      
      // 排序分类：按分类名称字母顺序排序
      categoryList.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
      
      // 添加"全部"分类
      const totalCount = visibleTools.length;
      categoryList.unshift({
        name: '全部',
        count: totalCount
      });
      
      console.log('离线工具分类及数量:', categoryList);
      
      renderCategoryMenu(categoryList, forceRefresh);
    })
    .catch(error => {
      console.error('加载分类信息出错:', error);
    });
    
  // 加载网页工具分类菜单
  loadWebCategoryMenu(forceRefresh);
}

// 加载网页工具分类菜单
function loadWebCategoryMenu(forceRefresh = false) {
  // 添加时间戳防止缓存
  const timestamp = new Date().getTime();
  
  console.log('开始加载网页工具分类菜单, 强制刷新:', forceRefresh);
  
  // 从API获取分类信息
  fetch(`/api/web-tools/categories?t=${timestamp}`, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
    .then(response => response.json())
    .then(result => {
      console.log('获取到网页工具分类信息:', result);
      if (result && result.success === true) {
        // 从响应中提取分类信息
        const categories = result.categories || {};
        
        // 转换为数组格式
        const categoryList = Object.keys(categories).map(name => {
          return {
            name: name, 
            count: categories[name]
          };
        });
        
        // 检查是否已经包含"全部"分类
        const hasAll = categoryList.some(cat => cat.name === '全部');
        
        // 仅当不存在"全部"分类时才添加
        if (!hasAll) {
          // 添加"全部"分类
          const totalCount = Object.values(categories).reduce((sum, count) => sum + count, 0);
          categoryList.unshift({
            name: '全部',
            count: totalCount
          });
        }
        
        // 按名称排序，但确保"全部"始终在第一位
        categoryList.sort((a, b) => {
          if (a.name === '全部') return -1;
          if (b.name === '全部') return 1;
          return a.name.localeCompare(b.name, 'zh-CN');
        });
        
        console.log('准备渲染网页工具分类菜单:', categoryList);
        renderWebCategoryMenu(categoryList, forceRefresh);
      } else {
        console.error('获取网页工具分类信息失败:', result);
      }
    })
    .catch(error => {
      console.error('加载网页工具分类信息出错:', error);
    });
}

// 渲染分类菜单
function renderCategoryMenu(categories, forceRefresh = false) {
  const categoriesMenu = document.getElementById('offline-categories-menu');
  categoriesMenu.innerHTML = ''; // 清空菜单
  
  // 去重：确保分类名称唯一
  const uniqueCategories = [];
  const seenCategories = new Set();
  
  categories.forEach(category => {
    if (!seenCategories.has(category.name)) {
      seenCategories.add(category.name);
      uniqueCategories.push(category);
    }
  });
  
  // 添加"全部"选项
  const allItem = document.createElement('a');
  allItem.className = 'nav-dropdown-item';
  allItem.setAttribute('data-category', 'all');
  
  // 找到"全部"分类的数量，避免重复计算
  const totalCount = uniqueCategories.find(cat => cat.name === '全部')?.count || 
                    uniqueCategories.reduce((total, cat) => cat.name !== '全部' ? total + cat.count : total, 0);
                    
  allItem.innerHTML = `
    <span>全部工具</span>
    <span class="category-badge">${totalCount}</span>
  `;
  categoriesMenu.appendChild(allItem);
  
  // 没有分类数据时，只显示全部选项
  if (!uniqueCategories || uniqueCategories.length === 0) {
    // 加载所有工具
    allItem.classList.add('active');
    loadOfflineToolsByCategory('全部', forceRefresh);
    
    allItem.addEventListener('click', function(e) {
      e.preventDefault();
      activateCategoryItem(this);
      currentCategory = '全部';
      localStorage.setItem('last_view_category', '全部');
      loadOfflineToolsByCategory('全部', forceRefresh);
    });
    
    return;
  }
  
  // 设置"全部"选项的点击事件
  allItem.addEventListener('click', function(e) {
    e.preventDefault();
    activateCategoryItem(this);
    currentCategory = '全部';
    localStorage.setItem('last_view_category', '全部');
    loadOfflineToolsByCategory('全部', forceRefresh);
  });
  
  // 添加各个分类选项，跳过"全部"分类
  uniqueCategories.forEach(category => {
    // 跳过"全部"分类，因为已经添加过了
    if (category.name === '全部') return;
    
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
    
    // 分类点击事件：加载该分类的工具
    item.addEventListener('click', function(e) {
      e.preventDefault();
      activateCategoryItem(this);
      const categoryName = this.getAttribute('data-category');
      currentCategory = categoryName;
      localStorage.setItem('last_view_category', categoryName);
      loadOfflineToolsByCategory(categoryName, forceRefresh);
    });
  });
  
  // 如果有存储的上次视图分类，恢复该分类视图
  const lastViewCategory = localStorage.getItem('last_view_category');
  if (lastViewCategory && !forceRefresh) {
    console.log('恢复上次分类视图:', lastViewCategory);
    
    // 处理全部分类的情况：lastViewCategory可能是'全部'或'all'
    const isAllCategory = lastViewCategory === '全部' || lastViewCategory === 'all';
    const categorySelector = isAllCategory ? '[data-category="all"]' : `[data-category="${lastViewCategory}"]`;
    
    const categoryItem = categoriesMenu.querySelector(categorySelector);
    
    // 检查是否找到对应分类项
    if (categoryItem) {
      // 如果找到，触发点击事件
      categoryItem.click();
    } else {
      // 如果未找到，默认点击"全部"
      console.log('未找到上次分类视图，使用全部视图');
      allItem.click();
    }
  } else {
    // 如果没有上次分类或强制刷新，则激活全部选项
    // 检查是否有当前分类，如果有则激活对应分类
    if (currentCategory) {
      // 处理全部分类的情况：currentCategory可能是'全部'或'all'
      const isAllCategory = currentCategory === '全部' || currentCategory === 'all';
      const categorySelector = isAllCategory ? '[data-category="all"]' : `[data-category="${currentCategory}"]`;
      
      const categoryItem = categoriesMenu.querySelector(categorySelector);
      if (categoryItem) {
        categoryItem.classList.add('active');
      } else {
        allItem.classList.add('active');
      }
    } else {
      allItem.classList.add('active');
    }
  }
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
  console.log(`调用loadOfflineTools，重定向到loadOfflineToolsByCategory('全部', ${forceRefresh})`);
  // 直接使用loadOfflineToolsByCategory函数，统一处理方式
  loadOfflineToolsByCategory('全部', forceRefresh);
}

// 按分类加载离线工具
function loadOfflineToolsByCategory(category, forceRefresh = false) {
  // 显示加载状态
  const grid = document.getElementById('offline-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 更新页面标题显示当前分类
  const titleElement = document.querySelector('#offline-tools-page .category-title');
  if (titleElement) {
    titleElement.textContent = category || '全部工具';
      }
      
  console.log(`加载分类工具: ${category}, 强制刷新: ${forceRefresh}`);
  
  // 更新当前分类全局变量
  currentCategory = category;
  
  // 添加时间戳防止缓存
  const timestamp = new Date().getTime();
  
  // 统一处理，将"全部"转换为"all"
  const normalizedCategory = (category === '全部' || !category) ? 'all' : category;
  
  // 所有情况都使用search API，保持一致性
  const apiUrl = `/api/offline-tools/search?category=${encodeURIComponent(normalizedCategory)}&t=${timestamp}&force=${forceRefresh ? 'true' : 'false'}`;
  
  // 请求API获取工具
  fetch(apiUrl, {
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
      
      // 确保tools是数组
      if (!Array.isArray(tools)) {
        tools = [];
        console.error('工具数据格式错误，不是数组:', result);
      }
      
      // 过滤掉隐藏的工具
      const visibleTools = tools.filter(tool => !tool.hidden);
      
      console.log(`加载了 ${category || '全部'} 分类的 ${visibleTools.length} 个工具`);
      
      renderOfflineTools(visibleTools, false); // 不需要分类显示
      
      // 显示工具数量，与网页工具保持一致
      if (titleElement) {
        const displayCategory = category || '全部';
        titleElement.textContent = `${displayCategory} (${visibleTools.length})`;
      }
    })
    .catch(error => {
      console.error('加载分类工具出错:', error);
      grid.innerHTML = '<div class="error">加载工具列表失败: ' + error.message + '</div>';
      
      // 显示错误状态，与网页工具保持一致
      if (titleElement) {
        const displayCategory = category || '全部';
        titleElement.textContent = `${displayCategory} (加载出错)`;
      }
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
      
      // 根据工具特性正确设置工具类型 - 离线工具和网页工具的区分
      // 离线工具有path字段，网页工具没有path字段
      // 确保通过path字段判断，而不是URL字段（离线工具也可以有URL字段）
      const isOfflineTool = tool.path !== undefined && tool.path !== null && tool.path !== '';
      card.dataset.toolType = isOfflineTool ? 'offline' : 'web';
      
      console.log(`渲染工具: ${tool.name}, 类型: ${card.dataset.toolType}, Path: ${tool.path}, URL: ${tool.url}`);
      
      // 计算创建时间
      let createdAt;
      try {
        createdAt = new Date(tool.created_at);
      } catch (e) {
        console.error('日期解析错误:', e);
        createdAt = new Date();
      }
      
      // 计算最后使用时间
      let lastUsedAt;
      try {
        lastUsedAt = tool.last_used_at ? new Date(tool.last_used_at) : null;
      } catch (e) {
        console.error('最后使用日期解析错误:', e);
        lastUsedAt = null;
      }
      
      // 如果没有最后使用时间，使用更新时间
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
      if (!isOfflineTool) {
        // 网页工具
        const displayUrl = tool.url && tool.url.length > 30 ? tool.url.substring(0, 30) + '...' : (tool.url || '');
        
        card.innerHTML = `
          <div class="card-header">
            <div class="card-header-content">
              <div class="tool-icon">
                ${tool.icon && tool.icon !== '' ? 
                  `<img src="/icons/websites/${tool.icon}" alt="${tool.name}" onerror="this.onerror=null; this.src='/icons/websites/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-globe\'></i>'; }">` : 
                  `<i class="fas fa-link"></i>`}
              </div>
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
              <span><i class="fas fa-folder-open"></i> ${tool.category || '未分类'}</span>
              <span class="usage-count" data-tool-id="web-${tool.id}"><i class="fas fa-chart-line"></i> ${tool.usage_count || 0}</span>
            </div>
            
            <div class="tool-meta">
              <span><i class="fas fa-link"></i> <a href="${tool.url || '#'}" target="_blank" title="${tool.url || ''}">${displayUrl}</a></span>
            </div>
            
            <div class="tags">
              ${tags.map(tag => `<span class="tag" data-tag="${tag}"><i class="fas fa-tag fa-xs"></i> ${tag}</span>`).join('')}
            </div>
            
            <div class="tool-description" data-tooltip="${description}">${description}</div>
            <div class="tool-description-full">${description}</div>
            
            <div class="tool-meta time-meta">
              <span><i class="fas fa-calendar-plus fa-xs"></i> 创建: ${createdAt.toLocaleDateString()}</span>
              <span><i class="fas fa-calendar-check fa-xs"></i> ${lastUsedAt ? '最后使用: ' + lastUsedAt.toLocaleDateString() : '最后使用: ' + updatedAt.toLocaleDateString()}</span>
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
        
        // 处理URL显示
        let displayUrl = '';
        if (tool.url) {
          displayUrl = tool.url.length > 30 ? tool.url.substring(0, 30) + '...' : tool.url;
        }
        
        // 检查图标路径，确保正确使用离线工具图标
        const iconPath = tool.icon || 'default-icon.png';
        const timestamp = new Date().getTime(); // 添加时间戳避免缓存问题
        
        card.innerHTML = `
          <div class="card-header">
            <div class="card-header-content">
              <div class="tool-icon">
                ${iconPath ? 
                  `<img src="/icons/offline/${iconPath}?t=${timestamp}" alt="${tool.name}" onerror="this.onerror=null; this.src='/icons/offline/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-desktop\'></i>'; }">` : 
                  `<i class="fas fa-desktop"></i>`}
              </div>
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
              <span class="usage-count" data-tool-id="${tool.id}"><i class="fas fa-chart-line"></i> ${tool.usage_count || 0}</span>
            </div>
            ${tool.url ? `<div class="tool-meta">
              <span><i class="fas fa-link"></i> <a href="${tool.url}" target="_blank" title="${tool.url}">${displayUrl}</a></span>
            </div>` : ''}
            
            <div class="tags">
              ${tags.map(tag => `<span class="tag" data-tag="${tag}"><i class="fas fa-tag fa-xs"></i> ${tag}</span>`).join('')}
            </div>
            
            <div class="tool-description" data-tooltip="${description}">${description}</div>
            <div class="tool-description-full">${description}</div>
            
            <div class="tool-meta time-meta">
              <span><i class="fas fa-calendar-plus fa-xs"></i> 创建: ${createdAt.toLocaleDateString()}</span>
              <span><i class="fas fa-calendar-check fa-xs"></i> ${lastUsedAt ? '最后使用: ' + lastUsedAt.toLocaleDateString() : '最后使用: ' + updatedAt.toLocaleDateString()}</span>
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
              // 使用网页工具标签搜索
              searchWebToolsByTag(tagValue);
              
              // 显示搜索框中的标签信息
              const searchInput = document.getElementById('web-tools-search');
              if (searchInput) {
                searchInput.value = `tag:${tagValue}`;
              }
            } else {
              // 离线工具使用标签搜索
              searchByTag(tagValue);
              
              // 显示搜索框中的标签信息
              const searchInput = document.getElementById('offline-tools-search');
              if (searchInput) {
                searchInput.value = `标签: ${tagValue}`;
              }
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
  
  // 更新页面标题显示"全部"
  const titleElement = document.querySelector('#offline-tools-page .category-title');
  if (titleElement) {
    titleElement.textContent = '全部工具';
  }
  
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
  
  // 保存当前选中的分类
  const selectedCategory = currentCategory;
  
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
      
      // 重新加载分类菜单
      loadCategoryMenu(true);
      
      // 等待分类菜单加载完成后，恢复到之前选中的分类视图
      setTimeout(() => {
        // 如果之前有选中分类，激活该分类
        if (selectedCategory) {
          const categoryItem = document.querySelector(`.nav-dropdown-item[data-category="${selectedCategory}"]`);
          if (categoryItem) {
            activateCategoryItem(categoryItem);
            loadOfflineToolsByCategory(selectedCategory, true);
      } else {
            // 如果找不到之前的分类，回到"全部"视图
            const allCategoryItem = document.querySelector('.nav-dropdown-item[data-category="all"]');
            if (allCategoryItem) {
              activateCategoryItem(allCategoryItem);
            }
        loadOfflineTools(true);
      }
        } else {
          // 如果之前是全部视图，保持全部视图
          loadOfflineTools(true);
        }
      }, 200);
      
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
      
      // 更新搜索状态
      if (details.length > 0) {
        showSearchStatus('success', message, 'offline');
      } else {
        showSearchStatus('success', '工具库已成功同步，没有变更', 'offline');
      }
      
      showNotification(message, 'success');
    })
    .catch(error => {
      console.error('刷新工具出错:', error);
      grid.innerHTML = '<div class="error"><i class="fas fa-exclamation-circle"></i>刷新工具列表失败: ' + error.message + '</div>';
      
      // 显示错误状态
      showSearchStatus('error', `刷新工具列表失败: ${error.message}`, 'offline');
      
      // 显示错误通知
      showNotification('刷新工具列表失败: ' + error.message, 'error');
    });
}

// 搜索离线工具
function searchOfflineTools(query, tags) {
  const grid = document.getElementById('offline-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 更新页面标题显示 - 显示搜索条件和结果数量
  const titleElement = document.querySelector('#offline-tools-page .category-title');
  if (titleElement) {
    if (tags && (Array.isArray(tags) && tags.length > 0 || typeof tags === 'string' && tags.trim() !== '')) {
      const tagText = Array.isArray(tags) ? tags.join('|') : tags;
      titleElement.textContent = `标签: ${tagText}`;
    } else if (query) {
      titleElement.textContent = `搜索: ${query}`;
    } else {
      titleElement.textContent = '搜索结果';
    }
  }
  
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
      
      // 全局搜索结果，不再根据当前分类过滤
        renderOfflineTools(visibleTools, true);
      
      // 更新搜索结果状态
      if (visibleTools.length > 0) {
        let resultMessage = `${visibleTools.length}个工具`;
        if (query && query.trim() !== '') {
          resultMessage += ` ${formatSearchKeywords(query.trim())}`;
        }
        if (tags) {
          if (Array.isArray(tags) && tags.length > 0) {
            resultMessage += ` <span class="search-keywords">${tags.join('|')}</span>`;
          } else if (typeof tags === 'string' && tags.trim() !== '') {
            resultMessage += ` <span class="search-keywords">${tags}</span>`;
          }
        }
        showSearchStatus('success', resultMessage, 'offline');
        
        // 更新标题显示搜索结果数量
        if (titleElement) {
          if (tags && (Array.isArray(tags) && tags.length > 0 || typeof tags === 'string' && tags.trim() !== '')) {
            const tagText = Array.isArray(tags) ? tags.join('|') : tags;
            titleElement.textContent = `标签: ${tagText} (${visibleTools.length})`;
          } else if (query) {
            titleElement.textContent = `搜索: ${query} (${visibleTools.length})`;
          } else {
            titleElement.textContent = `搜索结果 (${visibleTools.length})`;
          }
        }
      } else {
        let noResultMessage = '无匹配工具';
        if (query && query.trim() !== '') {
          noResultMessage += ` ${formatSearchKeywords(query.trim())}`;
        }
        if (tags) {
          if (Array.isArray(tags) && tags.length > 0) {
            noResultMessage += ` <span class="search-keywords">${tags.join('|')}</span>`;
          } else if (typeof tags === 'string' && tags.trim() !== '') {
            noResultMessage += ` <span class="search-keywords">${tags}</span>`;
          }
        }
        showSearchStatus('warning', noResultMessage, 'offline');
        
        // 更新标题显示无搜索结果
        if (titleElement) {
          if (tags && (Array.isArray(tags) && tags.length > 0 || typeof tags === 'string' && tags.trim() !== '')) {
            const tagText = Array.isArray(tags) ? tags.join('|') : tags;
            titleElement.textContent = `标签: ${tagText} (0)`;
          } else if (query) {
            titleElement.textContent = `搜索: ${query} (0)`;
          } else {
            titleElement.textContent = `搜索结果 (0)`;
          }
        }
      }
    })
    .catch(error => {
      console.error('搜索工具出错:', error);
      grid.innerHTML = `<div class="error">搜索失败: ${error.message}</div>`;
      
      // 显示错误状态
      showSearchStatus('error', `搜索失败: ${error.message}`, 'offline');
      
      // 更新标题显示错误状态
      if (titleElement) {
        if (tags && (Array.isArray(tags) && tags.length > 0 || typeof tags === 'string' && tags.trim() !== '')) {
          const tagText = Array.isArray(tags) ? tags.join('|') : tags;
          titleElement.textContent = `标签: ${tagText} (搜索出错)`;
        } else if (query) {
          titleElement.textContent = `搜索: ${query} (搜索出错)`;
        } else {
          titleElement.textContent = '搜索结果 (搜索出错)';
        }
      }
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
          
          // 更新使用次数和最后使用时间
          updateToolUsageCount(id);
          
          // 更新工具卡片上的最后使用时间为当前时间
          const now = new Date();
          const toolCard = document.querySelector(`.tool-card button[data-id="${id}"]`).closest('.tool-card');
          if (toolCard) {
            const timeMetaElement = toolCard.querySelector('.time-meta span:last-child');
            if (timeMetaElement) {
              timeMetaElement.innerHTML = `<i class="fas fa-calendar-check fa-xs"></i> 最后使用: ${now.toLocaleDateString()}`;
            }
          }
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
  const iconPreview = document.getElementById('offline-tool-icon-preview');
  const iconStatus = document.getElementById('offline-tool-icon-status');
  
  // 初始化选项卡切换功能
  initTabSwitching();
  
  // 初始化路径复制功能
  initPathCopy();
  
  // 初始化URL输入监听
  initUrlInputListener();
  
  // 重置图标状态
  iconStatus.textContent = '';
  
  // 添加图标刷新按钮事件
  const refreshButton = document.getElementById('offline-tool-icon-refresh');
  refreshButton.onclick = function() {
    const toolId = document.getElementById('offline-tool-edit-id').value;
    
    // 刷新图标
    iconStatus.textContent = '正在获取图标...';
    console.log(`开始刷新离线工具图标，ID: ${toolId}`);
    
    fetch(`/api/offline-tools/${toolId}/refresh-icon`, {
      method: 'POST',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('图标刷新响应:', data);
        
        if (data.success) {
          // 保存图标名称到隐藏字段
          const iconName = data.icon.split('/').pop(); // 提取文件名
          document.getElementById('offline-tool-edit-icon').value = iconName;
          
          // 更新图标预览，添加时间戳避免缓存
          const timestamp = new Date().getTime();
          iconPreview.innerHTML = `<img src="/icons/offline/${iconName}?t=${timestamp}" onerror="this.onerror=null; this.src='/icons/offline/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-desktop\'></i>'; }">`;
          iconStatus.textContent = '图标更新成功';
          
          // 提示用户需要保存工具才能应用更改
          setTimeout(() => {
            iconStatus.textContent = '图标已更新，点击保存按钮应用更改';
          }, 2000);
        } else {
          iconStatus.textContent = `获取失败: ${data.error || '未知错误'}`;
          iconPreview.innerHTML = '<i class="fas fa-desktop"></i>';
        }
      })
      .catch(error => {
        console.error('刷新图标出错:', error);
        iconStatus.textContent = '获取图标失败: ' + error.message;
      });
  };
  
  // 添加图标选择按钮事件
  const selectButton = document.getElementById('offline-tool-icon-select');
  selectButton.onclick = function() {
    // 显示图标选择器
    showIconSelector(function(selectedIcon) {
      // 更新选中的图标
      document.getElementById('offline-tool-edit-icon').value = selectedIcon;
      
      // 更新图标预览，添加时间戳避免缓存
      const timestamp = new Date().getTime();
      iconPreview.innerHTML = `<img src="/icons/offline/${selectedIcon}?t=${timestamp}" onerror="this.onerror=null; this.src='/icons/offline/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-desktop\'></i>'; }">`;
      iconStatus.textContent = '已选择图标: ' + selectedIcon;
    }, 'offline');
  };
  
  fetch(`/api/offline-tools/${id}?t=${new Date().getTime()}`)
    .then(response => response.json())
    .then(tool => {
      // 填充表单数据
      document.getElementById('offline-tool-edit-id').value = tool.id;
      document.getElementById('offline-tool-edit-name').value = tool.name;
      document.getElementById('offline-tool-edit-description').value = tool.description || '';
      document.getElementById('offline-tool-edit-tags').value = tool.tags.join(',');
      
      // 初始化标签输入组件
      initTagsInput();
      
      // 使用工具中的命令，如果没有则显示空字符串
      document.getElementById('offline-tool-edit-command').value = tool.command || '';
      
      // 设置工具URL
      const urlInput = document.getElementById('offline-tool-edit-url');
      urlInput.value = tool.url || '';
      
      // 如果有URL，预加载图标预览
      if (tool.url) {
        previewUrlIcon(tool.url);
      }
      
      // 处理图标路径，适应不同格式
      let iconPath = tool.icon || '';
      // 如果包含路径分隔符，提取文件名
      if (iconPath && iconPath.includes('/')) {
        iconPath = iconPath.split('/').pop();
      }
      document.getElementById('offline-tool-edit-icon').value = iconPath;
      
      // 显示图标预览
      if (iconPath) {
        // 添加时间戳参数避免浏览器缓存
        iconPreview.innerHTML = `<img src="/icons/offline/${iconPath}?t=${new Date().getTime()}" onerror="this.onerror=null; this.src='/icons/offline/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-desktop\'></i>'; }">`;
      } else {
        iconPreview.innerHTML = '<i class="fas fa-desktop"></i>';
      }
      
      // 显示完整的工具分类路径
      const categoryPathElement = document.getElementById('offline-tool-edit-category-path');
      const categoryPathDisplayElement = document.getElementById('offline-tool-edit-category-path-display');
      if (categoryPathElement && categoryPathDisplayElement) {
        // 使用完整的工具路径，不再截取目录部分
        const toolPath = tool.path ? tool.path : '';
        categoryPathElement.textContent = `工具路径: ${toolPath}`;
        categoryPathDisplayElement.textContent = toolPath;
        
        // 设置title属性显示完整路径
        categoryPathDisplayElement.title = toolPath;
      }
      
      // 立即显示matu7程序路径（防止异步加载导致不显示）
      const matu7PathElement = document.getElementById('offline-tool-edit-matu7-path');
      const matu7PathDisplayElement = document.getElementById('offline-tool-edit-matu7-path-display');
      if (matu7PathElement && matu7PathDisplayElement) {
        matu7PathElement.textContent = '程序路径: 加载中...';
        matu7PathDisplayElement.textContent = '加载中...';
      }
      
      // 获取matu7路径
      fetch('/api/offline-tools/config')
        .then(response => response.json())
        .then(config => {
          console.log('获取到配置信息:', config); // 添加调试日志
          // 显示matu7程序路径
          if (matu7PathElement && matu7PathDisplayElement) {
            // 确保配置中有BasePath
            const basePath = config && config.base_path ? config.base_path : '未知路径';
            matu7PathElement.textContent = `程序路径: ${basePath}`;
            matu7PathDisplayElement.textContent = basePath;
            
            // 设置title属性显示完整路径
            matu7PathDisplayElement.title = basePath;
            console.log('设置程序路径显示:', basePath); // 添加调试日志
          }
        })
        .catch(error => {
          console.error('获取matu7配置信息出错:', error);
          if (matu7PathElement && matu7PathDisplayElement) {
            matu7PathElement.textContent = '程序路径: 获取失败';
            matu7PathDisplayElement.textContent = '获取失败';
          }
        });
      
      // 显示模态框
      document.getElementById('offline-tool-edit-modal').style.display = 'flex';
      
      // 等待API加载完成后设置标签值
      setTimeout(() => {
        console.log('延迟设置标签:', tool.tags.join(',')); // 添加调试信息
        initializeTagsFromText(tool.tags.join(','));
      }, 500);
      
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

// 初始化选项卡切换功能
function initTabSwitching() {
  const tabItems = document.querySelectorAll('.tab-item');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabItems.forEach(item => {
    item.addEventListener('click', function() {
      // 移除所有选项卡的active类
      tabItems.forEach(tab => tab.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // 添加当前选项卡的active类
      this.classList.add('active');
      const tabId = this.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
    });
  });
}

// 初始化路径复制功能
function initPathCopy() {
  // 复制工具路径
  const copyToolPathBtn = document.getElementById('copy-tool-path-btn');
  if (copyToolPathBtn) {
    copyToolPathBtn.addEventListener('click', function() {
      const pathText = document.getElementById('offline-tool-edit-category-path-display').textContent;
      copyTextToClipboard(pathText);
      showNotification('工具路径已复制到剪贴板', 'success');
    });
  }
  
  // 复制程序路径
  const copyMatu7PathBtn = document.getElementById('copy-matu7-path-btn');
  if (copyMatu7PathBtn) {
    copyMatu7PathBtn.addEventListener('click', function() {
      const pathText = document.getElementById('offline-tool-edit-matu7-path-display').textContent;
      copyTextToClipboard(pathText);
      showNotification('程序路径已复制到剪贴板', 'success');
    });
  }
}

// 复制文本到剪贴板
function copyTextToClipboard(text) {
  // 创建临时文本区域
  const textArea = document.createElement('textarea');
  textArea.value = text;
  
  // 使文本区域不可见
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  
  // 选择文本并复制
  textArea.select();
  document.execCommand('copy');
  
  // 清理
  document.body.removeChild(textArea);
}

// 保存离线工具编辑
function saveOfflineToolEdit() {
  const id = document.getElementById('offline-tool-edit-id').value;
  const name = document.getElementById('offline-tool-edit-name').value;
  const description = document.getElementById('offline-tool-edit-description').value;
  const tags = document.getElementById('offline-tool-edit-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const command = document.getElementById('offline-tool-edit-command').value;
  const url = document.getElementById('offline-tool-edit-url').value;
  const icon = document.getElementById('offline-tool-edit-icon').value;
  
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
  
  // 保存原始的URL和当前视图状态
  let originalUrl = '';
  let urlChanged = false;
  
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
      // 记录原始URL
      originalUrl = tool.url || '';
      
      // 检查URL是否发生变化
      urlChanged = (originalUrl !== url) && url.trim() !== '';
      
      console.log(`URL变化检测：原始URL=${originalUrl}, 新URL=${url}, 是否变化=${urlChanged}`);
      
      // 更新工具信息
      tool.name = name;
      tool.description = description;
      tool.tags = tags;
      // 确保命令是用户输入的值，即使是空字符串
      tool.command = command;
      tool.url = url; // 添加URL信息
      tool.icon = icon; // 添加图标信息
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
      
      // 如果URL发生了变化，自动刷新图标
      if (urlChanged) {
        console.log('检测到URL变化，自动刷新图标');
        
        // 显示刷新图标通知
        showNotification('URL已更新，正在自动刷新图标...', 'info');
        
        // 调用刷新图标API
        fetch(`/api/offline-tools/${id}/refresh-icon`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`图标刷新失败: ${response.status} ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          console.log('自动图标刷新响应:', data);
          
          if (data.success) {
            showNotification('图标已成功更新', 'success');
      } else {
            console.error('自动刷新图标失败:', data.error || '未知错误');
          }
          
          // 无论图标刷新成功与否，都保持当前视图状态
          reloadCurrentView();
        })
        .catch(error => {
          console.error('自动刷新图标出错:', error);
          showNotification('图标刷新失败: ' + error.message, 'warning');
          
          // 发生错误时仍然保持当前视图状态
          reloadCurrentView();
        });
      } else {
        // 如果URL没有变化，直接更新视图
        reloadCurrentView();
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
    
  // 重载当前视图的函数
  function reloadCurrentView() {
    // 检查是否是搜索状态
    const searchInput = document.getElementById('offline-tools-search');
    if (searchInput && searchInput.value) {
      const searchText = searchInput.value;
      
      // 检查是否是标签搜索（以"标签:"开头）
      if (searchText.match(/^标签[:：]\s*(.+)$/)) {
        const tag = searchText.match(/^标签[:：]\s*(.+)$/)[1].trim();
        console.log(`恢复标签搜索视图: ${tag}`);
        searchOfflineTools("", [tag]);
      }
      // 检查是否是使用tag:或tag=格式的标签搜索
      else if (searchText.match(/^tag[:=]\s*(.+)$/i)) {
        const tag = searchText.match(/^tag[:=]\s*(.+)$/i)[1].trim();
        console.log(`恢复tag:格式的标签搜索视图: ${tag}`);
        searchOfflineTools("", [tag]);
      }
      // 普通文本搜索
      else {
        console.log(`恢复普通文本搜索视图: ${searchText}`);
        searchOfflineTools(searchText);
      }
    } else if (currentCategory) {
      // 如果有当前分类，保持分类视图
      console.log(`reloadCurrentView: 恢复当前分类视图: ${currentCategory}`);
      loadOfflineToolsByCategory(currentCategory, true);
    } else {
      // 否则重新加载全部工具
      console.log('reloadCurrentView: 没有当前分类，加载全部工具');
      loadOfflineToolsByCategory('全部', true);
    }
  }
}

// =================== 网页工具操作函数 ===================

// 加载网页工具列表
function loadWebTools() {
  // 显示加载状态
  const grid = document.getElementById('web-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 添加时间戳参数防止缓存
  const timestamp = new Date().getTime();
  
  // 更新页面标题显示"全部"
  const titleElement = document.querySelector('#web-tools-page .category-title');
  if (titleElement) {
    titleElement.textContent = '全部';
  }
  
  // 重置当前分类
  currentWebCategory = '全部';
  
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
      
      // 更新标题显示工具数量
      const titleElement = document.querySelector('#web-tools-page .category-title');
      if (titleElement && Array.isArray(tools)) {
        titleElement.textContent = `全部 (${tools.length})`;
      }
    })
    .catch(error => {
      console.error('加载网页工具出错:', error);
      grid.innerHTML = '<div class="error">加载工具列表失败: ' + error.message + '</div>';
      
      // 更新标题显示错误状态
      const titleElement = document.querySelector('#web-tools-page .category-title');
      if (titleElement) {
        titleElement.textContent = '全部 (加载出错)';
      }
    });
}

// 渲染网页工具列表
function renderWebTools(tools) {
  const grid = document.getElementById('web-tools-grid');
  grid.innerHTML = '';
  
  // 处理null或undefined的情况
  if (!tools) {
    tools = [];
  }
  
  if (tools.length === 0) {
    grid.innerHTML = `<div class="no-data">
      暂无工具
    </div>`;
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
function searchWebTools(query, category) {
  // 显示搜索中状态
  const grid = document.getElementById('web-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 更新页面标题显示
  const titleElement = document.querySelector('#web-tools-page .category-title');
  if (titleElement) {
    if (category && category !== '全部') {
      titleElement.textContent = category;
    } else {
      titleElement.textContent = '搜索结果';
    }
  }
  
  let statusMessage = '正在搜索';
  if (query && query.trim() !== '') {
    statusMessage += ` ${formatSearchKeywords(query.trim())}`;
  }
  if (category && category !== '全部') {
    statusMessage += ` 在分类 <span class="search-keywords">${category}</span> 中`;
  }
  showSearchStatus('loading', `${statusMessage}...`, 'web');
  
  // 构建搜索URL
  let searchUrl = `/api/web-tools/search?query=${encodeURIComponent(query)}`;
  
  // 如果提供了分类参数且不是"全部"，则添加到URL中
  if (category && category !== '全部' && category !== null) {
    searchUrl += `&category=${encodeURIComponent(category)}`;
  }
  
  fetch(searchUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(tools => {
      // 渲染工具列表
      renderWebTools(tools);
      
      // 确保tools是数组
      if (!Array.isArray(tools)) {
        console.error('搜索返回的数据不是数组:', tools);
        tools = [];
      }
      
      // 更新搜索结果状态
      if (tools.length > 0) {
        let resultMessage = `${tools.length}个工具`;
        if (query && query.trim() !== '') {
          resultMessage += ` ${formatSearchKeywords(query.trim())}`;
        }
        if (category && category !== '全部' && category !== null) {
          resultMessage += ` <span class="search-keywords">${category}</span>`;
        }
        showSearchStatus('success', resultMessage, 'web');
        
        // 更新标题右侧显示搜索结果数量
        if (titleElement) {
          let titleText = '';
          if (category && category !== '全部' && category !== null) {
            titleText = `${category} (${tools.length})`;
          } else {
            titleText = `搜索: ${query} (${tools.length})`;
          }
          titleElement.textContent = titleText;
        }
      } else {
        let noResultMessage = '无匹配工具';
        if (query && query.trim() !== '') {
          noResultMessage += ` ${formatSearchKeywords(query.trim())}`;
        }
        if (category && category !== '全部' && category !== null) {
          noResultMessage += ` <span class="search-keywords">${category}</span>`;
        }
        showSearchStatus('warning', noResultMessage, 'web');
        
        // 更新标题右侧显示无结果
        if (titleElement) {
          let titleText = '';
          if (category && category !== '全部' && category !== null) {
            titleText = `${category} (0)`;
          } else {
            titleText = `搜索: ${query} (0)`;
          }
          titleElement.textContent = titleText;
        }
      }
    })
    .catch(error => {
      console.error('搜索工具出错:', error);
      grid.innerHTML = `<div class="error">搜索失败: ${error.message}</div>`;
      
      // 显示错误状态
      showSearchStatus('error', `搜索失败: ${error.message}`, 'web');
      
      // 更新标题显示错误状态
      if (titleElement) {
        let titleText = '';
        if (category && category !== '全部' && category !== null) {
          titleText = `${category} (搜索出错)`;
        } else {
          titleText = `搜索: ${query} (搜索出错)`;
        }
        titleElement.textContent = titleText;
      }
    });
}

// 按标签搜索网页工具
function searchWebToolsByTag(tag) {
  if (!tag) return;
  
  console.log(`执行网页工具标签搜索: ${tag}`);
  
  // 显示搜索中状态
  const grid = document.getElementById('web-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 更新页面标题显示
  const titleElement = document.querySelector('#web-tools-page .category-title');
  if (titleElement) {
    titleElement.textContent = `标签搜索`;
  }
  
  // 显示搜索状态消息
  let statusMessage = `正在搜索标签 <span class="search-keywords">${tag}</span>`;
  showSearchStatus('loading', `${statusMessage}...`, 'web');
  
  // 构建API URL，使用tag参数
  const searchUrl = `/api/web-tools/search?tag=${encodeURIComponent(tag)}`;
  
  fetch(searchUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(tools => {
      // 渲染工具列表
      renderWebTools(tools);
      
      // 确保tools是数组
      if (!Array.isArray(tools)) {
        console.error('标签搜索返回的数据不是数组:', tools);
        tools = [];
      }
      
      // 更新搜索结果状态
      if (tools.length > 0) {
        let resultMessage = `${tools.length}个工具 标签:<span class="search-keywords">${tag}</span>`;
        showSearchStatus('success', resultMessage, 'web');
        
        // 更新标题右侧显示搜索结果数量
        if (titleElement) {
          titleElement.textContent = `标签: ${tag} (${tools.length})`;
        }
      } else {
        let noResultMessage = `无匹配工具 标签:<span class="search-keywords">${tag}</span>`;
        showSearchStatus('warning', noResultMessage, 'web');
        
        // 更新标题右侧显示无结果
        if (titleElement) {
          titleElement.textContent = `标签: ${tag} (0)`;
        }
      }
    })
    .catch(error => {
      console.error('标签搜索工具出错:', error);
      grid.innerHTML = `<div class="error">搜索失败: ${error.message}</div>`;
      
      // 显示错误状态
      showSearchStatus('error', `标签搜索失败: ${error.message}`, 'web');
      
      // 更新标题显示错误状态
      if (titleElement) {
        titleElement.textContent = `标签: ${tag} (搜索出错)`;
      }
    });
}

// 根据分类加载网页工具
function loadWebToolsByCategory(category, forceRefresh = false) {
  // 显示加载状态
  const grid = document.getElementById('web-tools-grid');
  grid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // 更新页面标题显示当前分类
  const titleElement = document.querySelector('#web-tools-page .category-title');
  if (titleElement) {
    titleElement.textContent = category || '全部工具';
  }
  
  // 添加时间戳参数防止缓存
  const timestamp = new Date().getTime();
  
  console.log('加载网页工具分类:', category, forceRefresh);
  
  // 保存当前分类为全局变量
  currentWebCategory = category;
  
  // 构建URL，如果分类是"全部"则加载所有工具
  let url = '/api/web-tools';
  let hasParams = false;
  
  if (category && category !== '全部') {
    url = `/api/web-tools/search?category=${encodeURIComponent(category)}`;
    hasParams = true;
  }
  
  // 添加时间戳参数防止缓存
  if (hasParams) {
    url += `&t=${timestamp}`;
  } else {
    url += `?t=${timestamp}`;
    hasParams = true;
  }
  
  // 添加强制刷新参数
  if (forceRefresh) {
    url += '&force=true';
  }
  
  console.log(`请求URL: ${url}`);
  
  fetch(url, {
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
      // 确保result是数组或可以转换为数组
      let tools = [];
      
      if (Array.isArray(result)) {
        tools = result;
      } else if (result && typeof result === 'object' && Array.isArray(result.tools)) {
        tools = result.tools;
      }
      
      // 如果没有使用search接口，且分类不是"全部"，则在前端过滤
      if (category && category !== '全部' && url.indexOf('/search') === -1) {
        tools = tools.filter(tool => (tool.category || '') === category);
      }
      
      console.log(`加载了 ${category || '全部'} 分类的 ${tools.length} 个网页工具:`, tools);
      
      // 更新搜索状态
      if (tools.length > 0) {
        let statusMessage = '';
        if (category === '全部') {
          statusMessage = `全部 ${tools.length}个工具`;
        } else {
          statusMessage = `<span class="search-keywords">${category}</span> ${tools.length}个工具`;
        }
        showSearchStatus('success', statusMessage, 'web');
        
        // 更新分类标题显示工具数量
        if (titleElement) {
          if (category === '全部') {
            titleElement.textContent = `全部 (${tools.length})`;
          } else {
            titleElement.textContent = `${category} (${tools.length})`;
          }
        }
      } else {
        let statusMessage = '';
        if (category === '全部') {
          statusMessage = '暂无工具 请添加';
        } else {
          statusMessage = `<span class="search-keywords">${category}</span> 无工具`;
        }
        showSearchStatus('warning', statusMessage, 'web');
        
        // 更新分类标题显示无工具
        if (titleElement) {
          if (category === '全部') {
            titleElement.textContent = `全部 (0)`;
          } else {
            titleElement.textContent = `${category} (0)`;
          }
        }
        
        // 没有工具时显示友好提示
        grid.innerHTML = `
          <div class="empty-state">
            暂无工具
          </div>
        `;
        return;
      }
      
      // 渲染工具列表
      renderWebTools(tools);
    })
    .catch(error => {
      console.error('加载网页工具出错:', error);
      grid.innerHTML = `<div class="error">加载工具列表失败: ${error.message}</div>
                        <div class="empty-state">该分类下可能没有工具，请尝试选择其他分类</div>`;
      
      // 显示错误状态
      showSearchStatus('error', `加载工具列表失败: ${error.message}`, 'web');
      
      // 确保仍然显示正确的分类标题
      if (titleElement) {
        if (category === '全部') {
          titleElement.textContent = `全部 (加载出错)`;
        } else {
          titleElement.textContent = `${category} (加载出错)`;
        }
      }
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
        
        // 更新使用次数和最后使用时间
        fetch(`/api/web-tools/${id}/used`, {
          method: 'POST',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
          .then(response => response.json())
          .then(data => {
            console.log('更新使用次数成功');
            // 只更新此工具的使用次数显示，不重新加载整个列表
            updateToolUsageCount('web-' + id);  // 添加web-前缀，以便函数正确识别为网页工具
            
            // 更新工具卡片上的最后使用时间为当前时间
            const now = new Date();
            const toolCard = document.querySelector(`.tool-card button[data-id="${id}"]`).closest('.tool-card');
            if (toolCard) {
              const timeMetaElement = toolCard.querySelector('.time-meta span:last-child');
              if (timeMetaElement) {
                timeMetaElement.innerHTML = `<i class="fas fa-calendar-check fa-xs"></i> 最后使用: ${now.toLocaleDateString()}`;
              }
            }
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
  const iconPreview = document.getElementById('web-tool-icon-preview');
  const iconStatus = document.getElementById('web-tool-icon-status');
  
  // 重置表单和图标状态
  iconStatus.textContent = '';
  
  // 加载分类和标签建议
  loadWebToolCategorySuggestions();
  loadWebToolTagSuggestions();
  
  // 添加图标刷新按钮事件
  const refreshButton = document.getElementById('web-tool-icon-refresh');
  refreshButton.onclick = function() {
    const toolId = document.getElementById('web-tool-id').value;
    const toolUrl = document.getElementById('web-tool-url').value;
    
    // 如果是新工具，需要检查URL
    if (!toolId) {
      if (!toolUrl) {
        iconStatus.textContent = '请先输入URL';
        return;
      }
      iconStatus.textContent = '添加工具后自动获取图标';
      return;
    }
    
    // 刷新图标
    iconStatus.textContent = '正在获取图标...';
    fetch(`/api/web-tools/${toolId}/refresh-icon`, {
      method: 'POST'
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // 保存图标名称到隐藏字段
          const iconName = data.icon.split('/').pop(); // 提取文件名
          document.getElementById('web-tool-icon').value = iconName;
          
          // 更新图标预览，添加时间戳避免缓存
          iconPreview.innerHTML = `<img src="/icons/websites/${iconName}?t=${new Date().getTime()}" onerror="this.onerror=null; this.src='/icons/websites/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-globe\'></i>'; }">`;
          iconStatus.textContent = '图标更新成功';
        } else {
          iconStatus.textContent = `获取失败: ${data.error || '未知错误'}`;
          iconPreview.innerHTML = '<i class="fas fa-globe"></i>';
        }
      })
      .catch(error => {
        console.error('刷新图标出错:', error);
        iconStatus.textContent = '获取图标失败';
      });
  };
  
  // 添加图标选择按钮事件
  const selectButton = document.getElementById('web-tool-icon-select');
  selectButton.onclick = function() {
    // 显示图标选择器
    showIconSelector(function(selectedIcon) {
      // 更新选中的图标
      document.getElementById('web-tool-icon').value = selectedIcon;
      
      // 更新图标预览，添加时间戳避免缓存
      const timestamp = new Date().getTime();
      iconPreview.innerHTML = `<img src="/icons/websites/${selectedIcon}?t=${timestamp}" onerror="this.onerror=null; this.src='/icons/websites/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-globe\'></i>'; }">`;
      iconStatus.textContent = '已选择图标: ' + selectedIcon;
    });
  };
  
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
        document.getElementById('web-tool-category').value = tool.category || '';
        document.getElementById('web-tool-tags').value = tool.tags.join(',');
        
        // 初始化标签输入
        initializeWebTagsFromText(tool.tags.join(','));
        
        // 初始化分类输入
        initializeWebCategoryFromText(tool.category || '');
        
        // 处理图标路径，适应不同格式
        let iconPath = tool.icon || '';
        // 如果包含路径分隔符，提取文件名
        if (iconPath && iconPath.includes('/')) {
          iconPath = iconPath.split('/').pop();
        }
        document.getElementById('web-tool-icon').value = iconPath;
        
        // 显示图标预览
        if (iconPath) {
          // 添加时间戳参数避免浏览器缓存
          iconPreview.innerHTML = `<img src="/icons/websites/${iconPath}?t=${new Date().getTime()}" onerror="this.onerror=null; this.src='/icons/websites/default-icon.png'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\'fas fa-globe\'></i>'; }">`;
        } else {
          iconPreview.innerHTML = '<i class="fas fa-globe"></i>';
        }
        
        // 预览URL图标
        if (tool.url) {
          previewWebUrlIcon(tool.url);
        }
        
        document.getElementById('web-tool-modal').style.display = 'flex';
      })
      .catch(error => {
        console.error('获取工具信息出错:', error);
        showNotification('获取工具信息失败', 'error');
      });
  } else {
    // 添加模式
    document.getElementById('web-tool-modal-title').textContent = '添加网页工具';
    document.getElementById('web-tool-id').value = '';
    document.getElementById('web-tool-name').value = '';
    document.getElementById('web-tool-url').value = '';
    document.getElementById('web-tool-description').value = '';
    document.getElementById('web-tool-category').value = currentWebCategory !== '全部' ? currentWebCategory : '';
    document.getElementById('web-tool-tags').value = '';
    document.getElementById('web-tool-icon').value = '';
    
    // 初始化标签输入
    initializeWebTagsFromText('');
    
    // 初始化分类输入
    initializeWebCategoryFromText(currentWebCategory !== '全部' ? currentWebCategory : '');
    
    // 重置图标预览
    iconPreview.innerHTML = '<i class="fas fa-globe"></i>';
    
    document.getElementById('web-tool-modal').style.display = 'flex';
  }
}

// 保存网页工具
function saveWebTool() {
  const id = document.getElementById('web-tool-id').value;
  const name = document.getElementById('web-tool-name').value;
  const url = document.getElementById('web-tool-url').value;
  const description = document.getElementById('web-tool-description').value;
  const category = document.getElementById('web-tool-category').value;
  const tags = document.getElementById('web-tool-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
  const icon = document.getElementById('web-tool-icon').value;
  
  if (!name || !url) {
    showNotification('名称和URL是必填项', 'error');
    return;
  }
  
  // 显示正在保存的通知
  showNotification('正在保存...', 'info');
  
  // 保存当前分类，用于后续重新加载
  const currentCat = currentWebCategory;
  
  // 保存原始的URL和当前视图状态
  let originalUrl = '';
  let urlChanged = false;
  
  // 禁用保存按钮，防止重复提交
  const saveBtn = document.getElementById('web-tool-modal-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
  }
  
  // 保存当前搜索状态，用于维持视图
  const searchInput = document.getElementById('web-tools-search');
  const searchText = searchInput ? searchInput.value : '';
  
  // 构建工具对象
  const tool = {
    id,
    name,
    url,
    description,
    category,
    tags,
    icon,
    updated_at: new Date().toISOString() // 添加更新时间
  };
  
  if (id) {
    // 先获取完整工具信息以检查URL是否变化
    fetch(`/api/web-tools/${id}?t=${new Date().getTime()}`, {
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
      .then(existingTool => {
        // 记录原始URL
        originalUrl = existingTool.url || '';
        
        // 检查URL是否发生变化
        urlChanged = (originalUrl !== url) && url.trim() !== '';
        
        console.log(`URL变化检测：原始URL=${originalUrl}, 新URL=${url}, 是否变化=${urlChanged}`);
        
        // 更新现有工具
        return fetch(`/api/web-tools/${id}`, {
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
          throw new Error(`更新工具失败: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(result => {
        if (!result.success) {
          throw new Error(result.message || '保存失败，未知错误');
        }
        
        // 关闭模态框
        document.getElementById('web-tool-modal').style.display = 'none';
        
        // 显示成功通知
        showNotification('工具信息已保存', 'success');
        
        // 如果URL发生了变化，自动刷新图标
        if (urlChanged) {
          console.log('检测到URL变化，自动刷新图标');
          
          // 显示刷新图标通知
          showNotification('URL已更新，正在自动刷新图标...', 'info');
          
          // 调用刷新图标API
          fetch(`/api/web-tools/${id}/refresh-icon`, {
            method: 'POST',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })
          .then(response => {
            if (!response.ok) {
              throw new Error(`图标刷新失败: ${response.status} ${response.statusText}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('自动图标刷新响应:', data);
            
            if (data.success) {
              showNotification('图标已成功更新', 'success');
            } else {
              console.error('自动刷新图标失败:', data.error || '未知错误');
            }
            
            // 无论图标刷新成功与否，都保持当前视图状态
            reloadWebCurrentView();
          })
          .catch(error => {
            console.error('自动刷新图标出错:', error);
            showNotification('图标刷新失败: ' + error.message, 'warning');
            
            // 发生错误时仍然保持当前视图状态
            reloadWebCurrentView();
          });
        } else {
          // 如果URL没有变化，直接更新视图
          reloadWebCurrentView();
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
          saveBtn.innerHTML = '保存';
        }
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
        
        // 根据当前分类重新加载工具列表
        if (currentCat && currentCat !== '全部') {
          loadWebToolsByCategory(currentCat, true);
        } else {
          loadWebTools(true);
        }
        
        // 刷新分类菜单，但保留当前分类状态
        loadWebCategoryMenu(true);
        
        showNotification('工具添加成功', 'success');
      })
      .catch(error => {
        console.error('添加工具出错:', error);
        showNotification('添加工具失败: ' + error.message, 'error');
      })
      .finally(() => {
        // 无论成功失败，都恢复保存按钮状态
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '保存';
        }
      });
  }
  
  // 重载当前网页工具视图的函数
  function reloadWebCurrentView() {
    // 检查是否是搜索状态
    if (searchText) {
      // 检查是否是标签搜索（以"标签:"开头）
      if (searchText.match(/^标签[:：]\s*(.+)$/)) {
        const tag = searchText.match(/^标签[:：]\s*(.+)$/)[1].trim();
        console.log(`恢复标签搜索视图: ${tag}`);
        searchWebToolsByTag(tag);
      }
      // 检查是否是使用tag:或tag=格式的标签搜索
      else if (searchText.match(/^tag[:=]\s*(.+)$/i)) {
        const tag = searchText.match(/^tag[:=]\s*(.+)$/i)[1].trim();
        console.log(`恢复tag:格式的标签搜索视图: ${tag}`);
        searchWebToolsByTag(tag);
      }
      // 普通文本搜索
      else {
        console.log(`恢复普通文本搜索视图: ${searchText}`);
        searchWebTools(searchText, currentCat);
      }
    } else if (currentCat && currentCat !== '全部') {
      // 如果有当前分类且不是全部，保持分类视图
      loadWebToolsByCategory(currentCat, true);
    } else {
      // 否则重新加载全部工具
      loadWebTools(true);
    }
    
    // 刷新分类菜单，但保留当前分类状态
    loadWebCategoryMenu(true);
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
  
  // 更新左侧导航菜单中的笔记数量
  updateWebNotesCount(notes.length);
  
  if (notes.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="6" class="no-data">暂无笔记，点击添加按钮创建新笔记</td>';
    tableBody.appendChild(tr);
    return;
  }
  
  notes.forEach(note => {
    const tr = document.createElement('tr');
    
    // 格式化时间
    const createdAt = new Date(note.created_at);
    const formattedDate = createdAt.toLocaleDateString();
    
    // 使用后端提供的来源（source）字段
    const source = note.source || '未知来源';
    
    // 使用后端提供的工具（tool）字段
    const tool = note.tool || '';
    
    // 标题添加点击功能，实现跳转
    const titleElem = `<span class="note-title" data-url="${note.url}" title="${note.title}">${note.title}</span>`;
    
    tr.innerHTML = `
      <td title="${note.title}">${titleElem}</td>
      <td title="${note.tags.join(', ')}">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</td>
      <td title="${tool}">${tool}</td>
      <td title="${source}">${source}</td>
      <td title="${formattedDate}">${formattedDate}</td>
      <td>
        <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${note.id}" title="编辑">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-danger btn-sm" data-action="delete" data-id="${note.id}" title="删除">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;
    
    tableBody.appendChild(tr);
    
    // 添加标题点击事件 - 跳转到URL
    const titleEl = tr.querySelector('.note-title');
    if (titleEl) {
      titleEl.addEventListener('click', function() {
        const url = this.getAttribute('data-url');
        if (url) {
          openWebNoteURL(note.id);
        }
      });
    }
    
    // 添加按钮事件监听
    const buttons = tr.querySelectorAll('button[data-action]');
    buttons.forEach(button => {
      button.addEventListener('click', function() {
        const action = this.getAttribute('data-action');
        const id = this.getAttribute('data-id');
        
        switch (action) {
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
  // 显示搜索中状态
  showSearchStatus('loading', '搜索中...', 'web-notes');
  
  fetch(`/api/web-notes/search?query=${encodeURIComponent(query)}`)
    .then(response => response.json())
    .then(notes => {
      renderWebNotes(notes);
      
      // 更新标题处的计数
      const titleCountElement = document.getElementById('web-notes-title-count');
      if (titleCountElement) {
        titleCountElement.textContent = notes.length;
      }
      
      // 更新标题文本显示搜索关键词
      const titleElement = document.getElementById('web-notes-category-title');
      if (titleElement) {
        if (query.startsWith('tag:') || query.startsWith('标签:')) {
          const tagPart = query.startsWith('tag:') ? query.substring(4) : query.substring(3);
          titleElement.textContent = `笔记搜索: 标签"${tagPart}"`;
        } else if (query) {
          titleElement.textContent = `笔记搜索: "${query}"`;
        }
      }
      
      // 显示搜索结果状态
      if (notes.length > 0) {
        // 检查是否是标签搜索
        if (query.startsWith('tag:') || query.startsWith('标签:')) {
          const tagPart = query.startsWith('tag:') ? query.substring(4) : query.substring(3);
          showSearchStatus('success', `找到 ${notes.length} 个标签包含 "${tagPart}" 的笔记`, 'web-notes');
        } else {
          showSearchStatus('success', `找到 ${notes.length} 个匹配 "${query}" 的笔记`, 'web-notes');
        }
      } else {
        if (query.startsWith('tag:') || query.startsWith('标签:')) {
          const tagPart = query.startsWith('tag:') ? query.substring(4) : query.substring(3);
          showSearchStatus('warning', `没有找到标签包含 "${tagPart}" 的笔记`, 'web-notes');
        } else {
          showSearchStatus('warning', `没有找到匹配 "${query}" 的笔记`, 'web-notes');
        }
      }
    })
    .catch(error => {
      console.error('搜索笔记出错:', error);
      showSearchStatus('error', `搜索出错: ${error.message}`, 'web-notes');
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
        document.getElementById('web-note-source').value = note.source || '';
        document.getElementById('web-note-tool').value = note.tool || '';
        document.getElementById('web-note-tags').value = note.tags.join(',');
        document.getElementById('web-note-content').value = note.note || '';
        
        // 初始化标签组件
        initializeWebNoteTagsFromText(note.tags.join(','));
        
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
    document.getElementById('web-note-source').value = '';
    document.getElementById('web-note-tool').value = '';
    document.getElementById('web-note-tags').value = '';
    document.getElementById('web-note-content').value = '';
    
    // 清空标签组件
    initializeWebNoteTagsFromText('');
    
    document.getElementById('web-note-modal').style.display = 'flex';
  }
}

// 保存网页笔记
function saveWebNote() {
  const id = document.getElementById('web-note-id').value;
  const title = document.getElementById('web-note-title').value;
  const url = document.getElementById('web-note-url').value;
  const source = document.getElementById('web-note-source').value;
  const tool = document.getElementById('web-note-tool').value;
  // 直接使用标签组件中的当前标签列表
  const tags = window.webNoteCurrentTags || [];
  const note = document.getElementById('web-note-content').value;
  
  if (!title || !url) {
    alert('标题和URL是必填项');
    return;
  }
  
  const noteData = {
    id,
    title,
    url,
    source,
    tool,
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
        // 移除保存提示
        showNotification('笔记已更新', 'success');
      })
      .catch(error => {
        console.error('更新笔记出错:', error);
        showNotification('保存失败: ' + error.message, 'error');
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
        // 使用通知代替alert
        showNotification('笔记添加成功', 'success');
      })
      .catch(error => {
        console.error('添加笔记出错:', error);
        showNotification('保存失败: ' + error.message, 'error');
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
  
  // 图标刷新按钮
  const refreshIconsBtn = document.getElementById('offline-tools-refresh-icons-btn');
  refreshIconsBtn.addEventListener('click', function() {
    refreshOfflineIcons();
  });
  
  // 添加分类标题到离线工具页面
  const offlineToolsPage = document.getElementById('offline-tools-page');
  const searchContainer = offlineToolsPage.querySelector('.search-container');
  
  if (!offlineToolsPage.querySelector('.category-title-container')) {
    // 创建分类标题容器
    const categoryTitleContainer = document.createElement('div');
    categoryTitleContainer.className = 'category-title-container';
    
    // 创建分类标题
    const categoryTitle = document.createElement('h2');
    categoryTitle.className = 'category-title';
    categoryTitle.textContent = '全部';
    
    // 添加元素到容器 - 只添加标题
    categoryTitleContainer.appendChild(categoryTitle);
    
    // 添加容器到页面
    offlineToolsPage.insertBefore(categoryTitleContainer, searchContainer.nextSibling);
  }
  
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
  
  // 监听模态框显示事件
  const toolEditModal = document.getElementById('offline-tool-edit-modal');
  if (toolEditModal) {
    // 使用MutationObserver监视模态框的显示状态变化
    const modalObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'style') {
          const displayStyle = toolEditModal.style.display;
          if (displayStyle === 'flex') {
            // 模态框显示时初始化标签输入组件
            console.log('检测到模态框显示，初始化标签组件');
            initTagsInput();
          }
        }
      });
    });
    
    // 开始观察模态框的style属性变化
    modalObserver.observe(toolEditModal, { attributes: true, attributeFilter: ['style'] });
  }
  
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
  // 搜索功能
  const searchBtn = document.getElementById('web-tools-search-btn');
  const searchInput = document.getElementById('web-tools-search');
  
  searchBtn.addEventListener('click', function() {
    processWebSearch(searchInput.value);
  });
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      processWebSearch(this.value);
    }
  });
  
  // 处理网页工具的搜索输入内容
  function processWebSearch(searchText) {
    if (!searchText) {
      // 空搜索，加载当前分类的所有工具
      loadWebToolsByCategory(currentWebCategory || '全部');
      return;
    }
    
    // 检查是否是标签搜索（以"标签:"开头）
    if (searchText.match(/^标签[:：]\s*(.+)$/)) {
      const tag = searchText.match(/^标签[:：]\s*(.+)$/)[1].trim();
      console.log(`识别到网页工具标签模糊搜索: ${tag}`);
      showNotification(`正在搜索包含「${tag}」的标签`, 'info');
      searchWebToolsByTag(tag);
    }
    // 检查是否是使用tag:或tag=格式的标签搜索
    else if (searchText.match(/^tag[:=]\s*(.+)$/i)) {
      const tag = searchText.match(/^tag[:=]\s*(.+)$/i)[1].trim();
      console.log(`识别到tag:格式的网页工具标签模糊搜索: ${tag}`);
      showNotification(`正在搜索包含「${tag}」的标签`, 'info');
      searchWebToolsByTag(tag);
    }
    // 普通文本搜索
    else {
      console.log(`执行网页工具普通文本搜索: ${searchText}`);
      searchWebTools(searchText, null); // 将currentWebCategory改为null，不受当前分类影响
    }
  }
  
  // 添加清除按钮
  const clearBtn = document.getElementById('web-tools-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      // 清空搜索框
      searchInput.value = '';
      
      // 隐藏搜索状态提示
      hideSearchStatus('web');
      
      // 加载当前分类的工具
      loadWebToolsByCategory(currentWebCategory || '全部');
    });
  }
  
  // 笔记面板关闭按钮
  const notePanelCloseBtn = document.getElementById('web-tool-note-close-btn');
  notePanelCloseBtn.addEventListener('click', function() {
    document.getElementById('web-tool-note-panel').classList.add('closed');
  });
  
  // 添加按钮
  const addBtn = document.getElementById('web-tools-add-btn');
  addBtn.addEventListener('click', function() {
    showWebToolModal();
  });
  
  // 刷新图标按钮
  const refreshIconsBtn = document.getElementById('web-tools-refresh-icons-btn');
  refreshIconsBtn.addEventListener('click', function() {
    // 显示确认对话框
    if (confirm('确定要刷新所有网页工具的图标吗？这可能需要一些时间。')) {
      refreshWebIcons();
    }
  });
  
  // 为模态框按钮添加事件
  const modal = document.getElementById('web-tool-modal');
  const closeBtn = document.getElementById('web-tool-modal-close-btn');
  const cancelBtn = document.getElementById('web-tool-modal-cancel-btn');
  const saveBtn = document.getElementById('web-tool-modal-save-btn');
  
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
  });
  
  cancelBtn.addEventListener('click', function() {
    modal.style.display = 'none';
  });
  
  saveBtn.addEventListener('click', function() {
    saveWebTool();
  });
  
  // 点击模态框外部关闭
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // 添加URL输入监听，实现图标预览
  initWebUrlInputListener();
}

// 初始化网页笔记页面
function initWebNotesPage() {
  // 加载网页笔记列表
  loadWebNotes();
  
  // 加载网页笔记标签建议
  loadWebNoteTagSuggestions();
  
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
  
  // 搜索状态清除按钮
  const searchStatusClearBtn = document.getElementById('web-notes-search-status-clear');
  if (searchStatusClearBtn) {
    searchStatusClearBtn.addEventListener('click', function() {
      // 隐藏搜索状态
      hideSearchStatus('web-notes');
      // 清空搜索框
      document.getElementById('web-notes-search').value = '';
      // 重新加载所有笔记
      loadWebNotes();
      // 重置标题文本
      const titleElement = document.getElementById('web-notes-category-title');
      if (titleElement) {
        titleElement.textContent = '网页笔记';
      }
    });
  }
  
  // 清除搜索按钮
  const clearBtn = document.getElementById('web-notes-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      // 清空搜索框
      searchInput.value = '';
      
      // 隐藏搜索状态提示
      hideSearchStatus('web-notes');
      
      // 重新加载所有笔记
      loadWebNotes();
      
      // 更新标题
      const titleElement = document.getElementById('web-notes-category-title');
      if (titleElement) {
        titleElement.textContent = '网页笔记';
      }
    });
  }
  
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
    
    // 保存当前分类，使用全局变量
    const savedCategory = currentWebCategory || '全部';
    
    fetch(`/api/web-tools/${id}`, {
      method: 'DELETE'
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        // 在后台静默加载分类菜单，但不切换视图
        loadWebCategoryMenu(true);
        
        // 根据当前分类直接重新加载工具
        if (savedCategory && savedCategory !== '全部') {
          loadWebToolsByCategory(savedCategory, true);
        } else {
          loadWebTools();
        }
        
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
    
    // 保存当前分类，使用全局变量而非localStorage
    // 这样可以保证我们使用的是当前实际选中的分类，包括"全部"
    const savedCategory = currentCategory;
    // 标准化分类名称，确保前后端一致
    const normalizedCategory = (savedCategory === '全部' || !savedCategory) ? 'all' : savedCategory;
    console.log('删除工具时保存的当前分类:', savedCategory, '(标准化后:', normalizedCategory, ')');
    
    // 从显示中移除此工具
    const toolCard = document.querySelector(`.tool-card button[data-id="${id}"]`).closest('.tool-card');
    if (toolCard) {
      toolCard.style.display = 'none';
    }
    
    // 调用删除API，附上当前分类信息
    fetch(`/api/offline-tools/${id}?category=${encodeURIComponent(normalizedCategory)}`, {
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
        
        // 从后端获取返回的分类，如果没有则使用保存的分类
        // 标准化后端返回的分类
        let categoryFromServer = result.category;
        if (categoryFromServer === 'all') {
          categoryFromServer = '全部';
        }
        
        const categoryToLoad = categoryFromServer || savedCategory || '全部';
        console.log('删除后将加载分类:', categoryToLoad, '(后端返回:', result.category, ')');
        
        // 如果是特定分类，重新加载该分类的工具
        if (categoryToLoad && categoryToLoad !== '全部') {
          console.log('重新加载分类工具:', categoryToLoad);
          // 确保分类名一致性
          currentCategory = categoryToLoad;
          
          // 直接加载此分类工具而不刷新其他内容
          loadOfflineToolsByCategory(categoryToLoad, true);
          
          // 激活对应的分类菜单项
          setTimeout(() => {
            const categoryItem = document.querySelector(`.nav-dropdown-item[data-category="${categoryToLoad}"]`);
              if (categoryItem) {
                activateCategoryItem(categoryItem);
              } else {
              console.warn('未找到匹配的分类项:', categoryToLoad);
                }
          }, 100);
            } else {
          // 在全部工具视图，重新加载全部工具
          console.log('重新加载全部工具');
          currentCategory = '全部';
          loadOfflineToolsByCategory('全部', true);
          
          // 激活全部分类菜单项
          setTimeout(() => {
              const allCategoryItem = document.querySelector('.nav-dropdown-item[data-category="all"]');
              if (allCategoryItem) {
                activateCategoryItem(allCategoryItem);
              }
          }, 100);
            }
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

// 渲染网页工具分类菜单
function renderWebCategoryMenu(categories, forceRefresh = false) {
  const menuElement = document.getElementById('web-categories-menu');
  
  // 如果菜单已有内容，且不强制刷新，则不重新渲染
  if (menuElement.children.length > 0 && !forceRefresh) {
    return;
  }
  
  console.log('渲染网页工具分类菜单:', categories);
  
  // 清空菜单
  menuElement.innerHTML = '';
  
  // 去重：确保分类名称唯一
  const uniqueCategories = [];
  const seenCategories = new Set();
  
  categories.forEach(category => {
    if (!seenCategories.has(category.name)) {
      seenCategories.add(category.name);
      uniqueCategories.push(category);
    }
  });
  
  // 添加菜单项
  uniqueCategories.forEach(category => {
    const item = document.createElement('a');
    item.href = '#';
    item.className = 'nav-dropdown-item';
    item.setAttribute('data-category', category.name);
    
    // 显示分类名称和工具数量
    item.innerHTML = `
      <span>${category.name}</span>
      <span class="category-badge">${category.count}</span>
    `;
    
    // 如果是当前选中的分类，添加active类
    if (currentWebCategory === category.name) {
      item.classList.add('active');
    }
    
    // 添加点击事件
    item.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 移除所有菜单项的活动状态
      document.querySelectorAll('#web-categories-menu .nav-dropdown-item').forEach(i => {
        i.classList.remove('active');
      });
      
      // 添加当前项的活动状态
      this.classList.add('active');
      
      // 显示网页工具页面
      document.querySelectorAll('.main-content > div').forEach(page => {
        page.style.display = 'none';
      });
      document.getElementById('web-tools-page').style.display = 'block';
      
      // 获取分类名称并加载相应的工具
      const categoryName = this.getAttribute('data-category');
      console.log('点击网页工具分类菜单项:', categoryName);
      
      // 更新当前分类
      currentWebCategory = categoryName;
      
      // 加载分类工具
      loadWebToolsByCategory(categoryName);
    });
    
    menuElement.appendChild(item);
  });
}

// 更新工具使用次数（局部更新）
function updateToolUsageCount(id) {
  // 针对不同类型的工具，调用不同的API获取最新信息
  if (id.toString().startsWith('web-')) {
    // 网页工具
    const toolId = id.replace('web-', '');
    fetch(`/api/web-tools/${toolId}?t=${new Date().getTime()}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => response.json())
      .then(tool => {
        // 更新显示的使用次数
        updateUsageCountDisplay(id, tool.usage_count || 0);
      })
      .catch(error => {
        console.error('获取网页工具使用次数失败:', error);
      });
  } else {
    // 离线工具
    fetch(`/api/offline-tools/${id}?t=${new Date().getTime()}`, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then(response => response.json())
      .then(tool => {
        // 更新显示的使用次数
        updateUsageCountDisplay(id, tool.usage_count || 0);
      })
      .catch(error => {
        console.error('获取离线工具使用次数失败:', error);
      });
  }
}

// 更新使用次数显示
function updateUsageCountDisplay(id, count) {
  // 查找对应工具卡片中的使用次数元素
  const usageCountElements = document.querySelectorAll(`.usage-count[data-tool-id="${id}"]`);
  
  if (usageCountElements.length > 0) {
    // 更新所有匹配的元素
    usageCountElements.forEach(element => {
      element.innerHTML = `<i class="fas fa-chart-line"></i> ${count}`;
      
      // 添加闪烁效果
      element.classList.add('count-updated');
      setTimeout(() => {
        element.classList.remove('count-updated');
      }, 1500);
    });
    
    console.log(`工具 ${id} 使用次数已更新为 ${count}`);
  } else {
    console.warn(`未找到工具 ${id} 的使用次数显示元素`);
  }
}

// 刷新所有缺失的图标
function refreshAllIcons() {
  showNotification('正在刷新图标...', 'info');
  
  fetch('/api/web-tools/refresh-all-icons', {
    method: 'POST'
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        const results = data.results;
        const successCount = Object.values(results).filter(result => result === 'success').length;
        
        if (successCount > 0) {
          // 重新加载工具列表以显示新图标
          loadWebTools();
          showNotification(`成功刷新 ${successCount} 个图标`, 'success');
        } else {
          showNotification('没有需要刷新的图标', 'info');
        }
      } else {
        showNotification('刷新图标失败', 'error');
      }
    })
    .catch(error => {
      console.error('刷新图标出错:', error);
      showNotification('刷新图标出错', 'error');
    });
}

// 刷新离线工具图标
function refreshOfflineIcons() {
  showNotification('正在刷新离线工具图标...', 'info');
  
  console.log('开始刷新离线工具图标');
  
  fetch('/api/offline-tools/refresh-all-icons', {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        const results = data.results;
        const successCount = Object.values(results).filter(result => result === 'success').length;
        
        console.log(`图标刷新结果:`, results);
        console.log(`成功刷新图标数量: ${successCount}`);
        
        if (successCount > 0) {
          // 重新加载工具列表以显示新图标
          loadOfflineTools(true);
          showNotification(`成功刷新 ${successCount} 个离线工具图标`, 'success');
        } else {
          showNotification('没有需要刷新的离线工具图标', 'info');
        }
      } else {
        console.error('刷新图标失败:', data.error || '未知错误');
        showNotification('刷新离线工具图标失败: ' + (data.error || '未知错误'), 'error');
      }
    })
    .catch(error => {
      console.error('刷新离线工具图标出错:', error);
      showNotification('刷新离线工具图标出错: ' + error.message, 'error');
    });
}

// 显示图标选择器
function showIconSelector(callback, type = 'websites') {
  const modal = document.getElementById('icon-selector-modal');
  const closeBtn = document.getElementById('icon-selector-modal-close-btn');
  const cancelBtn = document.getElementById('icon-selector-modal-cancel-btn');
  const searchInput = document.getElementById('icon-search');
  const loadingElement = document.querySelector('.icon-selector-loading');
  const gridElement = document.querySelector('.icon-selector-grid');
  
  // 更新模态框标题
  const modalTitle = modal.querySelector('.modal-title');
  if (modalTitle) {
    modalTitle.textContent = type === 'offline' ? '选择离线工具图标' : '选择网页工具图标';
  }
  
  // 清空搜索框和图标网格
  searchInput.value = '';
  gridElement.innerHTML = '';
  
  // 显示加载中
  loadingElement.style.display = 'block';
  
  // 确定API端点 - 确保使用正确的API端点
  const apiEndpoint = type === 'offline' ? '/api/offline-tools/icons' : '/api/web-tools/icons';
  
  console.log(`加载${type}类型图标，使用API端点: ${apiEndpoint}`);
  
  // 获取图标列表
  fetch(apiEndpoint, {
    headers: {
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`获取图标列表失败: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // 隐藏加载中
      loadingElement.style.display = 'none';
      
      if (!data.success) {
        gridElement.innerHTML = `<div class="error">${data.error || '获取图标列表失败'}</div>`;
        return;
      }
      
      const icons = data.icons || [];
      
      if (icons.length === 0) {
        gridElement.innerHTML = '<div class="empty">没有可用的图标</div>';
        return;
      }
      
      console.log(`成功加载 ${icons.length} 个${type}图标`);
      
      // 渲染图标网格
      renderIconGrid(icons, gridElement, callback, type);
      
      // 添加搜索功能
      searchInput.addEventListener('input', function() {
        const searchText = this.value.toLowerCase();
        const filteredIcons = icons.filter(icon => 
          icon.name.toLowerCase().includes(searchText)
        );
        renderIconGrid(filteredIcons, gridElement, callback, type);
      });
    })
    .catch(error => {
      console.error(`获取${type}图标列表出错:`, error);
      loadingElement.style.display = 'none';
      gridElement.innerHTML = `<div class="error">${error.message}</div>`;
    });
  
  // 显示模态框
  modal.style.display = 'flex';
  
  // 关闭按钮事件
  closeBtn.onclick = function() {
    modal.style.display = 'none';
  };
  
  // 取消按钮事件
  cancelBtn.onclick = function() {
    modal.style.display = 'none';
  };
  
  // 点击模态框背景关闭
  modal.onclick = function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  };
}

// 渲染图标网格
function renderIconGrid(icons, gridElement, callback, type = 'websites') {
  gridElement.innerHTML = '';
  
  // 添加CSS样式
  const style = document.createElement('style');
  if (!document.querySelector('#icon-grid-style')) {
    style.id = 'icon-grid-style';
    style.textContent = `
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 12px;
        padding: 5px;
      }
      .icon-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        border: 1px solid #ddd;
        border-radius: 5px;
        cursor: pointer;
        transition: all 0.2s;
        background-color: white;
      }
      .icon-item:hover {
        background-color: #f0f0f0;
        transform: scale(1.05);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      .icon-item.selected {
        background-color: #e6f7ff;
        border-color: #1890ff;
        box-shadow: 0 0 0 2px rgba(24,144,255,0.2);
      }
      .icon-item-preview {
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 8px;
      }
      .icon-item-preview img {
        max-width: 100%;
        max-height: 100%;
      }
      .icon-item-name {
        font-size: 12px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        width: 100%;
        color: #555;
      }
    `;
    document.head.appendChild(style);
  }
  
  // 创建图标网格容器
  const iconGrid = document.createElement('div');
  iconGrid.className = 'icon-grid';
  
  // 添加图标项
  icons.forEach(icon => {
    const iconItem = document.createElement('div');
    iconItem.className = 'icon-item';
    iconItem.dataset.name = icon.name;
    
    // 图标预览
    const iconPreview = document.createElement('div');
    iconPreview.className = 'icon-item-preview';
    
    // 使用类型确定默认图标和路径
    const defaultIcon = type === 'offline' ? '/icons/offline/default-icon.png' : '/icons/websites/default-icon.png';
    const iconPath = type === 'offline' ? 
      `/icons/offline/${icon.name}?t=${new Date().getTime()}` : 
      `/icons/websites/${icon.name}?t=${new Date().getTime()}`;
      
    iconPreview.innerHTML = `<img src="${iconPath}" onerror="this.onerror=null; this.src='${defaultIcon}'; if(!this.src) { this.style.display='none'; this.parentNode.innerHTML='<i class=\\'fas fa-${type === 'offline' ? 'desktop' : 'globe'}\\'></i>'; }">`;
    
    // 图标名称
    const iconName = document.createElement('div');
    iconName.className = 'icon-item-name';
    iconName.title = icon.name;
    iconName.textContent = icon.name.length > 15 ? icon.name.substring(0, 12) + '...' : icon.name;
    
    // 组装图标项
    iconItem.appendChild(iconPreview);
    iconItem.appendChild(iconName);
    
    // 点击选择图标
    iconItem.addEventListener('click', function() {
      // 移除其他图标的选中状态
      document.querySelectorAll('.icon-item.selected').forEach(item => {
        item.classList.remove('selected');
      });
      
      // 添加当前图标的选中状态
      this.classList.add('selected');
      
      // 调用回调函数，传递选中的图标名称
      callback(icon.name);
      
      // 关闭模态框
      document.getElementById('icon-selector-modal').style.display = 'none';
    });
    
    // 添加到网格
    iconGrid.appendChild(iconItem);
  });
  
  // 添加到容器
  gridElement.appendChild(iconGrid);
}

// 搜索状态显示函数
function showSearchStatus(type, message, container = 'offline') {
  // 如果是离线工具，直接返回，不显示搜索状态
  if (container === 'offline') {
    return;
  }
  
  const statusElement = document.getElementById(`${container}-search-status`);
  if (!statusElement) return;
  
  // 清除所有状态类
  statusElement.classList.remove('loading', 'success', 'warning', 'error');
  
  // 添加当前状态类
  statusElement.classList.add(type);
  
  // 更新图标
  const iconElement = statusElement.querySelector('i:first-child');
  if (iconElement) {
    iconElement.className = ''; // 清除旧的图标类
    
    // 添加新的图标类
    switch (type) {
      case 'loading':
        iconElement.className = 'fas fa-spinner fa-spin';
        break;
      case 'success':
        iconElement.className = 'fas fa-check-circle';
        break;
      case 'warning':
        iconElement.className = 'fas fa-exclamation-triangle';
        break;
      case 'error':
        iconElement.className = 'fas fa-times-circle';
        break;
      default:
        iconElement.className = 'fas fa-info-circle';
    }
  }
  
  // 更新内容
  const contentElement = statusElement.querySelector('.search-status-content');
  if (contentElement) {
    contentElement.innerHTML = message;
  }
  
  // 显示状态元素
  statusElement.style.display = 'flex';
  
  // 如果不是loading状态，5秒后自动隐藏
  if (type !== 'loading') {
    setTimeout(() => {
      // 再次检查状态，如果已经变成loading，则不隐藏
      if (!statusElement.classList.contains('loading')) {
        // statusElement.style.display = 'none';
      }
    }, 5000);
  }
}

// 格式化搜索关键字，给关键字添加高亮样式
function formatSearchKeywords(query) {
  if (!query) return '';
  
  // 检查是否是tag搜索
  if (query.match(/^tag[:=]\s*(.+)$/i) || query.match(/^标签[:：]\s*(.+)$/)) {
    const tagMatch = query.match(/^tag[:=]\s*(.+)$/i) || query.match(/^标签[:：]\s*(.+)$/);
    const tag = tagMatch[1].trim();
    return `标签 <span class="search-keywords">${tag}</span>`;
  }
  
  return `<span class="search-keywords">${query}</span>`;
}

// 隐藏搜索状态
function hideSearchStatus(container = 'offline') {
  // 如果是离线工具，直接返回，不执行隐藏操作
  if (container === 'offline') {
    return;
  }
  
  const statusElement = document.getElementById(`${container}-search-status`);
  if (statusElement) {
    statusElement.style.display = 'none';
  }
}

// 标签输入组件全局变量
let allTags = []; // 所有可用的标签
let commonTags = []; // 常用标签
let recentTags = []; // 最近使用的标签
let currentTags = []; // 当前已选择的标签

// 初始化标签输入组件
function initTagsInput() {
  // 获取标签列表
  fetch('/api/offline-tools/tags')
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // 处理标签数据
        console.log('获取到标签列表:', data); // 添加调试信息
        allTags = data.tags || [];
        
        // 获取前10个最常用的标签作为常用标签
        commonTags = allTags.slice(0, 10);
        
        // 最近使用的标签
        recentTags = data.recent || [];
        
        // 渲染常用标签和最近使用标签
        renderCommonTags();
        renderRecentTags();
      }
    })
    .catch(error => {
      console.error('获取标签列表出错:', error);
    });
    
  // 添加标签输入框的事件监听
  const tagsInputField = document.getElementById('tags-input-field');
  const tagsInputContainer = document.getElementById('tags-input-container');
  const tagsSuggestions = document.getElementById('tags-suggestions');
  
  if (tagsInputField) {
    // 根据标签输入框的位置和尺寸，更新提示框的位置和尺寸
    function updateSuggestionsPosition() {
      // ... existing code ...
      if (tagsSuggestions.style.display === 'block') {
        // 直接使用CSS定位，只需确保宽度与容器匹配
        tagsSuggestions.style.width = tagsInputContainer.offsetWidth + 'px';
      }
    }
    
    // 监听窗口大小变化，更新提示框位置
    window.addEventListener('resize', updateSuggestionsPosition);
    
    // 输入标签时的事件
    tagsInputField.addEventListener('input', function() {
      const inputValue = this.value.trim();
      
      if (inputValue.length > 0) {
        // 过滤匹配的标签
        const filteredTags = allTags.filter(tag => 
          tag.name.toLowerCase().includes(inputValue.toLowerCase())
        ).slice(0, 8); // 最多显示8个建议
        
        console.log('过滤后的标签:', filteredTags); // 添加调试信息
        
        if (filteredTags.length > 0) {
          // 显示标签建议
          tagsSuggestions.innerHTML = '';
          
          filteredTags.forEach(tag => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
              <span>${tag.name}</span>
              <span class="frequency">${tag.frequency}</span>
            `;
            
            suggestionItem.addEventListener('click', function() {
              addTag(tag.name);
              tagsInputField.value = '';
              tagsSuggestions.style.display = 'none';
            });
            
            tagsSuggestions.appendChild(suggestionItem);
          });
          
          // 显示提示框
          tagsSuggestions.style.display = 'block';
          
          // 确保父元素是相对定位，更新提示框位置
          updateSuggestionsPosition();
        } else {
          tagsSuggestions.style.display = 'none';
        }
      } else {
        tagsSuggestions.style.display = 'none';
      }
    });
    
    // 回车添加标签
    tagsInputField.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        const inputValue = this.value.trim();
        if (inputValue) {
          addTag(inputValue);
          this.value = '';
          tagsSuggestions.style.display = 'none';
        }
      }
    });
    
    // 点击外部关闭标签建议
    document.addEventListener('click', function(e) {
      if (!tagsInputContainer.contains(e.target) && e.target !== tagsSuggestions && !tagsSuggestions.contains(e.target)) {
        tagsSuggestions.style.display = 'none';
      }
    });
  }
}

// 渲染常用标签
function renderCommonTags() {
  const commonTagsList = document.getElementById('common-tags-list');
  if (!commonTagsList) return;
  
  commonTagsList.innerHTML = '';
  
  commonTags.forEach(tag => {
    const tagItem = document.createElement('div');
    tagItem.className = 'common-tag';
    tagItem.textContent = tag.name;
    
    // 如果标签已被选中，添加active类
    if (currentTags.includes(tag.name)) {
      tagItem.classList.add('active');
    }
    
    // 点击添加或移除标签
    tagItem.addEventListener('click', function() {
      if (currentTags.includes(tag.name)) {
        removeTag(tag.name);
        this.classList.remove('active');
      } else {
        addTag(tag.name);
        this.classList.add('active');
      }
    });
    
    commonTagsList.appendChild(tagItem);
  });
}

// 渲染最近使用的标签
function renderRecentTags() {
  const recentTagsList = document.getElementById('recent-tags-list');
  if (!recentTagsList) return;
  
  recentTagsList.innerHTML = '';
  
  recentTags.forEach(tag => {
    // 避免与常用标签重复
    if (commonTags.some(t => t.name === tag)) return;
    
    const tagItem = document.createElement('div');
    tagItem.className = 'common-tag';
    tagItem.textContent = tag;
    
    // 如果标签已被选中，添加active类
    if (currentTags.includes(tag)) {
      tagItem.classList.add('active');
    }
    
    // 点击添加或移除标签
    tagItem.addEventListener('click', function() {
      if (currentTags.includes(tag)) {
        removeTag(tag);
        this.classList.remove('active');
      } else {
        addTag(tag);
        this.classList.add('active');
      }
    });
    
    recentTagsList.appendChild(tagItem);
  });
}

// 添加标签
function addTag(tagName) {
  // 如果标签已存在，不重复添加
  if (currentTags.includes(tagName)) return;
  
  // 添加到当前标签列表
  currentTags.push(tagName);
  
  // 创建标签元素
  const tagsInputContainer = document.getElementById('tags-input-container');
  const tagsInputField = document.getElementById('tags-input-field');
  
  const tagItem = document.createElement('div');
  tagItem.className = 'tag-item';
  tagItem.innerHTML = `
    <span>${tagName}</span>
    <span class="tag-delete" data-tag="${tagName}"><i class="fas fa-times"></i></span>
  `;
  
  // 添加删除事件
  const deleteBtn = tagItem.querySelector('.tag-delete');
  deleteBtn.addEventListener('click', function() {
    const tag = this.getAttribute('data-tag');
    removeTag(tag);
  });
  
  // 插入到输入框前面
  tagsInputContainer.insertBefore(tagItem, tagsInputField);
  
  // 更新隐藏字段的值
  updateHiddenTagsField();
  
  // 更新常用标签和最近使用标签的状态
  updateTagsActiveState();
}

// 删除标签
function removeTag(tagName) {
  // 从当前标签列表中移除
  const index = currentTags.indexOf(tagName);
  if (index !== -1) {
    currentTags.splice(index, 1);
  }
  
  // 移除标签元素
  const tagElements = document.querySelectorAll('.tag-item');
  tagElements.forEach(element => {
    const tagContent = element.querySelector('span:first-child').textContent;
    if (tagContent === tagName) {
      element.remove();
    }
  });
  
  // 更新隐藏字段的值
  updateHiddenTagsField();
  
  // 更新常用标签和最近使用标签的状态
  updateTagsActiveState();
}

// 更新隐藏字段的值
function updateHiddenTagsField() {
  const hiddenField = document.getElementById('offline-tool-edit-tags');
  if (hiddenField) {
    hiddenField.value = currentTags.join(',');
  }
}

// 更新常用标签和最近使用标签的活动状态
function updateTagsActiveState() {
  // 更新常用标签
  const commonTagElements = document.querySelectorAll('#common-tags-list .common-tag');
  commonTagElements.forEach(element => {
    const tagName = element.textContent;
    if (currentTags.includes(tagName)) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  });
  
  // 更新最近使用标签
  const recentTagElements = document.querySelectorAll('#recent-tags-list .common-tag');
  recentTagElements.forEach(element => {
    const tagName = element.textContent;
    if (currentTags.includes(tagName)) {
      element.classList.add('active');
    } else {
      element.classList.remove('active');
    }
  });
}

// 根据文本初始化标签列表
function initializeTagsFromText(tagsText) {
  // 清空当前标签
  currentTags = [];
  
  // 清空标签容器
  const tagsInputContainer = document.getElementById('tags-input-container');
  const tagsInputField = document.getElementById('tags-input-field');
  
  // 保留输入框，移除所有标签项
  const tagItems = tagsInputContainer.querySelectorAll('.tag-item');
  tagItems.forEach(item => item.remove());
  
  // 如果标签字符串不为空，则解析并添加
  if (tagsText && tagsText.trim() !== '') {
    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    console.log('初始化标签:', tags); // 添加调试信息
    tags.forEach(tag => addTag(tag));
  }
  
  // 更新隐藏字段的值
  updateHiddenTagsField();
}

// 初始化URL输入监听
function initUrlInputListener() {
  const urlInput = document.getElementById('offline-tool-edit-url');
  if (!urlInput) return;
  
  // 使用防抖函数避免频繁请求
  let debounceTimer;
  
  urlInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    
    // 延迟500ms再执行，避免用户快速输入时多次请求
    debounceTimer = setTimeout(() => {
      const url = this.value.trim();
      if (url) {
        previewUrlIcon(url);
      } else {
        // 清空预览
        document.getElementById('url-icon-preview').innerHTML = '';
      }
    }, 500);
  });
}

// 预览URL网站图标
function previewUrlIcon(url) {
  const previewContainer = document.getElementById('url-icon-preview');
  if (!previewContainer) return;
  
  // 清空之前的图标
  previewContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  
  try {
    // 从URL中提取域名
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // 构造favicon URL
    const faviconUrl = `${urlObj.protocol}//${domain}/favicon.ico`;
    
    // 预加载图标
    previewContainer.innerHTML = `
      <img src="${faviconUrl}" 
           onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<i class=\\'fas fa-globe\\'></i>';" 
           alt="${domain}网站图标">
    `;
  } catch (error) {
    console.error('预览URL图标出错:', error);
    previewContainer.innerHTML = '<i class="fas fa-globe"></i>';
  }
}

// 刷新网页工具图标
function refreshWebIcons() {
  // 显示正在刷新通知
  showNotification('正在刷新网页工具图标，请稍候...', 'info');
  
  fetch('/api/web-tools/refresh-icons', {
    method: 'POST',
    headers: {
      'Cache-Control': 'no-cache'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`刷新图标失败: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('图标刷新结果:', data);
      
      if (data.success) {
        showNotification(`成功刷新 ${data.refreshed || 0} 个工具图标`, 'success');
        
        // 维持当前视图状态但更新图标显示
        if (currentWebCategory && currentWebCategory !== '全部') {
          loadWebToolsByCategory(currentWebCategory, true);
        } else {
          loadWebTools(true);
        }
      } else {
        showNotification('刷新图标完成，但部分图标更新失败', 'warning');
      }
    })
    .catch(error => {
      console.error('刷新图标出错:', error);
      showNotification('刷新图标出错: ' + error.message, 'error');
    });
}

// 初始化搜索框清除按钮
function initClearButtons() {
  // 离线工具搜索框清除按钮
  const offlineClearBtn = document.getElementById('offline-tools-clear-btn');
  const offlineSearchInput = document.getElementById('offline-tools-search');
  if (offlineClearBtn && offlineSearchInput) {
    offlineClearBtn.addEventListener('click', function() {
      offlineSearchInput.value = ''; // 清空输入框
      offlineSearchInput.focus(); // 将焦点放回输入框
      
      // 隐藏搜索状态提示
      hideSearchStatus('offline');
      
      // 如果当前在特定分类视图下，则返回该分类
      if (currentCategory && currentCategory !== '全部') {
        loadOfflineToolsByCategory(currentCategory, true);
      } else {
        // 否则加载全部工具
        loadOfflineTools(true);
      }
      
      // 重置分类标题
      const titleElement = document.querySelector('#offline-tools-page .category-title');
      if (titleElement) {
        if (currentCategory && currentCategory !== '全部') {
          titleElement.textContent = currentCategory;
        } else {
          titleElement.textContent = '全部工具';
        }
      }
    });
  }
  
  // 网页工具搜索框清除按钮
  const webClearBtn = document.getElementById('web-tools-clear-btn');
  const webSearchInput = document.getElementById('web-tools-search');
  if (webClearBtn && webSearchInput) {
    webClearBtn.addEventListener('click', function() {
      webSearchInput.value = ''; // 清空输入框
      webSearchInput.focus(); // 将焦点放回输入框
      
      // 隐藏搜索状态提示
      hideSearchStatus('web');
      
      // 如果当前在特定分类视图下，则返回该分类
      if (currentWebCategory && currentWebCategory !== '全部') {
        loadWebToolsByCategory(currentWebCategory, true);
      } else {
        // 否则加载全部工具
        loadWebTools();
      }
      
      // 重置分类标题
      const titleElement = document.querySelector('#web-tools-page .category-title');
      if (titleElement) {
        if (currentWebCategory && currentWebCategory !== '全部') {
          titleElement.textContent = currentWebCategory;
        } else {
          titleElement.textContent = '全部工具';
        }
      }
    });
  }
  
  // 网页笔记搜索框清除按钮
  const notesClearBtn = document.getElementById('web-notes-clear-btn');
  const notesSearchInput = document.getElementById('web-notes-search');
  if (notesClearBtn && notesSearchInput) {
    notesClearBtn.addEventListener('click', function() {
      notesSearchInput.value = ''; // 清空输入框
      notesSearchInput.focus(); // 将焦点放回输入框
    });
  }
}

// 初始化网页工具URL输入监听
function initWebUrlInputListener() {
  const urlInput = document.getElementById('web-tool-url');
  if (!urlInput) return;
  
  // 使用防抖函数避免频繁请求
  let debounceTimer;
  
  urlInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);
    
    // 延迟500ms再执行，避免用户快速输入时多次请求
    debounceTimer = setTimeout(() => {
      const url = this.value.trim();
      if (url) {
        previewWebUrlIcon(url);
      } else {
        // 清空预览
        document.getElementById('web-url-icon-preview').innerHTML = '';
      }
    }, 500);
  });
}

// 预览网页工具URL网站图标
function previewWebUrlIcon(url) {
  const previewContainer = document.getElementById('web-url-icon-preview');
  if (!previewContainer) return;
  
  // 清空之前的图标
  previewContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  
  try {
    // 从URL中提取域名
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    
    // 构造favicon URL
    const faviconUrl = `${urlObj.protocol}//${domain}/favicon.ico`;
    
    // 预加载图标
    previewContainer.innerHTML = `
      <img src="${faviconUrl}" 
           onerror="this.onerror=null; this.style.display='none'; this.parentNode.innerHTML='<i class=\\'fas fa-globe\\'></i>';" 
           alt="${domain}网站图标">
    `;
  } catch (error) {
    console.error('预览URL图标出错:', error);
    previewContainer.innerHTML = '<i class="fas fa-globe"></i>';
  }
}

// 加载网页工具分类建议
function loadWebToolCategorySuggestions() {
  // 获取输入框元素
  const categoryInput = document.getElementById('web-tool-category');
  if (!categoryInput) return;
  
  // 创建或获取建议容器
  let suggestionsContainer = document.getElementById('web-category-suggestions-container');
  if (!suggestionsContainer) {
    suggestionsContainer = document.createElement('div');
    suggestionsContainer.id = 'web-category-suggestions-container';
    suggestionsContainer.className = 'tags-suggestions';
    suggestionsContainer.style.display = 'none';
    
    // 插入到分类输入框后面
    categoryInput.parentNode.appendChild(suggestionsContainer);
  }
  
  // 获取现有分类
  fetch('/api/web-tools/categories?include_usage=true')
    .then(response => response.json())
    .then(result => {
      console.log('Web工具分类API返回数据:', result);
    
      // 确保结果格式正确
      const categories = result && result.success && result.categories ? 
        Object.keys(result.categories || {}).filter(cat => cat !== '全部') : [];
      
      // 分类按工具数量排序
      const sortedCategories = categories.map(name => ({
        name: name,
        count: result && result.success && result.categories ? (result.categories[name] || 0) : 0
      })).sort((a, b) => b.count - a.count);
      
      // 常用分类（如果API返回了）
      const commonCategories = result && result.success && result.common ? result.common : [];
      
      // 最近使用的分类（如果API返回了）
      const recentCategories = result && result.success && result.recent ? result.recent : [];
      
      console.log('处理后的分类数据:', {
        sortedCategories,
        commonCategories,
        recentCategories
      });
      
      // 渲染常用分类（以当前API返回的格式）
      renderWebCommonCategories(commonCategories.length > 0 ? commonCategories : sortedCategories.slice(0, 8));
      
      // 渲染最近使用分类
      renderWebRecentCategories(recentCategories);
        
        // 添加输入事件监听，实现分类建议
        categoryInput.addEventListener('input', function() {
          const inputValue = this.value.trim().toLowerCase();
          
          if (inputValue.length > 0) {
            // 过滤匹配的分类
            const filteredCategories = categories.filter(cat => 
              cat.toLowerCase().includes(inputValue)
            ).slice(0, 8); // 最多显示8个建议
            
            if (filteredCategories.length > 0) {
              // 显示分类建议
              suggestionsContainer.innerHTML = '';
              
              filteredCategories.forEach(category => {
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.textContent = category;
                
                suggestionItem.addEventListener('click', function() {
                  categoryInput.value = category;
                  suggestionsContainer.style.display = 'none';
                });
                
                suggestionsContainer.appendChild(suggestionItem);
              });
              
              // 显示提示框并更新位置
              suggestionsContainer.style.display = 'block';
              suggestionsContainer.style.width = categoryInput.offsetWidth + 'px';
            } else {
              suggestionsContainer.style.display = 'none';
            }
          } else {
            suggestionsContainer.style.display = 'none';
          }
        });
        
        // 回车选择第一个建议
        categoryInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' && suggestionsContainer.style.display === 'block') {
            e.preventDefault();
            const firstItem = suggestionsContainer.querySelector('.suggestion-item');
            if (firstItem) {
              firstItem.click();
            }
          }
        });
        
        // 点击外部关闭建议
        document.addEventListener('click', function(e) {
          if (e.target !== suggestionsContainer && e.target !== categoryInput && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
          }
        });
        
        console.log('加载了 ' + categories.length + ' 个网页工具分类建议');
    })
    .catch(error => {
      console.error('获取分类建议出错:', error);
      // 出错时也渲染空的列表，避免界面异常
      renderWebCommonCategories([]);
      renderWebRecentCategories([]);
    });
}

// 渲染网页工具常用分类
function renderWebCommonCategories(categories) {
  const commonCategoriesList = document.getElementById('web-common-categories-list');
  if (!commonCategoriesList) return;
  
  commonCategoriesList.innerHTML = '';
  
  // 处理不同格式的分类数据
  categories.forEach(category => {
    const categoryItem = document.createElement('div');
    categoryItem.className = 'common-tag';
    
    // 支持新旧两种数据格式
    const categoryName = typeof category === 'object' ? (category.name || '') : category;
    const categoryCount = typeof category === 'object' ? (category.usage_count || category.count || 0) : 0;
    
    categoryItem.textContent = categoryName;
    
    if (categoryCount > 0) {
      categoryItem.title = `包含 ${categoryCount} 个工具`;
    }
    
    // 点击直接设置分类
    categoryItem.addEventListener('click', function() {
      setWebCategory(categoryName);
    });
    
    commonCategoriesList.appendChild(categoryItem);
  });
}

// 渲染网页工具最近使用的分类
function renderWebRecentCategories(categories) {
  const recentCategoriesList = document.getElementById('web-recent-categories-list');
  if (!recentCategoriesList) return;
  
  recentCategoriesList.innerHTML = '';
  
  // 过滤掉已经在常用分类中显示的分类
  const commonCategoriesSet = new Set();
  const commonElements = document.querySelectorAll('#web-common-categories-list .common-tag');
  commonElements.forEach(el => {
    commonCategoriesSet.add(el.textContent);
  });
  
  categories.forEach(category => {
    // 支持新旧两种数据格式
    const categoryName = typeof category === 'object' ? (category.name || '') : category;
    
    // 跳过已显示在常用分类中的分类
    if (commonCategoriesSet.has(categoryName)) return;
    
    const categoryItem = document.createElement('div');
    categoryItem.className = 'common-tag';
    categoryItem.textContent = categoryName;
    
    // 如果有使用次数，添加标题提示
    if (typeof category === 'object' && (category.usage_count || category.count)) {
      const count = category.usage_count || category.count;
      categoryItem.title = `使用 ${count} 次`;
    }
    
    // 点击直接设置分类
    categoryItem.addEventListener('click', function() {
      setWebCategory(categoryName);
    });
    
    recentCategoriesList.appendChild(categoryItem);
    });
}

// 加载网页工具标签建议
function loadWebToolTagSuggestions() {
  // 获取输入框元素
  if (!document.getElementById('web-tags-input-field')) return;
  
  // 声明全局变量，如果尚未定义
  if (typeof webToolAllTags === 'undefined') {
    window.webToolAllTags = [];
  }
  
  // 获取所有标签
  fetch('/api/web-tools/tags/suggest?include_usage=true')
    .then(response => response.json())
    .then(data => {
      console.log('Web工具标签API返回数据:', data);
      
      // 确保数据格式正确
      // 支持两种格式：1. 标签数组 2. {success: true, tags: [...], common: [...], recent: [...]}
      let allTags = [];
      let commonTags = [];
      let recentTags = [];
      
      if (Array.isArray(data)) {
        // 标签数组格式
        allTags = data.map(tag => typeof tag === 'string' ? {name: tag, frequency: 1} : tag);
        commonTags = [...allTags].sort((a, b) => b.frequency - a.frequency).slice(0, 8);
      } else if (data && data.success === true) {
        // 新格式，带有常用和最近使用标签
        allTags = Array.isArray(data.tags) ? data.tags : [];
        commonTags = Array.isArray(data.common) ? data.common : [];
        recentTags = Array.isArray(data.recent) ? data.recent : [];
      }
      
        // 保存标签数据以供使用
      window.webToolAllTags = allTags;
      
      console.log('处理后的标签数据:', {
        allTags: allTags.length,
        commonTags: commonTags.length,
        recentTags: recentTags.length
      });
        
      // 如果没有返回常用标签，则从所有标签中提取
      if (commonTags.length === 0 && allTags.length > 0) {
        commonTags = [...allTags].sort((a, b) => {
          const freqA = typeof a === 'object' ? (a.frequency || 0) : 0;
          const freqB = typeof b === 'object' ? (b.frequency || 0) : 0;
          return freqB - freqA;
        }).slice(0, 8);
      }
      
      // 渲染常用和最近使用的标签
      renderWebCommonTags(commonTags);
      renderWebRecentTags(recentTags);
    })
    .catch(error => {
      console.error('获取标签列表出错:', error);
      // 出错时也渲染空的列表，避免界面异常
      renderWebCommonTags([]);
      renderWebRecentTags([]);
    });
}

// 渲染网页工具常用标签
function renderWebCommonTags(tags) {
  const commonTagsList = document.getElementById('web-common-tags-list');
  if (!commonTagsList) return;
  
  commonTagsList.innerHTML = '';
  
  tags.forEach(tag => {
    const tagItem = document.createElement('div');
    tagItem.className = 'common-tag';
    
    // 支持字符串或对象格式的标签数据
    const tagName = typeof tag === 'object' ? (tag.name || '') : tag;
    const tagCount = typeof tag === 'object' ? (tag.frequency || tag.usage_count || 0) : 0;
    
    tagItem.textContent = tagName;
    if (tagCount > 0) {
      tagItem.title = `使用 ${tagCount} 次`;
    }
    
    // 如果标签已被选中，添加active类
    if (webCurrentTags && webCurrentTags.includes(tagName)) {
      tagItem.classList.add('active');
    }
    
    // 点击添加或移除标签
    tagItem.addEventListener('click', function() {
      if (webCurrentTags && webCurrentTags.includes(tagName)) {
        removeWebTag(tagName);
        this.classList.remove('active');
      } else {
        addWebTag(tagName);
        this.classList.add('active');
      }
    });
    
    commonTagsList.appendChild(tagItem);
  });
}

// 渲染网页工具最近使用标签
function renderWebRecentTags(tags) {
  const recentTagsList = document.getElementById('web-recent-tags-list');
  if (!recentTagsList) return;
  
  recentTagsList.innerHTML = '';
  
  // 过滤掉已经在常用标签中显示的标签
  const commonTagsSet = new Set();
  const commonElements = document.querySelectorAll('#web-common-tags-list .common-tag');
  commonElements.forEach(el => {
    commonTagsSet.add(el.textContent);
  });
  
  tags.forEach(tag => {
    // 支持字符串或对象格式的标签数据
    const tagName = typeof tag === 'object' ? (tag.name || '') : tag;
          
    // 跳过常用标签中已有的标签
    if (commonTagsSet.has(tagName)) return;
    
    const tagItem = document.createElement('div');
    tagItem.className = 'common-tag';
    tagItem.textContent = tagName;
    
    // 如果有使用次数，添加标题提示
    if (typeof tag === 'object' && (tag.usage_count || tag.frequency)) {
      const count = tag.usage_count || tag.frequency;
      tagItem.title = `使用 ${count} 次`;
    }
    
    // 如果标签已被选中，添加active类
    if (webCurrentTags && webCurrentTags.includes(tagName)) {
      tagItem.classList.add('active');
    }
    
    // 点击添加或移除标签
    tagItem.addEventListener('click', function() {
      if (webCurrentTags && webCurrentTags.includes(tagName)) {
        removeWebTag(tagName);
        this.classList.remove('active');
      } else {
        addWebTag(tagName);
        this.classList.add('active');
      }
    });
    
    recentTagsList.appendChild(tagItem);
  });
}

// 初始化网页工具标签输入组件
function initWebTagsInput() {
  // 全局变量，网页工具标签相关
  window.webCurrentTags = []; // 当前已选择的标签
  
  // 获取标签输入框元素
  const tagsInputField = document.getElementById('web-tags-input-field');
  const tagsInputContainer = document.getElementById('web-tags-input-container');
  const tagsSuggestions = document.getElementById('web-tags-suggestions');
  
  if (tagsInputField) {
    // 根据标签输入框的位置和尺寸，更新提示框的位置和尺寸
    function updateSuggestionsPosition() {
      if (tagsSuggestions.style.display === 'block') {
        // 直接使用CSS定位，只需确保宽度与容器匹配
        tagsSuggestions.style.width = tagsInputContainer.offsetWidth + 'px';
      }
    }
    
    // 监听窗口大小变化，更新提示框位置
    window.addEventListener('resize', updateSuggestionsPosition);
            
    // 输入标签时的事件
    tagsInputField.addEventListener('input', function() {
      const inputValue = this.value.trim();
      
      if (inputValue.length > 0) {
              // 过滤匹配的标签
        const filteredTags = window.webToolAllTags.filter(tag => {
          const tagName = typeof tag === 'object' ? (tag.name || '') : tag;
          return tagName.toLowerCase().includes(inputValue.toLowerCase());
        }).slice(0, 8); // 最多显示8个建议
        
        console.log('过滤后的标签:', filteredTags); // 添加调试信息
              
              if (filteredTags.length > 0) {
                // 显示标签建议
          tagsSuggestions.innerHTML = '';
                
                filteredTags.forEach(tag => {
            const tagName = typeof tag === 'object' ? (tag.name || '') : tag;
            const frequency = typeof tag === 'object' ? (tag.frequency || tag.usage_count || 0) : 0;
            
                  const suggestionItem = document.createElement('div');
                  suggestionItem.className = 'suggestion-item';
                  suggestionItem.innerHTML = `
              <span>${tagName}</span>
              <span class="frequency">${frequency}</span>
                  `;
                  
                  suggestionItem.addEventListener('click', function() {
              addWebTag(tagName);
              tagsInputField.value = '';
              tagsSuggestions.style.display = 'none';
            });
            
            tagsSuggestions.appendChild(suggestionItem);
          });
                    
          // 显示提示框
          tagsSuggestions.style.display = 'block';
          
          // 确保父元素是相对定位，更新提示框位置
          updateSuggestionsPosition();
        } else {
          tagsSuggestions.style.display = 'none';
        }
      } else {
        tagsSuggestions.style.display = 'none';
      }
    });
    
    // 回车添加标签
    tagsInputField.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        const inputValue = this.value.trim();
        if (inputValue) {
          addWebTag(inputValue);
          this.value = '';
          tagsSuggestions.style.display = 'none';
        }
      }
    });
                    
    // 点击外部关闭标签建议
    document.addEventListener('click', function(e) {
      if (!tagsInputContainer.contains(e.target) && e.target !== tagsSuggestions && !tagsSuggestions.contains(e.target)) {
        tagsSuggestions.style.display = 'none';
      }
    });
  }
}

// 添加网页工具标签
function addWebTag(tagName) {
  // 如果标签为空或已存在，不添加
  if (!tagName || webCurrentTags.includes(tagName)) return;
  
  // 添加到当前标签列表
  webCurrentTags.push(tagName);
  
  // 创建标签元素
  const tagElement = document.createElement('div');
  tagElement.className = 'tag';
  tagElement.innerHTML = `
    ${tagName}
    <span class="tag-remove" data-tag="${tagName}">&times;</span>
  `;
  
  // 添加移除标签的事件监听
  const removeBtn = tagElement.querySelector('.tag-remove');
  removeBtn.addEventListener('click', function(e) {
    e.stopPropagation(); // 阻止事件冒泡
    const tag = this.getAttribute('data-tag');
    removeWebTag(tag);
                });
                
  // 将标签添加到容器中
  document.getElementById('web-tags-input-container').insertBefore(tagElement, document.getElementById('web-tags-input-field'));
  
  // 更新隐藏的标签字段
  updateWebHiddenTagsField();
  
  // 更新标签选中状态
  updateWebTagsActiveState();
  
  // 清空输入框并设置焦点
  const inputField = document.getElementById('web-tags-input-field');
  if (inputField) {
    inputField.value = '';
    inputField.focus();
  }
}

// 移除网页工具标签
function removeWebTag(tagName) {
  console.log('尝试移除标签:', tagName, '当前标签列表:', webCurrentTags);

  // 从当前标签列表中移除
  webCurrentTags = webCurrentTags.filter(tag => tag !== tagName);
  
  // 移除标签元素
  const container = document.getElementById('web-tags-input-container');
  if (container) {
    const tagElements = container.querySelectorAll('.tag');
    tagElements.forEach(element => {
      // 提取标签文本，先去掉×符号再比较
      const tagText = element.textContent.replace(/\s*×\s*$/, '').trim();
      if (tagText === tagName) {
        console.log('找到匹配的标签元素，移除:', tagText);
        element.parentNode.removeChild(element);
      }
    });
  }
  
  console.log('移除标签后的标签列表:', webCurrentTags);
  
  // 更新隐藏的标签字段
  updateWebHiddenTagsField();
  
  // 更新标签选中状态
  updateWebTagsActiveState();
  
  // 显示输入字段并设置焦点，方便用户继续输入
  const inputField = document.getElementById('web-tags-input-field');
  if (inputField) {
    inputField.style.display = 'inline-block';
    inputField.focus();
  }
}

// 更新网页工具隐藏的标签字段
function updateWebHiddenTagsField() {
  const hiddenField = document.getElementById('web-tool-tags');
  if (hiddenField) {
    hiddenField.value = webCurrentTags.join(',');
  }
}

// 更新网页工具标签选中状态
function updateWebTagsActiveState() {
  // 更新常用标签的激活状态
  const commonTagsList = document.getElementById('web-common-tags-list');
  if (commonTagsList) {
    const tagItems = commonTagsList.querySelectorAll('.common-tag');
    tagItems.forEach(item => {
      if (webCurrentTags.includes(item.textContent.trim())) {
        item.classList.add('active');
              } else {
        item.classList.remove('active');
      }
    });
  }
  
  // 更新最近标签的激活状态
  const recentTagsList = document.getElementById('web-recent-tags-list');
  if (recentTagsList) {
    const tagItems = recentTagsList.querySelectorAll('.common-tag');
    tagItems.forEach(item => {
      if (webCurrentTags.includes(item.textContent.trim())) {
        item.classList.add('active');
            } else {
        item.classList.remove('active');
      }
    });
  }
}

// 从文本中初始化网页工具标签
function initializeWebTagsFromText(tagsText) {
  // 清除当前所有标签
  webCurrentTags = [];
  const container = document.getElementById('web-tags-input-container');
  if (container) {
    const existingTags = container.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());
  }
  
  // 解析标签文本
  if (tagsText) {
    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);
    tags.forEach(tag => addWebTag(tag));
  }
}

// 初始化网页工具分类输入组件
function initWebCategoryInput() {
  // 全局变量，网页工具分类相关
  window.webCurrentCategory = ""; // 当前选择的分类
  
  // 获取分类输入框元素
  const categoryInputField = document.getElementById('web-category-input-field');
  const categoryInputContainer = document.getElementById('web-category-input-container');
  const categorySuggestions = document.getElementById('web-category-suggestions-container');
  
  if (categoryInputField) {
    // 更新提示框的宽度
    function updateCategorySuggestionsWidth() {
      if (categorySuggestions.style.display === 'block') {
        categorySuggestions.style.width = categoryInputContainer.offsetWidth + 'px';
      }
    }
    
    // 监听窗口大小变化，更新提示框宽度
    window.addEventListener('resize', updateCategorySuggestionsWidth);
    
    // 输入分类时的事件
    categoryInputField.addEventListener('input', function() {
      const inputValue = this.value.trim();
      
      if (inputValue.length > 0) {
        // 过滤匹配的分类
        fetch('/api/web-tools/categories')
          .then(response => response.json())
          .then(data => {
            const categories = data.categories || {};
            const categoryNames = Object.keys(categories).filter(c => c !== '全部');
            
            const filteredCategories = categoryNames.filter(cat => 
              cat.toLowerCase().includes(inputValue.toLowerCase())
            ).slice(0, 8); // 最多显示8个建议
            
            if (filteredCategories.length > 0) {
              // 显示分类建议
              categorySuggestions.innerHTML = '';
              
              filteredCategories.forEach(category => {
                const count = categories[category] || 0;
                const suggestionItem = document.createElement('div');
                suggestionItem.className = 'suggestion-item';
                suggestionItem.innerHTML = `
                  <span>${category}</span>
                  <span class="frequency">${count}</span>
                `;
                
                suggestionItem.addEventListener('click', function() {
                  setWebCategory(category);
                  categoryInputField.value = '';
                  categorySuggestions.style.display = 'none';
                });
                
                categorySuggestions.appendChild(suggestionItem);
              });
              
              // 显示提示框
              categorySuggestions.style.display = 'block';
              updateCategorySuggestionsWidth();
            } else {
              categorySuggestions.style.display = 'none';
            }
          })
          .catch(error => {
            console.error('获取分类建议出错:', error);
            categorySuggestions.style.display = 'none';
          });
      } else {
        categorySuggestions.style.display = 'none';
      }
    });
    
    // 回车添加分类
    categoryInputField.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        
        const inputValue = this.value.trim();
        if (inputValue) {
          setWebCategory(inputValue);
          this.value = '';
          categorySuggestions.style.display = 'none';
        }
      }
    });
    
    // 点击外部关闭分类建议
    document.addEventListener('click', function(e) {
      if (!categoryInputContainer.contains(e.target) && e.target !== categorySuggestions && !categorySuggestions.contains(e.target)) {
        categorySuggestions.style.display = 'none';
      }
    });
  }
}

// 设置网页工具分类
function setWebCategory(categoryName) {
  // 如果分类为空，则不设置
  if (!categoryName) return;
  
  // 更新当前分类
  window.webCurrentCategory = categoryName;
  
  // 创建分类元素
  updateWebCategoryElement();
  
  // 更新隐藏的分类字段
  updateWebHiddenCategoryField();
  
  // 清空输入框
  const inputField = document.getElementById('web-category-input-field');
  if (inputField) {
    inputField.value = '';
    inputField.focus();
  }
}

// 更新网页工具分类元素
function updateWebCategoryElement() {
  // 先清除已有的分类标签
  const container = document.getElementById('web-category-input-container');
  const existingCategoryElements = container.querySelectorAll('.tag');
  existingCategoryElements.forEach(el => el.remove());
  
  // 如果有分类，则创建标签
  if (window.webCurrentCategory) {
    const categoryElement = document.createElement('div');
    categoryElement.className = 'tag';
    categoryElement.innerHTML = `
      ${window.webCurrentCategory}
      <span class="tag-remove" data-category="${window.webCurrentCategory}">&times;</span>
    `;
    
    // 添加移除分类的事件监听
    const removeBtn = categoryElement.querySelector('.tag-remove');
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation(); // 阻止事件冒泡
      window.webCurrentCategory = "";
      updateWebCategoryElement();
      updateWebHiddenCategoryField();
      
      // 显式地清除输入字段，确保用户可以继续输入
      const inputField = document.getElementById('web-category-input-field');
      if (inputField) {
        inputField.value = '';
        inputField.style.display = 'inline-block';
        inputField.focus();
      }
    });
    
    // 将分类添加到容器中
    container.insertBefore(categoryElement, document.getElementById('web-category-input-field'));
  }
}

// 更新网页工具隐藏的分类字段
function updateWebHiddenCategoryField() {
  const hiddenField = document.getElementById('web-tool-category');
  if (hiddenField) {
    hiddenField.value = window.webCurrentCategory;
  }
}

// 从字符串初始化网页工具分类
function initializeWebCategoryFromText(categoryText) {
  // 清除当前分类
  window.webCurrentCategory = "";
  const container = document.getElementById('web-category-input-container');
  if (container) {
    const existingElements = container.querySelectorAll('.tag');
    existingElements.forEach(el => el.remove());
  }
  
  // 如果有分类文本，则设置
  if (categoryText) {
    setWebCategory(categoryText);
  }
}

// 初始化网页笔记标签输入组件
function initWebNoteTagsInput() {
  // 全局变量，网页笔记标签相关
  window.webNoteCurrentTags = []; // 当前已选择的标签
  
  // 获取标签输入框元素
  const tagsInputField = document.getElementById('web-note-tags-input-field');
  const tagsInputContainer = document.getElementById('web-note-tags-input-container');
  const tagsSuggestions = document.getElementById('web-note-tags-suggestions');
  
  if (tagsInputField) {
    // 根据标签输入框的位置和尺寸，更新提示框的位置和尺寸
    function updateSuggestionsPosition() {
      if (tagsSuggestions.style.display === 'block') {
        // 直接使用CSS定位，只需确保宽度与容器匹配
        tagsSuggestions.style.width = tagsInputContainer.offsetWidth + 'px';
      }
    }
    
    // 监听窗口大小变化，更新提示框位置
    window.addEventListener('resize', updateSuggestionsPosition);
    
    // 输入标签时的事件
    tagsInputField.addEventListener('input', function() {
      const inputValue = this.value.trim();
      
      if (inputValue.length > 0) {
        // 过滤匹配的标签
        // 使用所有标签数据，因为网页笔记标签可以与工具标签共享
        const allTags = window.webToolAllTags || [];
        const filteredTags = allTags.filter(tag => {
          const tagName = typeof tag === 'object' ? (tag.name || '') : tag;
          return tagName.toLowerCase().includes(inputValue.toLowerCase());
        }).slice(0, 8); // 最多显示8个建议
        
        if (filteredTags.length > 0) {
          // 显示标签建议
          tagsSuggestions.innerHTML = '';
          
          filteredTags.forEach(tag => {
            const tagName = typeof tag === 'object' ? (tag.name || '') : tag;
            const frequency = typeof tag === 'object' ? (tag.frequency || tag.usage_count || 0) : 0;
            
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.innerHTML = `
              <span>${tagName}</span>
              <span class="frequency">${frequency}</span>
            `;
            
            suggestionItem.addEventListener('click', function() {
              addWebNoteTag(tagName);
              tagsInputField.value = '';
              tagsSuggestions.style.display = 'none';
            });
            
            tagsSuggestions.appendChild(suggestionItem);
          });
          
          // 显示提示框
          tagsSuggestions.style.display = 'block';
          
          // 更新提示框位置
          updateSuggestionsPosition();
        } else {
          tagsSuggestions.style.display = 'none';
        }
      } else {
        tagsSuggestions.style.display = 'none';
            }
          });
          
          // 回车添加标签
    tagsInputField.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
              e.preventDefault();
        
        const inputValue = this.value.trim();
        if (inputValue) {
          addWebNoteTag(inputValue);
          this.value = '';
          tagsSuggestions.style.display = 'none';
              }
            }
          });
          
          // 点击外部关闭标签建议
          document.addEventListener('click', function(e) {
      if (!tagsInputContainer.contains(e.target) && e.target !== tagsSuggestions && !tagsSuggestions.contains(e.target)) {
        tagsSuggestions.style.display = 'none';
            }
          });
        }
      }

// 添加网页笔记标签
function addWebNoteTag(tagName) {
  // 如果标签已存在，不重复添加
  if (webNoteCurrentTags.includes(tagName)) return;
  
  // 添加到当前标签列表
  webNoteCurrentTags.push(tagName);
  
  // 创建标签元素
  const tagElement = document.createElement('div');
  tagElement.className = 'tag';
  tagElement.innerHTML = `
    ${tagName}
    <span class="tag-remove" data-tag="${tagName}">&times;</span>
  `;
  
  // 添加移除标签的事件监听
  const removeBtn = tagElement.querySelector('.tag-remove');
  removeBtn.addEventListener('click', function() {
    const tag = this.getAttribute('data-tag');
    removeWebNoteTag(tag);
  });
  
  // 将标签添加到容器中
  document.getElementById('web-note-tags-input-container').insertBefore(tagElement, document.getElementById('web-note-tags-input-field'));
  
  // 更新隐藏的标签字段
  updateWebNoteHiddenTagsField();
  
  // 更新标签选中状态
  updateWebNoteTagsActiveState();
}

// 移除网页笔记标签
function removeWebNoteTag(tagName) {
  // 从当前标签列表中移除
  webNoteCurrentTags = webNoteCurrentTags.filter(tag => tag !== tagName);
  
  // 移除标签元素
  const tagElements = document.getElementById('web-note-tags-input-container').querySelectorAll('.tag');
  tagElements.forEach(element => {
    // 获取标签元素的data-tag属性
    const removeBtn = element.querySelector('.tag-remove');
    if (removeBtn && removeBtn.getAttribute('data-tag') === tagName) {
      element.remove();
    }
  });
  
  // 更新隐藏的标签字段
  updateWebNoteHiddenTagsField();
  
  // 更新标签选中状态
  updateWebNoteTagsActiveState();
}

// 更新网页笔记隐藏的标签字段
function updateWebNoteHiddenTagsField() {
  const hiddenField = document.getElementById('web-note-tags');
  if (hiddenField) {
    hiddenField.value = webNoteCurrentTags.join(',');
  }
}

// 更新网页笔记标签选中状态
function updateWebNoteTagsActiveState() {
  // 更新常用标签的激活状态
  const commonTagsList = document.getElementById('web-note-common-tags-list');
  if (commonTagsList) {
    const tagItems = commonTagsList.querySelectorAll('.common-tag');
    tagItems.forEach(item => {
      if (webNoteCurrentTags.includes(item.textContent.trim())) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
  
  // 更新最近标签的激活状态
  const recentTagsList = document.getElementById('web-note-recent-tags-list');
  if (recentTagsList) {
    const tagItems = recentTagsList.querySelectorAll('.common-tag');
    tagItems.forEach(item => {
      if (webNoteCurrentTags.includes(item.textContent.trim())) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
}

// 从字符串初始化网页笔记标签
function initializeWebNoteTagsFromText(tagsText) {
  // 清除当前所有标签
  webNoteCurrentTags = [];
  const container = document.getElementById('web-note-tags-input-container');
  if (container) {
    const existingTags = container.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());
  }
  
  // 解析标签文本
  if (tagsText) {
    const tags = tagsText.split(',').map(tag => tag.trim()).filter(tag => tag);
    tags.forEach(tag => addWebNoteTag(tag));
  }
}

// 加载网页笔记标签建议
function loadWebNoteTagSuggestions() {
  // 尝试使用已加载的工具标签数据
  if (window.webToolAllTags && window.webToolAllTags.length > 0) {
    renderWebNoteCommonTags(window.webToolAllTags.slice(0, 10));
    return;
  }
  
  // 如果没有已加载的数据，尝试获取标签数据
  fetch('/api/web-tools/tags/suggest?include_usage=true')
    .then(response => response.json())
    .then(data => {
      let allTags = [];
      let commonTags = [];
      
      if (Array.isArray(data)) {
        allTags = data.map(tag => typeof tag === 'string' ? {name: tag, frequency: 1} : tag);
        commonTags = [...allTags].sort((a, b) => b.frequency - a.frequency).slice(0, 8);
      } else if (data && data.success === true) {
        allTags = Array.isArray(data.tags) ? data.tags : [];
        commonTags = Array.isArray(data.common) ? data.common : [];
      }
      
      // 保存标签数据以供使用
      window.webToolAllTags = allTags;
      
      // 渲染常用标签
      renderWebNoteCommonTags(commonTags.length > 0 ? commonTags : allTags.slice(0, 10));
    })
    .catch(error => {
      console.error('获取标签列表出错:', error);
      renderWebNoteCommonTags([]);
    });
}

// 渲染网页笔记常用标签
function renderWebNoteCommonTags(tags) {
  const commonTagsList = document.getElementById('web-note-common-tags-list');
  if (!commonTagsList) return;
  
  commonTagsList.innerHTML = '';
  
  tags.forEach(tag => {
    const tagItem = document.createElement('div');
    tagItem.className = 'common-tag';
    
    // 支持字符串或对象格式的标签数据
    const tagName = typeof tag === 'object' ? (tag.name || '') : tag;
    const tagCount = typeof tag === 'object' ? (tag.frequency || tag.usage_count || 0) : 0;
    
    tagItem.textContent = tagName;
    if (tagCount > 0) {
      tagItem.title = `使用 ${tagCount} 次`;
    }
    
    // 如果标签已被选中，添加active类
    if (webNoteCurrentTags && webNoteCurrentTags.includes(tagName)) {
      tagItem.classList.add('active');
    }
    
    // 点击添加或移除标签
    tagItem.addEventListener('click', function() {
      if (webNoteCurrentTags && webNoteCurrentTags.includes(tagName)) {
        removeWebNoteTag(tagName);
        this.classList.remove('active');
      } else {
        addWebNoteTag(tagName);
        this.classList.add('active');
      }
    });
    
    commonTagsList.appendChild(tagItem);
    });
}

// 初始化网页笔记工具输入和搜索功能
function initWebNoteToolInput() {
  const toolInput = document.getElementById('web-note-tool');
  const suggestionBox = document.getElementById('web-note-tool-suggestions');
  
  if (!toolInput || !suggestionBox) return;
  
  // 离线工具搜索
  toolInput.addEventListener('input', function() {
    const query = this.value.trim();
    
    if (query.length > 1) {
      // 调用搜索接口获取工具建议
      fetch(`/api/offline-tools/search?query=${encodeURIComponent(query)}&simple=true`)
        .then(response => response.json())
        .then(data => {
          const tools = Array.isArray(data) ? data : (data.tools || []);
          showToolSuggestions(tools);
        })
        .catch(err => {
          console.error('搜索工具失败:', err);
          suggestionBox.style.display = 'none';
        });
    } else {
      suggestionBox.style.display = 'none';
    }
  });
  
  // 显示工具建议
  function showToolSuggestions(tools) {
    if (tools.length === 0) {
      suggestionBox.style.display = 'none';
      return;
    }
    
    // 最多显示10个建议
    tools = tools.slice(0, 10);
    
    // 清空并填充建议
    suggestionBox.innerHTML = '';
    
    tools.forEach(tool => {
      const item = document.createElement('div');
      item.className = 'suggestion-item';
      item.textContent = tool.name || tool;
      
      // 点击选择工具
      item.addEventListener('click', function() {
        toolInput.value = this.textContent;
        suggestionBox.style.display = 'none';
      });
      
      suggestionBox.appendChild(item);
    });
    
    suggestionBox.style.display = 'block';
  }
  
  // 处理按键导航
  toolInput.addEventListener('keydown', function(e) {
    if (!suggestionBox.style.display || suggestionBox.style.display === 'none') return;
    
    const items = suggestionBox.querySelectorAll('.suggestion-item');
    const activeItem = suggestionBox.querySelector('.suggestion-item.active');
    let activeIndex = -1;
    
    if (activeItem) {
      Array.from(items).forEach((item, index) => {
        if (item === activeItem) activeIndex = index;
      });
    }
    
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (activeIndex < items.length - 1) {
          if (activeItem) activeItem.classList.remove('active');
          items[activeIndex + 1].classList.add('active');
          items[activeIndex + 1].scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (activeIndex > 0) {
          if (activeItem) activeItem.classList.remove('active');
          items[activeIndex - 1].classList.add('active');
          items[activeIndex - 1].scrollIntoView({ block: 'nearest' });
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (activeItem) {
          toolInput.value = activeItem.textContent;
          suggestionBox.style.display = 'none';
        }
        break;
      case 'Escape':
        e.preventDefault();
        suggestionBox.style.display = 'none';
        break;
    }
  });
  
  // 点击外部区域关闭建议框
  document.addEventListener('click', function(e) {
    if (!toolInput.contains(e.target) && !suggestionBox.contains(e.target)) {
      suggestionBox.style.display = 'none';
    }
  });
}

// 更新网页笔记数量显示
function updateWebNotesCount(count) {
  // 更新侧边栏计数
  const countElement = document.getElementById('web-notes-count');
  if (countElement) {
    // 保存旧值以实现动画效果
    const oldCount = parseInt(countElement.textContent) || 0;
    // 设置新值
    countElement.textContent = count;
    
    // 如果数量有变化，添加动画效果
    if (oldCount !== count) {
      countElement.classList.add('count-updated');
      setTimeout(() => {
        countElement.classList.remove('count-updated');
      }, 1500);
    }
  }
  
  // 更新标题处计数
  const titleCountElement = document.getElementById('web-notes-title-count');
  if (titleCountElement) {
    titleCountElement.textContent = count;
  }
  
  // 更新标题文本
  const titleElement = document.getElementById('web-notes-category-title');
  if (titleElement) {
    titleElement.textContent = '网页笔记';
  }
}