/* ==========================================================================
   内容控制台 —— 无需改代码，直接在网页上编辑文字与增删内容
   用法：点击右下角铅笔按钮，或按 Ctrl/Cmd + E
   改动会自动保存到浏览器 localStorage；可导出独立 HTML / JSON 备份
   ========================================================================== */
(function () {
  'use strict';

  var LS_KEY = 'wws_site_v1';

  /* 作品图标：图标与配色配套，二者一起使用 */
  var WORK_ICONS = [
    { v: 'camera', label: '相机（摄影）', color: 'c-amber',
      svg: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' },
    { v: 'scope', label: '示波器（电气）', color: 'c-navy',
      svg: '<rect x="2" y="4" width="20" height="15" rx="2"/><path d="M2 11h4l2-4 3 8 2.5-6 1.5 2h7"/>' },
    { v: 'code', label: '代码（脚本）', color: 'c-sage',
      svg: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>' },
    { v: 'feather', label: '羽毛笔（写作）', color: 'c-terracotta',
      svg: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>' },
    { v: 'bolt', label: '闪电（通用）', color: 'c-slate',
      svg: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>' },
    { v: 'heart', label: '爱心（通用）', color: 'c-rose',
      svg: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' }
  ];

  /* 列表类型的字段定义 + 新建默认值 */
  var LIST_DEFS = {
    works: {
      label: '作品卡片',
      fields: [
        { key: 'name', label: '名称', type: 'text' },
        { key: 'tag', label: '标签', type: 'text' },
        { key: 'points', label: '要点（每行一条）', type: 'textarea' },
        { key: 'icon', label: '图标', type: 'select', options: WORK_ICONS.map(function (i) { return { v: i.v, label: i.label }; }) }
      ],
      newItem: function () { return { name: '新作品', tag: '标签', points: ['要点一', '要点二', '要点三'], icon: 'camera' }; }
    },
    skills: {
      label: '技能',
      fields: [
        { key: 'glyph', label: '图标字（2-4 字符）', type: 'text' },
        { key: 'name', label: '名称', type: 'text' }
      ],
      newItem: function () { return { glyph: 'SK', name: '新技能' }; }
    },
    blog: {
      label: '文章',
      fields: [
        { key: 'date', label: '日期', type: 'text' },
        { key: 'title', label: '标题', type: 'text' },
        { key: 'desc', label: '摘要', type: 'textarea' }
      ],
      newItem: function () { return { date: '2026-11-01', title: '新文章标题', desc: '文章摘要' }; }
    },
    contact: {
      label: '联系方式',
      fields: [
        { key: 'glyph', label: '图标字', type: 'text' },
        { key: 'handle', label: '名称', type: 'text' },
        { key: 'sub', label: '说明', type: 'text' }
      ],
      newItem: function () { return { glyph: '@', handle: '名称', sub: '说明' }; }
    }
  };

  /* 面板分组：单值字段 + 可选列表 */
  var GROUPS = [
    {
      id: 'hero', title: '导航 & Hero',
      fields: [
        { key: 'nav.name', label: '导航 · 名称' },
        { key: 'nav.cn', label: '导航 · 中文后缀' },
        { key: 'nav.l1', label: '导航 · 链接 1' },
        { key: 'nav.l2', label: '导航 · 链接 2' },
        { key: 'nav.l3', label: '导航 · 链接 3' },
        { key: 'nav.l4', label: '导航 · 链接 4' },
        { key: 'nav.cta', label: '导航 · 按钮文字' },
        { key: 'hero.name', label: '主标题（英文）' },
        { key: 'hero.cn', label: '主标题（中文）' },
        { key: 'hero.tagline', label: '一句话介绍', type: 'textarea' },
        { key: 'hero.trust', label: '信任行（用 · 分隔）' },
        { key: 'hero.cta1', label: '按钮一文字' },
        { key: 'hero.cta2', label: '按钮二文字' }
      ]
    },
    {
      id: 'works', title: '作品',
      fields: [
        { key: 'works.eyebrow', label: '眉题（英文）' },
        { key: 'works.title', label: '区块标题' },
        { key: 'works.lede', label: '导语', type: 'textarea' }
      ],
      list: 'works'
    },
    {
      id: 'skills', title: '技能',
      fields: [
        { key: 'skills.eyebrow', label: '眉题（英文）' },
        { key: 'skills.title', label: '区块标题' },
        { key: 'skills.lede', label: '导语', type: 'textarea' }
      ],
      list: 'skills'
    },
    {
      id: 'blog', title: '博客',
      fields: [
        { key: 'blog.eyebrow', label: '眉题（英文）' },
        { key: 'blog.title', label: '区块标题' },
        { key: 'blog.lede', label: '导语', type: 'textarea' }
      ],
      list: 'blog'
    },
    {
      id: 'about', title: '关于 & 联系',
      fields: [
        { key: 'about.eyebrow', label: '眉题（英文）' },
        { key: 'about.title', label: '区块标题' },
        { key: 'about.lede', label: '导语', type: 'textarea' },
        { key: 'about.bio1', label: '简介 · 第一段', type: 'textarea' },
        { key: 'about.bio2', label: '简介 · 第二段', type: 'textarea' }
      ],
      list: 'contact'
    },
    {
      id: 'foot', title: '页脚',
      fields: [
        { key: 'foot.name', label: '品牌名' },
        { key: 'foot.cn', label: '品牌中文' },
        { key: 'foot.sub', label: '副标题' },
        { key: 'foot.ver', label: '版本行' },
        { key: 'foot.ethos', label: '格言' },
        { key: 'foot.copy', label: '版权行' }
      ]
    }
  ];

  var state = { fields: {}, lists: {} };

  /* ---- 工具 ---- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function download(content, filename, mime) {
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  /* ---- 从 DOM 读取初始状态 ---- */
  function readFields() {
    var out = {};
    GROUPS.forEach(function (g) {
      (g.fields || []).forEach(function (f) {
        var el = $('[data-field="' + f.key + '"]');
        out[f.key] = el ? el.textContent.replace(/^\s+|\s+$/g, '') : '';
      });
    });
    return out;
  }

  function parseItem(listKey, node) {
    if (listKey === 'works') {
      var iconEl = $('.work-icon', node);
      var icon = (iconEl && iconEl.getAttribute('data-icon')) || 'camera';
      if (!WORK_ICONS.some(function (c) { return c.v === icon; })) icon = 'camera';
      var pts = $all('.fcard-points li', node).map(function (li) { return li.textContent.trim(); });
      return {
        name: ($('.fcard-name span:first-child', node) || {}).textContent || '',
        tag: ($('.fcard-name .tag', node) || {}).textContent || '',
        points: pts,
        icon: icon
      };
    }
    if (listKey === 'skills') {
      return {
        glyph: ($('.skill-glyph', node) || {}).textContent || '',
        name: ($('.skill-name', node) || {}).textContent || ''
      };
    }
    if (listKey === 'blog') {
      return {
        date: ($('.blog-card-date', node) || {}).textContent || '',
        title: ($('.blog-card-title', node) || {}).textContent || '',
        desc: ($('.blog-card-desc', node) || {}).textContent || ''
      };
    }
    if (listKey === 'contact') {
      return {
        glyph: ($('.contact-glyph', node) || {}).textContent || '',
        handle: ($('.contact-handle', node) || {}).textContent || '',
        sub: ($('.contact-sub', node) || {}).textContent || ''
      };
    }
    return {};
  }

  function readLists() {
    var out = {};
    Object.keys(LIST_DEFS).forEach(function (k) {
      var container = $('[data-list="' + k + '"]');
      out[k] = container
        ? $all(':scope > *', container).map(function (node) { return parseItem(k, node); })
        : [];
    });
    return out;
  }

  /* ---- 正文列表渲染（模板） ---- */
  function workHTML(it) {
    var ic = WORK_ICONS.filter(function (c) { return c.v === it.icon; })[0] || WORK_ICONS[0];
    var pts = (it.points || []).map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('');
    return '<article class="fcard">' +
      '<figure class="fcard-media"><div class="work-icon ' + ic.color + '" data-icon="' + ic.v + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + ic.svg + '</svg>' +
      '</div></figure>' +
      '<div class="fcard-body"><h3 class="fcard-name"><span>' + esc(it.name) + '</span>' +
      (it.tag ? '<span class="tag">' + esc(it.tag) + '</span>' : '') + '</h3>' +
      '<ul class="fcard-points">' + pts + '</ul></div></article>';
  }
  function skillHTML(it) {
    return '<li class="skill-tile"><span class="skill-glyph">' + esc(it.glyph) + '</span>' +
      '<span class="skill-name">' + esc(it.name) + '</span></li>';
  }
  function blogHTML(it) {
    return '<a class="blog-card" href="#blog">' +
      '<span class="blog-card-date">' + esc(it.date) + '</span>' +
      '<h3 class="blog-card-title">' + esc(it.title) + '</h3>' +
      '<p class="blog-card-desc">' + esc(it.desc) + '</p>' +
      '<span class="blog-card-more">阅读全文 →</span></a>';
  }
  function contactHTML(it) {
    return '<a class="contact-card" href="#about">' +
      '<span class="contact-glyph">' + esc(it.glyph) + '</span>' +
      '<span class="contact-meta"><span class="contact-handle">' + esc(it.handle) + '</span>' +
      '<span class="contact-sub">' + esc(it.sub) + '</span></span></a>';
  }
  var ITEM_HTML = { works: workHTML, skills: skillHTML, blog: blogHTML, contact: contactHTML };

  function renderList(listKey) {
    var container = $('[data-list="' + listKey + '"]');
    if (!container) return;
    var items = state.lists[listKey] || [];
    container.innerHTML = items.map(function (it) { return ITEM_HTML[listKey](it); }).join('');
  }

  /* ---- 应用状态到页面 ---- */
  function applyFields() {
    Object.keys(state.fields).forEach(function (key) {
      $all('[data-field="' + key + '"]').forEach(function (el) {
        el.textContent = state.fields[key];
      });
    });
  }
  function applyAll() {
    applyFields();
    Object.keys(LIST_DEFS).forEach(renderList);
  }

  /* ---- 持久化 ---- */
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
    var st = $('#ed-status');
    if (st) {
      st.textContent = '已自动保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
      st.className = 'ed-status ok';
    }
  }

  /* ---- 面板渲染 ---- */
  function fieldInputHTML(f, value, attrs) {
    var extra = attrs || '';
    if (f.type === 'textarea') {
      return '<textarea class="ed-input" ' + extra + '>' + esc(value) + '</textarea>';
    }
    if (f.type === 'select') {
      var opts = (f.options || []).map(function (o) {
        return '<option value="' + o.v + '"' + (value === o.v ? ' selected' : '') + '>' + esc(o.label) + '</option>';
      }).join('');
      return '<select class="ed-input" ' + extra + '>' + opts + '</select>';
    }
    return '<input class="ed-input" type="text" value="' + esc(value) + '" ' + extra + '>';
  }

  function renderPanel() {
    var drawer = $('#editor-drawer');
    var html = '';
    html += '<div class="ed-head">' +
      '<div><h2>内容控制台</h2><div class="ed-sub">改动即时生效，自动保存到本机浏览器</div></div>' +
      '<button class="ed-close" data-act="close" title="关闭">×</button></div>';

    html += '<div class="ed-toolbar">' +
      '<button class="ed-btn primary" data-act="save">保存</button>' +
      '<button class="ed-btn" data-act="export">导出 HTML</button>' +
      '<button class="ed-btn" data-act="exportjson">导出 JSON</button>' +
      '<button class="ed-btn" data-act="import">导入 JSON</button>' +
      '<button class="ed-btn danger" data-act="reset">恢复默认</button>' +
      '<p class="ed-status" id="ed-status">自动保存中…</p></div>';

    html += '<div class="ed-body">';

    GROUPS.forEach(function (g) {
      html += '<div class="ed-group open" data-group="' + g.id + '">';
      html += '<button class="ed-group-head" data-act="toggle" data-group="' + g.id + '">' +
        '<span>' + esc(g.title) + '</span><span class="chev">›</span></button>';
      html += '<div class="ed-group-panel">';

      (g.fields || []).forEach(function (f) {
        html += '<div class="ed-field"><label>' + esc(f.label) + '</label>' +
          fieldInputHTML(f, state.fields[f.key], 'data-group="' + g.id + '" data-key="' + f.key + '"') +
          '</div>';
      });

      if (g.list) {
        var def = LIST_DEFS[g.list];
        var items = state.lists[g.list] || [];
        html += '<div class="ed-items">';
        items.forEach(function (it, i) {
          html += '<div class="ed-item" data-list="' + g.list + '" data-index="' + i + '">';
          html += '<div class="ed-item-head"><span class="ed-item-title">' + esc(def.label) + ' #' + (i + 1) + '</span>' +
            '<span class="ed-item-ops">' +
            '<button class="ed-icon-btn" data-act="up" data-list="' + g.list + '" data-index="' + i + '" title="上移">↑</button>' +
            '<button class="ed-icon-btn" data-act="down" data-list="' + g.list + '" data-index="' + i + '" title="下移">↓</button>' +
            '<button class="ed-icon-btn danger" data-act="del" data-list="' + g.list + '" data-index="' + i + '" title="删除">×</button>' +
            '</span></div>';
          def.fields.forEach(function (f) {
            html += '<div class="ed-field"><label>' + esc(f.label) + '</label>' +
              fieldInputHTML(f, it[f.key], 'data-list="' + g.list + '" data-index="' + i + '" data-key="' + f.key + '"') +
              '</div>';
          });
          html += '</div>';
        });
        html += '</div>';
        html += '<button class="ed-add" data-act="add" data-list="' + g.list + '" style="margin-top:10px">＋ 添加' + esc(def.label) + '</button>';
      }

      html += '</div></div>';
    });

    html += '</div>';
    drawer.innerHTML = html;
  }

  /* ---- 打开 / 关闭 ---- */
  function open() {
    var drawer = $('#editor-drawer');
    renderPanel();
    drawer.hidden = false;
    document.body.classList.add('editing');
    requestAnimationFrame(function () { drawer.classList.add('open'); });
  }
  function close() {
    var drawer = $('#editor-drawer');
    drawer.classList.remove('open');
    document.body.classList.remove('editing');
    setTimeout(function () { drawer.hidden = true; }, 260);
  }
  function toggle() {
    var drawer = $('#editor-drawer');
    if (drawer.hidden || !drawer.classList.contains('open')) open();
    else close();
  }

  /* ---- 列表操作 ---- */
  function moveItem(listKey, index, delta) {
    var arr = state.lists[listKey];
    if (!arr) return;
    var j = index + delta;
    if (j < 0 || j >= arr.length) return;
    var tmp = arr[index]; arr[index] = arr[j]; arr[j] = tmp;
    renderList(listKey); renderPanel(); save();
  }
  function deleteItem(listKey, index) {
    var arr = state.lists[listKey];
    if (!arr) return;
    arr.splice(index, 1);
    renderList(listKey); renderPanel(); save();
  }
  function addItem(listKey) {
    var arr = state.lists[listKey];
    if (!arr) return;
    arr.push(LIST_DEFS[listKey].newItem());
    renderList(listKey); renderPanel(); save();
  }

  /* ---- 事件 ---- */
  function bindEvents() {
    var fab = $('.editor-fab');
    fab.addEventListener('click', toggle);

    var drawer = $('#editor-drawer');

    drawer.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'close') close();
      else if (act === 'toggle') {
        var group = $('.ed-group[data-group="' + t.getAttribute('data-group') + '"]', drawer);
        if (group) group.classList.toggle('open');
      } else if (act === 'add') addItem(t.getAttribute('data-list'));
      else if (act === 'del') deleteItem(t.getAttribute('data-list'), +t.getAttribute('data-index'));
      else if (act === 'up') moveItem(t.getAttribute('data-list'), +t.getAttribute('data-index'), -1);
      else if (act === 'down') moveItem(t.getAttribute('data-list'), +t.getAttribute('data-index'), 1);
      else if (act === 'save') save();
      else if (act === 'export') exportHTML();
      else if (act === 'exportjson') download(JSON.stringify(state, null, 2), 'site-data.json', 'application/json');
      else if (act === 'import') $('#import-file').click();
      else if (act === 'reset') reset();
    });

    drawer.addEventListener('input', function (e) {
      var t = e.target;
      if (!t.classList.contains('ed-input')) return;
      var list = t.getAttribute('data-list');
      var key = t.getAttribute('data-key');
      var val = t.value;
      if (list) {
        var idx = +t.getAttribute('data-index');
        var item = state.lists[list][idx];
        if (item) {
          if (key === 'points') item.points = val.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
          else item[key] = val;
          renderList(list); save();
        }
      } else {
        state.fields[key] = val;
        $all('[data-field="' + key + '"]').forEach(function (el) { el.textContent = val; });
        save();
      }
    });

    // 键盘
    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault(); toggle();
      }
      if (e.key === 'Escape' && !drawer.hidden) close();
    });
  }

  function exportHTML() {
    // 让所有 reveal 内容在导出副本中可见
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    clone.body.classList.remove('editing');
    clone.querySelectorAll('.editor-fab, #editor-drawer, script[src="editor.js"]').forEach(function (el) { el.remove(); });
    var html = '<!doctype html>\n' + clone.outerHTML;
    download(html, 'index.html', 'text/html');
  }

  function reset() {
    if (!confirm('确定恢复默认内容吗？当前改动将被清除。')) return;
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* ignore */ }
    location.reload();
  }

  /* 数据迁移：旧版作品用 color 字段，新版用 icon 字段 */
  function migrate() {
    var works = state.lists.works || [];
    var map = {
      'c-amber': 'camera', 'c-navy': 'scope', 'c-sage': 'code',
      'c-terracotta': 'feather', 'c-slate': 'bolt', 'c-rose': 'heart'
    };
    var changed = false;
    works.forEach(function (it) {
      if (!it.icon && it.color) { it.icon = map[it.color] || 'camera'; delete it.color; changed = true; }
      if (!it.icon) { it.icon = 'camera'; changed = true; }
    });
    if (changed) save();
  }

  /* ---- 初始化 ---- */
  function init() {
    // 隐藏的导入 input
    var fi = document.createElement('input');
    fi.type = 'file'; fi.accept = 'application/json,.json'; fi.id = 'import-file';
    fi.style.display = 'none';
    fi.addEventListener('change', function () {
      var file = fi.files && fi.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (data && data.fields && data.lists) {
            state = data;
            applyAll(); save();
            renderPanel();
          } else alert('格式不正确：缺少 fields / lists。');
        } catch (e) { alert('解析失败：不是有效的 JSON。'); }
      };
      reader.readAsText(file);
      fi.value = '';
    });
    document.body.appendChild(fi);

    // 读取初始状态
    state.fields = readFields();
    state.lists = readLists();

    // 尝试从 localStorage 恢复
    try {
      var saved = localStorage.getItem(LS_KEY);
      if (saved) {
        var data = JSON.parse(saved);
        if (data && data.fields && data.lists) {
          // 合并：以保存的字段为准，但保留 HTML 中新增的字段
          state.fields = Object.assign({}, state.fields, data.fields);
          state.lists = data.lists;
        }
      }
    } catch (e) { /* ignore */ }

    migrate();
    applyAll();
    bindEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
