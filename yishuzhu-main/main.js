/* ===========================
   一束烛 · main.js
   =========================== */

// ── 图标 & 背景 配置 ────────────────────────────────────────
const FAVICON_PROVIDER = 'duckduckgo';
const PROXY = '';

function withProxy(originUrl) {
  if (!PROXY) return originUrl;
  return PROXY + '/' + originUrl.replace(/^https?:\/\//, '');
}

function buildFaviconUrl(domain) {
  if (!domain) return DEFAULT_ICON;
  if (FAVICON_PROVIDER === 'google')
    return withProxy(`https://www.google.com/s2/favicons?sz=64&domain=${domain}`);
  if (FAVICON_PROVIDER === 'duckduckgo')
    return withProxy(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  return DEFAULT_ICON;
}

// ── 设置管理 ────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  primaryColor: '#4CAF50',
  blurValue: 3,
  colsValue: 8,
  opacityValue: 0.45,
  pageTitle: '一束烛',
  pageSubtitle: '余香何须道，一善一清风。',
  showSearchTabs: true,
  navRadius: '18px',
  favoritesEnabled: false,
  favoritesList: [], // 每项: { url, title, iconData (dataURL or ''), bgColor, centerText }
  customEngines: [] // 每项: { name, icon, url, domain, category }
};

let currentSettings = { ...DEFAULT_SETTINGS };
let _linksData = null;
let allSections = [];

function loadSettings() {
  const saved = localStorage.getItem('appSettings');
  if (saved) {
    try {
      currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      if (!Array.isArray(currentSettings.customEngines)) currentSettings.customEngines = [];
    } catch {
      currentSettings = { ...DEFAULT_SETTINGS };
    }
  }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('appSettings', JSON.stringify(currentSettings));
  applySettings();
}

function applySettings() {
  const root = document.documentElement;
  root.style.setProperty('--primary', currentSettings.primaryColor);
  root.style.setProperty('--blur-value', currentSettings.blurValue + 'px');
  root.style.setProperty('--opacity-value', currentSettings.opacityValue);
  root.style.setProperty('--cols-value', currentSettings.colsValue);
  root.style.setProperty('--nav-radius', currentSettings.navRadius || '18px');

  document.querySelector('.header-area h1').textContent = currentSettings.pageTitle || DEFAULT_SETTINGS.pageTitle;
  document.querySelector('.header-subtitle').textContent = currentSettings.pageSubtitle || DEFAULT_SETTINGS.pageSubtitle;
  document.querySelector('.search-tabs').style.display = currentSettings.showSearchTabs ? 'flex' : 'none';

  updateResponsiveColumns();
}

function updateResponsiveColumns() {
  const cols = currentSettings.colsValue;
  
  const root = document.documentElement;
  const style = document.createElement('style');
  style.id = 'responsive-cols-style';
  const existing = document.getElementById('responsive-cols-style');
  if (existing) existing.remove();
  
  // 计算不同尺寸的列数
  let cols2 = Math.max(2, Math.round(cols * 0.5)); // 小屏: 50%
  let cols3 = Math.max(3, Math.round(cols * 0.625)); // 中屏: 62.5%
  let cols4 = Math.max(4, Math.round(cols * 0.75)); // 平板: 75%
  let cols6 = Math.max(6, Math.round(cols * 0.875)); // 平板横: 87.5%
  let cols7 = Math.max(7, Math.round(cols * 0.875)); // 中等桌面
  let cols8 = cols; // 大屏: 100%
    
  style.textContent = `
    /* 小屏 (320px-375px) */
    @media (max-width: 374px) {
      :root { --cols-value: 2 !important; }
    }
    /* 手机中等 (375px-480px) */
    @media (min-width: 375px) and (max-width: 479px) {
      :root { --cols-value: 2 !important; }
    }
    /* 手机大屏 (480px-600px) */
    @media (min-width: 480px) and (max-width: 599px) {
      :root { --cols-value: 2 !important; }
    }
    /* 平板竖屏 (600px-800px) */
    @media (min-width: 600px) and (max-width: 799px) {
      :root { --cols-value: 3 !important; }
    }
    /* 平板横屏 (800px-960px) */
    @media (min-width: 800px) and (max-width: 959px) {
      :root { --cols-value: ${cols4} !important; }
    }
    /* 平板横屏大 (960px-1200px) */
    @media (min-width: 960px) and (max-width: 1199px) {
      :root { --cols-value: ${cols6} !important; }
    }
    /* 桌面 (1200px-1600px) */
    @media (min-width: 1200px) and (max-width: 1599px) {
      :root { --cols-value: ${cols7} !important; }
    }
    /* 大屏 (1600px+) */
    @media (min-width: 1600px) {
      :root { --cols-value: ${cols8} !important; }
    }
  `;
  document.head.appendChild(style);
}

function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  panel?.classList.toggle('active');
}
window.toggleSettings = toggleSettings;

function resetSettings() {
  if (confirm('确定要重置所有设置为默认值吗？')) {
    currentSettings = { ...DEFAULT_SETTINGS };
    saveSettings();
    updateSettingsUI();
    alert('设置已重置为默认值');
  }
}
window.resetSettings = resetSettings;

function exportSettings() {
  const dataStr = JSON.stringify(currentSettings, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `settings-${new Date().getTime()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
window.exportSettings = exportSettings;

function importSettings() {
  const file = document.getElementById('importFile').files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      currentSettings = { ...DEFAULT_SETTINGS, ...imported };
      saveSettings();
      updateSettingsUI();
      alert('设置导入成功');
    } catch (err) {
      alert('设置文件格式错误：' + err.message);
    }
  };
  reader.readAsText(file);
  document.getElementById('importFile').value = '';
}
window.importSettings = importSettings;

function updateSettingsUI() {
  // 更新颜色按钮
  document.querySelectorAll('.color-btn').forEach(btn => {
    const color = btn.dataset.color;
    btn.classList.toggle('active', color === currentSettings.primaryColor);
  });
  
  // 更新滑块
  const blurSlider = document.getElementById('blurSlider');
  const colsSlider = document.getElementById('colsSlider');
  const opacitySlider = document.getElementById('opacitySlider');
  
  if (blurSlider) {
    blurSlider.value = currentSettings.blurValue;
    document.getElementById('blurValue').textContent = currentSettings.blurValue + 'px';
  }
  if (colsSlider) {
    colsSlider.value = currentSettings.colsValue;
    document.getElementById('colsValue').textContent = currentSettings.colsValue + ' 列';
  }
  if (opacitySlider) {
    opacitySlider.value = Math.round(currentSettings.opacityValue * 100);
    document.getElementById('opacityValue').textContent = Math.round(currentSettings.opacityValue * 100) + '%';
  }

  const titleInput = document.getElementById('pageTitle');
  const subtitleInput = document.getElementById('pageSubtitle');
  const showTabsCheckbox = document.getElementById('showSearchTabs');
  const navRadiusSelect = document.getElementById('navRadiusSelect');
  if (titleInput) titleInput.value = currentSettings.pageTitle || DEFAULT_SETTINGS.pageTitle;
  if (subtitleInput) subtitleInput.value = currentSettings.pageSubtitle || DEFAULT_SETTINGS.pageSubtitle;
  if (showTabsCheckbox) showTabsCheckbox.checked = !!currentSettings.showSearchTabs;
  if (navRadiusSelect) navRadiusSelect.value = currentSettings.navRadius === '8px' ? 'sharp' : 'soft';

  // 常用导航 UI
  const favEnabled = document.getElementById('favEnabled');
  const favListEl = document.getElementById('favListContainer');
  if (favEnabled) favEnabled.checked = !!currentSettings.favoritesEnabled;
  // 渲染列表预览
  if (favListEl) {
    favListEl.innerHTML = '';
    (currentSettings.favoritesList || []).forEach((f, idx) => {
      const el = document.createElement('div');
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'space-between';
      el.style.padding = '6px';
      el.style.borderRadius = '6px';
      el.style.background = 'rgba(255,255,255,0.02)';
      el.style.color = '#fff';
      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '8px';
      const img = document.createElement('img');
      let domain = '';
      try { domain = (new URL(f.url)).hostname; } catch { domain = ''; }
      // 先使用占位图，再异步加载自定义或远端图标，减少同步失败
      img.src = DEFAULT_ICON;
      if (f.iconData) {
        // 本地上传的 dataURL 优先
        img.src = f.iconData;
      } else if (domain) {
        try {
          const loader = new Image();
          loader.onload = () => { img.src = loader.src; };
          loader.onerror = () => { img.src = DEFAULT_ICON; };
          loader.src = buildFaviconUrl(domain);
        } catch (e) { img.src = DEFAULT_ICON; }
      }
      img.style.width = '22px'; img.style.height = '22px'; img.style.borderRadius = '4px'; img.style.objectFit = 'cover';
      const label = document.createElement('div');
      label.textContent = f.title || (domain || '');
      left.appendChild(img);
      left.appendChild(label);
      const right = document.createElement('div');
      right.style.display = 'flex'; right.style.gap = '8px';
      const del = document.createElement('button'); del.className = 'settings-btn'; del.textContent = '删除';
      del.onclick = () => { currentSettings.favoritesList.splice(idx,1); saveSettings(); updateSettingsUI(); };
      right.appendChild(del);
      el.appendChild(left);
      el.appendChild(right);
      favListEl.appendChild(el);
    });
  }

  const engineListEl = document.getElementById('customEngineList');
  if (engineListEl) {
    engineListEl.innerHTML = '';
    const engines = currentSettings.customEngines || [];
    if (engines.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'custom-engine-empty';
      empty.textContent = '暂无自定义搜索引擎，欢迎在上方添加。';
      engineListEl.appendChild(empty);
    } else {
      engines.forEach((engine, idx) => {
        const card = document.createElement('div');
        card.className = 'custom-engine-card';
        card.innerHTML = `
          <div class="custom-engine-meta">
            <span class="custom-engine-icon">${engine.icon || '🔎'}</span>
            <div>
              <div class="custom-engine-name">${engine.name || '未命名'}</div>
              <div class="custom-engine-url">${engine.url}</div>
            </div>
          </div>
          <button type="button" class="settings-btn reset-btn" data-index="${idx}">删除</button>
        `;
        card.querySelector('button')?.addEventListener('click', () => {
          currentSettings.customEngines.splice(idx, 1);
          saveSettings();
          updateSettingsUI();
          renderSearchTabs();
        });
        engineListEl.appendChild(card);
      });
    }
  }
}

function getCardUrl(item) {
  return item.url;
}

// ────────────────────────────────────────────────────────────
const LINKS_FILE = 'links.json';
const DEFAULT_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTAiPjwvY2lyY2xlPjxwYXRoIGQ9Ik0yIDEyaDIwIj48L3BhdGg+PHBhdGggZD0iTTEyIDJhMTUuMyAxNS4zIDAgMCAxIDQgMTAgMTUuMyAxNS4zIDAgMCAxLTQgMTAgMTUuMyAxNS4zIDAgMCAxLTQtMTAgMTUuMyAxNS4zIDAgMCAxIDQtMTB6Ij48L3BhdGg+PC9zdmc+';

/* ── 搜索分类数据 ── */
const SEARCH_CATEGORIES = [
  {
    id: 'engine', label: '引擎', icon: '🔍',
    engines: [
      { name: '百度',       icon: '🔵', url: 'https://www.baidu.com/s?wd=',           domain: 'baidu.com' },
      { name: 'Google',     icon: '🌐', url: 'https://www.google.com/search?q=',      domain: 'google.com' },
      { name: 'Brave',      icon: '🦁', url: 'https://search.brave.com/search?q=',    domain: 'search.brave.com' },
      { name: '搜狗',       icon: '🐶', url: 'https://www.sogou.com/web?query=',      domain: 'sogou.com' },
      { name: 'Bing',       icon: '🔷', url: 'https://www.bing.com/search?q=',        domain: 'bing.com' },
      { name: 'DuckDuckGo', icon: '🦆', url: 'https://duckduckgo.com/?q=',            domain: 'duckduckgo.com' },
      { name: '360',        icon: '🟢', url: 'https://www.so.com/s?q=',               domain: 'so.com' },
      { name: '夸克',       icon: '⚡', url: 'https://www.quark.cn/s?q=',             domain: 'quark.cn' },
    ]
  },
  {
    id: 'community', label: '社区', icon: '💬',
    engines: [
      { name: 'GitHub', icon: '🐱', url: 'https://github.com/search?q=',             domain: 'github.com' },
      { name: '微博',   icon: '🌊', url: 'https://s.weibo.com/weibo?q=',              domain: 'weibo.com' },
      { name: '知乎',   icon: '🔵', url: 'https://www.zhihu.com/search?q=',           domain: 'zhihu.com' },
      { name: '豆瓣',   icon: '🟢', url: 'https://www.douban.com/search?q=',          domain: 'douban.com' },
      { name: '贴吧',   icon: '🟠', url: 'https://tieba.baidu.com/f/search/res?qw=',  domain: 'tieba.baidu.com' },
      { name: 'Reddit', icon: '🔴', url: 'https://www.reddit.com/search/?q=',         domain: 'reddit.com' },
    ]
  },
  {
    id: 'video', label: '视频', icon: '🎬',
    engines: [
      { name: 'B站',    icon: '📺', url: 'https://search.bilibili.com/all?keyword=', domain: 'bilibili.com' },
      { name: '腾讯',   icon: '🐧', url: 'https://v.qq.com/search.html#stag=0&s=',  domain: 'v.qq.com' },
      { name: '爱奇艺', icon: '🟢', url: 'https://so.iqiyi.com/so/q_',              domain: 'iqiyi.com' },
      { name: '优酷',   icon: '🔵', url: 'https://so.youku.com/search_video/q_',    domain: 'youku.com' },
      { name: '芒果',   icon: '🟡', url: 'https://so.mgtv.com/so/k-',               domain: 'mgtv.com' },
    ]
  },
  {
    id: 'music', label: '音乐', icon: '🎵',
    engines: [
      { name: 'QQ音乐', icon: '🟢', url: 'https://y.qq.com/portal/search.html#page=1&searchid=1&remoteplace=txt.yqq.top&t=song&w=', domain: 'y.qq.com' },
      { name: '网易云', icon: '🔴', url: 'https://music.163.com/#/search/m/?s=',                                                    domain: 'music.163.com' },
    ]
  },
  {
    id: 'life', label: '生活', icon: '🛒',
    engines: [
      { name: '淘宝',   icon: '🟠', url: 'https://s.taobao.com/search?q=',                              domain: 'taobao.com' },
      { name: '京东',   icon: '🔴', url: 'https://search.jd.com/Search?keyword=',                       domain: 'jd.com' },
      { name: '拼多多', icon: '🟣', url: 'https://mobile.yangkeduo.com/search_result.html?search_key=',  domain: 'pinduoduo.com' },
      { name: '做菜',   icon: '🍳', url: 'https://www.xiachufang.com/search/?keyword=',                  domain: 'xiachufang.com' },
      { name: '翻译',   icon: '🌐', url: 'https://fanyi.baidu.com/#zh/en/',                             domain: 'fanyi.baidu.com' },
    ]
  },
  {
    id: 'job', label: '求职', icon: '💼',
    engines: [
      { name: '智联招聘', icon: '🔵', url: 'https://sou.zhaopin.com/?jl=530&kw=',                         domain: 'zhaopin.com' },
      { name: 'BOSS直聘', icon: '🟡', url: 'https://www.zhipin.com/web/geek/job?query=',                  domain: 'zhipin.com' },
      { name: '猎聘',     icon: '🟠', url: 'https://www.liepin.com/zhaopin/?key=',                        domain: 'liepin.com' },
      { name: '前程无忧', icon: '🔴', url: 'https://search.51job.com/list/000000,000000,0000,00,9,99,',   domain: '51job.com' },
      { name: '拉勾网',   icon: '🟢', url: 'https://www.lagou.com/wn/jobs?kd=',                           domain: 'lagou.com' },
    ]
  },
];

let currentCategoryId = 'engine';
let currentEngine     = SEARCH_CATEGORIES[0].engines[0];
let enginePanelOpen   = false;

function getSearchCategories() {
  const customEngines = Array.isArray(currentSettings.customEngines) ? currentSettings.customEngines : [];
  return SEARCH_CATEGORIES.map(cat => ({
    ...cat,
    engines: [
      ...cat.engines,
      ...customEngines.filter(e => e.category === cat.id).map(e => ({ ...e }))
    ]
  })).concat(
    customEngines.filter(e => e.category === 'custom').length > 0
      ? [{ id: 'custom', label: '自定义', icon: '✨', engines: customEngines.filter(e => e.category === 'custom').map(e => ({ ...e })) }]
      : []
  );
}

function buildSearchUrl(engine, query) {
  if (!engine || !engine.url) return '';
  if (!query) return engine.url;
  const encoded = encodeURIComponent(query);
  if (engine.url.includes('{{query}}')) return engine.url.replace(/{{\s*query\s*}}/gi, encoded);
  if (engine.url.includes('%s')) return engine.url.replace(/%s/g, encoded);
  if (engine.url.endsWith('=') || engine.url.endsWith('?') || engine.url.endsWith('&')) return engine.url + encoded;
  return engine.url + encoded;
}

/* ── 工具 ── */
function getDomain(url) {
  try { return new URL(url).hostname; } catch { return null; }
}
function faviconSrc(url) { return buildFaviconUrl(getDomain(url)); }
function engineFavicon(engine) { return buildFaviconUrl(engine.domain); }

/* ── 渲染分类 Tab ── */
function renderSearchTabs() {
  const tabsEl = document.getElementById('searchTabs');
  tabsEl.innerHTML = '';
  getSearchCategories().forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'search-tab' + (cat.id === currentCategoryId ? ' active' : '');
    btn.innerHTML = `<span class="tab-icon">${cat.icon}</span><span class="tab-label">${cat.label}</span>`;
    btn.onclick = () => {
      selectCategory(cat.id);
      if (enginePanelOpen) renderEnginePanel();
    };
    tabsEl.appendChild(btn);
  });
}

/* ── 更新搜索框显示的引擎 ── */
function updateSearchBoxEngine() {
  const icon   = document.getElementById('search-engine-icon');
  const nameEl = document.getElementById('engineName');
  // 使用占位图，异步加载外部 favicon，避免大量失败请求阻塞渲染
  icon.src = DEFAULT_ICON;
  // 尝试异步加载真实图标，加载成功再替换
  try {
    const loader = new Image();
    loader.onload = () => { icon.src = loader.src; };
    loader.onerror = () => { /* 保持占位图 */ };
    loader.src = engineFavicon(currentEngine);
  } catch (e) {
    /* ignore */
  }
  nameEl.textContent = currentEngine.name;
}

/* ── 切换分类 ── */
function selectCategory(catId) {
  currentCategoryId = catId;
  const cat = getSearchCategories().find(c => c.id === catId);
  if (cat && cat.engines.length) {
    currentEngine = cat.engines[0];
  } else {
    const fallbackCategory = getSearchCategories().find(c => c.engines.length);
    if (fallbackCategory) {
      currentCategoryId = fallbackCategory.id;
      currentEngine = fallbackCategory.engines[0];
    }
  }
  renderSearchTabs();
  updateSearchBoxEngine();
}

/* ── 切换引擎 ── */
function selectEngine(engine) {
  currentEngine = engine;
  updateSearchBoxEngine();
  renderEnginePanel(); // 刷新高亮
  document.getElementById('searchInput').focus();
  // 选择后自动关闭下拉面板
  closeEnginePanel();
}

function getAddEngineSuggestions() {
  const customUrls = new Set((currentSettings.customEngines || []).map(e => e.url));
  return SEARCH_CATEGORIES.flatMap(category => category.engines.map(engine => ({
    ...engine,
    category: category.id,
    added: customUrls.has(engine.url)
  })));
}

function openAddEngineModal() {
  closeEnginePanel();
  const modal = document.getElementById('addEngineModal');
  if (!modal) return;
  renderAddEngineModal();
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  modal.querySelector('#modalEngineInput')?.focus();
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAddEngineModal();
  }
});

function closeAddEngineModal() {
  const modal = document.getElementById('addEngineModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function addCustomEngineFromModal() {
  const input = document.getElementById('modalEngineInput');
  if (!input) return;
  const raw = input.value.trim();
  if (!raw) return alert('请输入搜索地址');
  if (currentSettings.customEngines.length >= 8) return alert('最多添加8种搜索引擎');
  let url = raw;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  try {
    new URL(url.replace(/{{\s*query\s*}}/gi, 'test').replace(/%s/g, 'test'));
  } catch {
    return alert('请输入有效的搜索地址');
  }
  const domain = getDomain(url) || '';
  currentSettings.customEngines = currentSettings.customEngines || [];
  currentSettings.customEngines.push({
    name: '自定义搜索',
    icon: '🔎',
    url: raw,
    domain,
    category: 'custom'
  });
  saveSettings();
  renderAddEngineModal();
  renderSearchTabs();
  if (currentCategoryId === 'custom') renderEnginePanel();
  input.value = '';
  alert('已添加自定义搜索引擎');
}

function renderAddEngineModal() {
  const modal = document.getElementById('addEngineModal');
  const list = document.getElementById('modalEngineGrid');
  const subtitle = document.getElementById('addEngineModalSubtitle');
  if (!modal || !list || !subtitle) return;
  const count = (currentSettings.customEngines || []).length;
  subtitle.textContent = `最多添加8种，已添加${count}种`;
  list.innerHTML = '';
  const suggestions = getAddEngineSuggestions();
  suggestions.forEach(engine => {
    const card = document.createElement('div');
    card.className = 'engine-card';
    card.innerHTML = `
      <span class="engine-card-icon">${engine.icon || '🔎'}</span>
      <div class="engine-card-info">
        <div class="engine-card-name">${engine.name}</div>
        <div class="engine-card-url">${engine.url}</div>
      </div>
      <button type="button" class="engine-card-button${engine.added ? ' added' : ''}" ${engine.added ? 'disabled' : ''}>
        ${engine.added ? '已添加' : '添加'}
      </button>
    `;
    const button = card.querySelector('button');
    if (button && !engine.added) {
      button.addEventListener('click', () => {
        if (currentSettings.customEngines.length >= 8) return alert('最多添加8种搜索引擎');
        currentSettings.customEngines = currentSettings.customEngines || [];
        currentSettings.customEngines.push({
          name: engine.name,
          icon: engine.icon,
          url: engine.url,
          domain: engine.domain || getDomain(engine.url) || '',
          category: 'custom'
        });
        saveSettings();
        renderAddEngineModal();
        renderSearchTabs();
        if (currentCategoryId === 'custom') renderEnginePanel();
      });
    }
    list.appendChild(card);
  });
}

/* ── 渲染内联引擎面板（只显示当前分类） ── */
function renderEnginePanel() {
  const panel = document.getElementById('enginePanel');
  panel.innerHTML = '';
  const cat = getSearchCategories().find(c => c.id === currentCategoryId);
  if (!cat) return;

  cat.engines.forEach(engine => {
    const btn = document.createElement('button');
    btn.className = 'engine-btn' + (engine === currentEngine ? ' active' : '');
    btn.setAttribute('role', 'option');
    btn.setAttribute('tabindex', '0');

    const img = document.createElement('img');
    // 占位后异步加载真实 favicon，降低同步失败的控制台噪音
    img.src = DEFAULT_ICON;
    img.alt = engine.name;
    try {
      const loader = new Image();
      loader.onload = () => { img.src = loader.src; };
      loader.onerror = () => {
        // 尝试站点根下的 favicon 作为二次回退
        try {
          const fallback = new Image();
          fallback.onload = () => { img.src = fallback.src; };
          fallback.onerror = () => { img.src = DEFAULT_ICON; };
          fallback.src = `https://${engine.domain}/favicon.ico`;
        } catch (e) { img.src = DEFAULT_ICON; }
      };
      loader.src = engineFavicon(engine);
    } catch (e) { img.src = DEFAULT_ICON; }

    const label = document.createElement('span');
    label.textContent = engine.name;

    // 包装一个圆形图标容器以统一视觉样式
    const iconWrap = document.createElement('div');
    iconWrap.className = 'engine-icon';
    iconWrap.appendChild(img);
    btn.appendChild(iconWrap);
    btn.appendChild(label);
    btn.onclick = () => selectEngine(engine);
    panel.appendChild(btn);
  });

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'engine-btn add-engine-btn';
  addBtn.setAttribute('aria-label', '添加搜索引擎');
  addBtn.innerHTML = `
    <div class="engine-add-icon">+</div>
    <span>添加</span>
  `;
  addBtn.onclick = openAddEngineModal;
  panel.appendChild(addBtn);

  // 可访问性：标记面板为可见
  panel.setAttribute('role', 'listbox');
  panel.setAttribute('aria-hidden', 'false');
}

/* ── 开关内联面板 ── */
function toggleEnginePanel() {
  enginePanelOpen ? closeEnginePanel() : openEnginePanel();
}

function openEnginePanel() {
  enginePanelOpen = true;
  renderEnginePanel();
  const panel = document.getElementById('enginePanel');
  if (!panel) return;
  if (panel.parentElement !== document.body) {
    document.body.appendChild(panel);
  }
  // 将面板定位为固定的下拉浮层，并在窗口滚动/调整大小时保持跟随
  const trigger = document.getElementById('engineTrigger');
  panel.style.position = 'fixed';
  panel.style.display = 'flex';
  panel.classList.add('open');
  panel.classList.remove('vertical');
  panel.classList.add('horizontal');
  panel.style.zIndex = '1195';

  function reposition() {
    const searchBox = document.querySelector('.search-box');
    if (!searchBox) return;
    const rect = searchBox.getBoundingClientRect();
    const left = Math.max(8, rect.left);
    const top = Math.max(8, rect.bottom + 10);
    // 固定宽度与搜索框一致，最多限制在视口宽度内
    const desiredWidth = Math.min(760, Math.max(320, rect.width));
    // 调整左侧，确保不会超出视口右侧
    let finalLeft = rect.left;
    if (finalLeft + desiredWidth > window.innerWidth - 16) finalLeft = window.innerWidth - desiredWidth - 16;

    panel.style.left = (finalLeft) + 'px';
    panel.style.top = (rect.top + rect.height + 10) + 'px';
    panel.style.width = desiredWidth + 'px';
  }

  // 初始定位
  reposition();
  // 绑定随动事件
  const handler = () => { if (enginePanelOpen) reposition(); };
  panel._repositionHandler = handler;
  window.addEventListener('scroll', handler, true);
  window.addEventListener('resize', handler);

  // aria
  trigger?.setAttribute('aria-expanded', 'true');
  document.getElementById('engineArrow').style.transform = 'rotate(180deg)';

  // 键盘导航（上下切换）
  const keyHandler = (e) => {
    if (!enginePanelOpen) return;
    const buttons = Array.from(panel.querySelectorAll('.engine-btn'));
    const idx = buttons.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      const next = buttons[Math.min(buttons.length - 1, Math.max(0, idx + 1))];
      next?.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      const prev = buttons[Math.max(0, (idx === -1 ? 0 : idx) - 1)];
      prev?.focus();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      closeEnginePanel();
    } else if (e.key === 'Enter' && document.activeElement.classList.contains('engine-btn')) {
      document.activeElement.click();
    }
  };
  panel._keyHandler = keyHandler;
  panel.addEventListener('keydown', keyHandler);
}

function closeEnginePanel() {
  enginePanelOpen = false;
  const panel = document.getElementById('enginePanel');
  if (panel) {
    panel.style.display = 'none';
    panel.classList.remove('open');
    // 清理随动处理器与样式
    if (panel._repositionHandler) {
      window.removeEventListener('scroll', panel._repositionHandler, true);
      window.removeEventListener('resize', panel._repositionHandler);
      panel._repositionHandler = null;
    }
    panel.style.position = '';
    panel.style.zIndex = '';
    panel.style.left = '';
    panel.style.top = '';
    panel.style.width = '';
    panel.classList.remove('vertical');
    panel.setAttribute('aria-hidden', 'true');
    if (panel._keyHandler) { panel.removeEventListener('keydown', panel._keyHandler); panel._keyHandler = null; }
  }
  const arrow = document.getElementById('engineArrow');
  if (arrow) arrow.style.transform = '';
  const trigger = document.getElementById('engineTrigger');
  trigger?.setAttribute('aria-expanded', 'false');
}

/* ── 导航栏分类 ── */
function renderNavBar() {
  const navScroll = document.getElementById('navScroll');
  navScroll.innerHTML = '';
  // 全部按钮
  const allBtn = document.createElement('button');
  allBtn.className = 'nav-btn active';
  allBtn.dataset.section = 'all';
  allBtn.textContent = '🌐 全部';
  allBtn.onclick = () => filterBySection('all');
  navScroll.appendChild(allBtn);

  // 如果设置启用了常用，则先添加常用按钮
  if (currentSettings.favoritesEnabled) {
    const favBtn = document.createElement('button');
    favBtn.className = 'nav-btn';
    favBtn.dataset.section = 'favorites';
    favBtn.textContent = '⭐ 常用';
    favBtn.onclick = () => filterBySection('favorites');
    navScroll.appendChild(favBtn);
  }

  // 其余分类（排除原始的“常用”分区）
  if (allSections && allSections.length > 0) {
    allSections.forEach(section => {
      if (section === '常用') return; // 从主导航中移除“常用”原始项
      const btn = document.createElement('button');
      btn.className = 'nav-btn';
      btn.dataset.section = section;
      btn.textContent = section;
      btn.onclick = () => filterBySection(section);
      navScroll.appendChild(btn);
    });
  }
}

function removeFavoritesSection() {
  const custom = document.getElementById('custom-favorites-section');
  if (custom) custom.remove();
}

function filterBySection(sectionName) {
  // 更新导航按钮状态
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === sectionName);
  });
  
  // 筛选卡片
  if (sectionName === 'all') {
    removeFavoritesSection();
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('section-hidden'));
  } else if (sectionName === 'favorites') {
    const favsRaw = currentSettings.favoritesList || [];
    if (!favsRaw || favsRaw.length === 0) {
      removeFavoritesSection();
      document.querySelectorAll('.section').forEach(sec => sec.classList.add('section-hidden'));
      return;
    }
    renderFavoritesSection();
  } else {
    removeFavoritesSection();
    document.querySelectorAll('.section').forEach(sec => {
      const title = sec.querySelector('.section-title')?.innerText?.trim() || '';
      const shouldHide = title !== sectionName;
      sec.classList.toggle('section-hidden', shouldHide);
      if (!shouldHide) {
        sec.querySelectorAll('.card').forEach(c => c.classList.remove('hidden'));
      }
    });
  }
}
window.filterBySection = filterBySection;

/* ── 清空搜索框 ── */
function clearSearch() {
  const input   = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  input.value   = '';
  clearBtn.style.display = 'none';
  input.focus();
  filterLinks();
}
window.clearSearch = clearSearch;

/* ── 同步清空按钮显隐 ── */
function syncClearBtn() {
  const input    = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  clearBtn.style.display = input.value.length > 0 ? 'flex' : 'none';
}

/* ── 执行搜索 ── */
function doSearch() {
  const kw = document.getElementById('searchInput').value.trim();
  if (kw) window.open(buildSearchUrl(currentEngine, kw), '_blank');
}
window.doSearch = doSearch;

/* ── 站内筛选 ── */
function filterLinks() {
  syncClearBtn();
  const query = document.getElementById('searchInput').value.toLowerCase().trim();

  document.querySelectorAll('.card').forEach(card => {
    if (!query) {
      card.classList.remove('hidden');
    } else {
      const title    = card.querySelector('.title')?.innerText.toLowerCase() ?? '';
      const datadesc = (card.dataset.desc ?? '').toLowerCase();
      card.classList.toggle('hidden', !title.includes(query) && !datadesc.includes(query));
    }
  });

  document.querySelectorAll('.section').forEach(section => {
    if (!query) {
      section.classList.remove('section-hidden');
    } else {
      const visible = section.querySelectorAll('.card:not(.hidden), .fav-card:not(.hidden)');
      section.classList.toggle('section-hidden', visible.length === 0);
    }
  });
}
window.filterLinks = filterLinks;

/* ── 动态渲染卡片 ── */
function renderCards(sections) {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  removeFavoritesSection();
  
  // 收集所有分类
  allSections = sections.map(s => s.section);
  // 移除原始的“常用”分区，不在主列表渲染
  sections = sections.filter(s => s.section !== '常用');
  renderNavBar();

  sections.forEach(({ section, items }) => {
    const sec = document.createElement('div');
    sec.className = 'section';

    const h2 = document.createElement('h2');
    h2.className = 'section-title';
    h2.textContent = section;
    sec.appendChild(h2);

    const grid = document.createElement('div');
    grid.className = 'link-container';

    items.forEach(item => {
      const a = document.createElement('a');
      a.href         = getCardUrl(item);
      a.target       = '_blank';
      a.className    = 'card';
      a.dataset.desc = item['data-desc'] ?? item.desc ?? '';
      a.rel          = 'noopener noreferrer';
      if (item.intranet) {
        a.dataset.url      = item.url;
        a.dataset.intranet = item.intranet;
      }

      const img = document.createElement('img');
      img.className = 'favicon';
      img.loading   = 'lazy';
      img.src       = faviconSrc(item.url);
      img.onerror   = function () {
        const domain = getDomain(item.url);
        if (domain && !this.dataset.fallbackTried) {
          this.dataset.fallbackTried = '1';
          this.src = `https://${domain}/favicon.ico`;
        } else {
          this.src = DEFAULT_ICON;
          this.onerror = null;
        }
      };

      const top = document.createElement('div');
      top.className = 'card-top';
      const titleEl = document.createElement('span');
      titleEl.className = 'title';
      titleEl.textContent = item.title;
      top.appendChild(img);
      top.appendChild(titleEl);

      const desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = item.desc ?? '';

      const popup = document.createElement('div');
      popup.className = 'info-popup';
      popup.textContent = getDomain(getCardUrl(item)) ?? getCardUrl(item);

      a.appendChild(top);
      a.appendChild(desc);
      a.appendChild(popup);
      grid.appendChild(a);
    });

    sec.appendChild(grid);
    main.appendChild(sec);
  });

  bindTouchTooltip();
}

/* ── 渲染自定义常用面板（显示用户添加的常用链接） ── */
function renderFavoritesSection() {
  const main = document.getElementById('main-content');
  // 隐藏原先渲染的 sections
  document.querySelectorAll('.section').forEach(sec => sec.classList.add('section-hidden'));

  const favs = currentSettings.favoritesList || [];
  const secId = 'custom-favorites-section';
  let sec = document.getElementById(secId);
  if (sec) sec.remove();

  sec = document.createElement('div');
  sec.id = secId;
  sec.className = 'section';
  const h2 = document.createElement('h2'); h2.className = 'section-title'; h2.textContent = '常用';
  sec.appendChild(h2);

  const grid = document.createElement('div');
  grid.className = 'fav-grid';

  if (favs.length === 0) {
    const empty = document.createElement('div');
    empty.style.padding = '18px 14px';
    empty.style.borderRadius = '14px';
    empty.style.background = 'rgba(255,255,255,0.05)';
    empty.style.color = 'rgba(255,255,255,0.72)';
    empty.textContent = '当前还没有添加常用导航，点击右上角“设置”添加自定义网站。';
    grid.appendChild(empty);
  } else {
    favs.forEach(f => {
      const a = document.createElement('a');
      a.href = f.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      a.className = 'fav-card';
      a.style.background = f.bgColor || '#2a2a2a';
      const img = document.createElement('img');
      img.className = 'fav-icon';
      try {
        img.src = f.iconData || buildFaviconUrl((new URL(f.url)).hostname);
      } catch {
        img.src = f.iconData || DEFAULT_ICON;
      }
      img.onerror = () => { img.src = DEFAULT_ICON; };
      const label = document.createElement('div');
      label.className = 'fav-label';
      try {
        label.textContent = f.title || (new URL(f.url)).hostname.replace('www.','');
      } catch {
        label.textContent = f.title || f.url;
      }
      if (f.centerText) label.style.textAlign = 'center';
      a.appendChild(img);
      a.appendChild(label);
      grid.appendChild(a);
    });
  }

  sec.appendChild(grid);
  main.insertBefore(sec, main.firstChild);
}

/* ── 移动端长按 Tooltip ── */
function bindTouchTooltip() {
  if (window.matchMedia('(hover: none)').matches) {
    let timer = null;
    let activeCard = null;

    function clearActive() {
      if (activeCard) { activeCard.classList.remove('touch-active'); activeCard = null; }
      clearTimeout(timer); timer = null;
    }

    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('touchstart', () => {
        clearActive();
        timer = setTimeout(() => {
          card.classList.add('touch-active');
          activeCard = card;
          setTimeout(clearActive, 2000);
        }, 500);
      }, { passive: true });

      card.addEventListener('touchend',  () => { if (timer) clearTimeout(timer); });
      card.addEventListener('touchmove', () => { clearTimeout(timer); timer = null; }, { passive: true });
    });

    document.addEventListener('touchstart', e => {
      if (activeCard && !activeCard.contains(e.target)) clearActive();
    }, { passive: true });
  }
}

/* ── 导航条拖拽识别：在用户拖动（滚动）导航时抑制按钮点击/active 样式 ── */
function bindNavDragListeners() {
  const navScroll = document.getElementById('navScroll');
  if (!navScroll || navScroll._dragBound) return;
  navScroll._dragBound = true;
  let startX = 0;
  let dragging = false;

  navScroll.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    dragging = false;
  }, { passive: true });

  navScroll.addEventListener('touchmove', e => {
    if (Math.abs(e.touches[0].clientX - startX) > 8) {
      dragging = true;
      navScroll.classList.add('dragging');
    }
  }, { passive: true });

  navScroll.addEventListener('touchend', () => {
    setTimeout(() => navScroll.classList.remove('dragging'), 120);
  });

  // 鼠标拖拽支持（桌面）
  navScroll.addEventListener('mousedown', e => {
    startX = e.clientX;
    dragging = false;
  });
  navScroll.addEventListener('mousemove', e => {
    if (e.buttons && Math.abs(e.clientX - startX) > 8) {
      dragging = true;
      navScroll.classList.add('dragging');
    }
  });
  navScroll.addEventListener('mouseup', () => {
    setTimeout(() => navScroll.classList.remove('dragging'), 120);
  });
}

/* ── 入口 ── */
document.addEventListener('DOMContentLoaded', async () => {
  // 加载设置
  loadSettings();
  updateSettingsUI();
  
  // 初始化设置面板事件
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentSettings.primaryColor = btn.dataset.color;
      saveSettings();
      updateSettingsUI();
    });
  });
  
  // 模糊度滑块
  const blurSlider = document.getElementById('blurSlider');
  if (blurSlider) {
    blurSlider.addEventListener('input', (e) => {
      currentSettings.blurValue = parseInt(e.target.value);
      document.getElementById('blurValue').textContent = currentSettings.blurValue + 'px';
      saveSettings();
    });
  }
  
  // 列数滑块
  const colsSlider = document.getElementById('colsSlider');
  if (colsSlider) {
    colsSlider.addEventListener('input', (e) => {
      currentSettings.colsValue = parseInt(e.target.value);
      document.getElementById('colsValue').textContent = currentSettings.colsValue + ' 列';
      saveSettings();
    });
  }
  
  // 透明度滑块
  const opacitySlider = document.getElementById('opacitySlider');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', (e) => {
      currentSettings.opacityValue = parseInt(e.target.value) / 100;
      document.getElementById('opacityValue').textContent = parseInt(e.target.value) + '%';
      saveSettings();
    });
  }
  
  renderSearchTabs();
  updateSearchBoxEngine();

  // 页面设置绑定
  const titleInput = document.getElementById('pageTitle');
  const subtitleInput = document.getElementById('pageSubtitle');
  const showTabsCheckbox = document.getElementById('showSearchTabs');
  const navRadiusSelect = document.getElementById('navRadiusSelect');

  if (titleInput) {
    titleInput.value = currentSettings.pageTitle;
    titleInput.addEventListener('input', (e) => {
      currentSettings.pageTitle = e.target.value;
      saveSettings();
      applySettings();
    });
  }

  if (subtitleInput) {
    subtitleInput.value = currentSettings.pageSubtitle;
    subtitleInput.addEventListener('input', (e) => {
      currentSettings.pageSubtitle = e.target.value;
      saveSettings();
      applySettings();
    });
  }

  if (showTabsCheckbox) {
    showTabsCheckbox.checked = currentSettings.showSearchTabs;
    showTabsCheckbox.addEventListener('change', (e) => {
      currentSettings.showSearchTabs = !!e.target.checked;
      saveSettings();
      applySettings();
    });
  }

  if (navRadiusSelect) {
    navRadiusSelect.value = currentSettings.navRadius === '8px' ? 'sharp' : 'soft';
    navRadiusSelect.addEventListener('change', (e) => {
      currentSettings.navRadius = e.target.value === 'sharp' ? '8px' : '18px';
      saveSettings();
      applySettings();
    });
  }

  // 常用导航事件绑定
  const favEnabled = document.getElementById('favEnabled');
  const saveFavBtn = document.getElementById('saveFavBtn');
  const clearFavBtn = document.getElementById('clearFavBtn');
  const addFavBtn = document.getElementById('addFavBtn');
  const favUrlInput = document.getElementById('favUrl');
  const favNameInput = document.getElementById('favName');
  const favIconFile = document.getElementById('favIconFile');
  const favBgColor = document.getElementById('favBgColor');
  const favCenterText = document.getElementById('favCenterText');

  if (favEnabled) {
    favEnabled.addEventListener('change', (e) => {
      currentSettings.favoritesEnabled = !!e.target.checked;
      saveSettings();
      renderNavBar();
    });
  }
  // 添加常用
  if (addFavBtn && favUrlInput) {
    addFavBtn.addEventListener('click', async () => {
      const url = (favUrlInput.value || '').trim();
      if (!url) return alert('请输入网址');
      let u = url;
      try { if (!/^https?:\/\//i.test(u)) u = 'https://' + u; new URL(u); } catch { return alert('网址格式不正确'); }
      const title = (favNameInput.value || '').trim();
      let iconData = '';
      if (favIconFile && favIconFile.files && favIconFile.files[0]) {
        const file = favIconFile.files[0];
        iconData = await new Promise(res => {
          const r = new FileReader(); r.onload = e => res(e.target.result); r.readAsDataURL(file);
        });
      }
      const bg = favBgColor?.value || '#2a2a2a';
      const center = !!(favCenterText && favCenterText.checked);
      currentSettings.favoritesList = currentSettings.favoritesList || [];
      currentSettings.favoritesList.push({ url: u, title: title || '', iconData, bgColor: bg, centerText: center });
      saveSettings();
      updateSettingsUI();
      favUrlInput.value = ''; favNameInput.value = ''; if (favIconFile) favIconFile.value = null;
    });
  }
  if (saveFavBtn) {
    saveFavBtn.addEventListener('click', () => {
      currentSettings.favoritesEnabled = !!(favEnabled && favEnabled.checked);
      saveSettings();
      updateSettingsUI();
      renderNavBar();
      alert('常用设置已保存');
    });
  }
  if (clearFavBtn) {
    clearFavBtn.addEventListener('click', () => {
      if (confirm('确定要清空常用列表吗？')) {
        currentSettings.favoritesList = [];
        saveSettings();
        updateSettingsUI();
        renderNavBar();
      }
    });
  }

  const engineNameInput = document.getElementById('engineNameInput');
  const engineIconInput = document.getElementById('engineIconInput');
  const engineUrlInput = document.getElementById('engineUrlInput');
  const engineCategorySelect = document.getElementById('engineCategorySelect');
  const addSearchEngineBtn = document.getElementById('addSearchEngineBtn');

  if (addSearchEngineBtn) {
    addSearchEngineBtn.addEventListener('click', () => {
      const name = (engineNameInput?.value || '').trim();
      const icon = (engineIconInput?.value || '').trim() || '🔎';
      const url = (engineUrlInput?.value || '').trim();
      const category = engineCategorySelect?.value || 'custom';
      if (!name || !url) return alert('请填写名称和搜索地址');
      let domain = '';
      try {
        const parsed = new URL(url.includes('{{query}}') || url.includes('%s') ? url.replace(/{{\s*query\s*}}/g, 'test').replace(/%s/g, 'test') : url);
        domain = parsed.hostname;
      } catch {
        const manualUrl = url.startsWith('http') ? url : 'https://' + url;
        try { domain = new URL(manualUrl).hostname; } catch { domain = ''; }
      }
      currentSettings.customEngines = currentSettings.customEngines || [];
      currentSettings.customEngines.push({ name, icon, url, domain, category });
      saveSettings();
      updateSettingsUI();
      renderSearchTabs();
      if (category === currentCategoryId) renderEnginePanel();
      engineNameInput.value = '';
      engineIconInput.value = '';
      engineUrlInput.value = '';
      engineCategorySelect.value = 'custom';
      alert('自定义搜索引擎已添加');
    });
  }

  const modalEngineAddBtn = document.getElementById('modalEngineAddBtn');
  const modalEngineInput = document.getElementById('modalEngineInput');
  if (modalEngineAddBtn) {
    modalEngineAddBtn.addEventListener('click', addCustomEngineFromModal);
  }
  if (modalEngineInput) {
    modalEngineInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addCustomEngineFromModal();
    });
  }

  // 引擎触发器点击
  document.getElementById('engineTrigger').addEventListener('click', () => {
    toggleEnginePanel();
  });

  // 搜索框键盘事件
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') closeEnginePanel();
  });

  // 绑定导航拖拽识别
  bindNavDragListeners();

  try {
    const res  = await fetch(LINKS_FILE);
    const data = await res.json();
    _linksData = data;
    renderCards(data);
  } catch (err) {
    console.error('加载 links.json 失败：', err);
    document.getElementById('main-content').innerHTML =
      '<p style="color:rgba(255,255,255,0.5);text-align:center;padding:2rem;">链接数据加载失败，请检查 links.json 文件。</p>';
  }
});
