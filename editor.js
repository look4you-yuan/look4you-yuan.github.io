/* ==========================================================================
   内容控制台（通用版）
   - 自动扫描页面上的 data-field / data-list / data-item，适配所有页面
   - 仅在本机打开（file:// 或 localhost）时启用；线上访问自动移除
   用法：点击右下角铅笔按钮，或按 Ctrl/Cmd + E
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. 环境检测：只在本机启用 ---------- */
  function isLocal() {
    var h = location.hostname;
    return location.protocol === 'file:' ||
      h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '';
  }
  if (!isLocal()) {
    (function strip() {
      var fab = document.querySelector('.editor-fab');
      if (fab) fab.remove();
      var dr = document.getElementById('editor-drawer');
      if (dr) dr.remove();
      document.body.classList.remove('editing');
    })();
    return;
  }

  var LS_KEY = 'wws_site_v3';

  /* ---------- 2. 图标库（data-type="icon" 用） ---------- */
  var ICONS = {
    lightbulb: { label: '灯泡（硬件）', color: 'c-amber',
      svg: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"/>' },
    plane: { label: '纸飞机（航模）', color: 'c-navy',
      svg: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>' },
    camera: { label: '相机（摄影）', color: 'c-sage',
      svg: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>' },
    feather: { label: '羽毛笔（写作）', color: 'c-terracotta',
      svg: '<path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/>' },
    cpu: { label: '芯片（电路）', color: 'c-slate',
      svg: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>' },
    code: { label: '代码（脚本）', color: 'c-sage',
      svg: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>' },
    bolt: { label: '闪电（通用）', color: 'c-slate',
      svg: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z"/>' },
    heart: { label: '爱心（通用）', color: 'c-rose',
      svg: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>' },
    scope: { label: '示波器（电气）', color: 'c-navy',
      svg: '<rect x="2" y="4" width="20" height="15" rx="2"/><path d="M2 11h4l2-4 3 8 2.5-6 1.5 2h7"/>' }
  };
  var COLOR_ICON = { 'c-amber': 'lightbulb', 'c-navy': 'plane', 'c-sage': 'camera', 'c-terracotta': 'feather', 'c-slate': 'cpu', 'c-rose': 'heart' };

  /* ---------- 3. 工具 ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function download(content, name, mime) {
    var blob = new Blob([content], { type: mime || 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
  }

  /* ---------- 4. 状态 ---------- */
  var state = { fields: {}, lists: {} };
  var schema = { fields: [], lists: [] };

  /* ---------- 5. 尺寸/类型辅助 ---------- */
  function ftype(el) { return el.getAttribute('data-type') || 'text'; }
  function fkey(el) { return el.getAttribute('data-field'); }
  function flabel(el) { return el.getAttribute('data-label') || fkey(el); }

  function colorIcon(el) {
    for (var k in COLOR_ICON) { if (el.classList.contains(k)) return COLOR_ICON[k]; }
    return 'lightbulb';
  }
  function setIcon(el, key) {
    var ic = ICONS[key] || ICONS.lightbulb;
    el.className = 'work-icon ' + ic.color;
    el.setAttribute('data-icon', key);
    el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ic.svg + '</svg>';
  }

  /* ---------- 6. 扫描 DOM ---------- */
  function scan() {
    schema.lists = [];
    schema.fields = [];

    $all('[data-list]').forEach(function (el) {
      var first = el.querySelector('[data-item]');
      if (!first) return;
      var fields = $all('[data-field]', first).map(function (f) {
        return { key: fkey(f), label: flabel(f), type: ftype(f) };
      });
      schema.lists.push({
        key: el.getAttribute('data-list'),
        label: el.getAttribute('data-label') || el.getAttribute('data-list'),
        el: el,
        template: first.cloneNode(true),
        fields: fields
      });
    });

    $all('[data-field]').forEach(function (el) {
      if (el.closest('[data-list]')) return;
      schema.fields.push({
        key: fkey(el), label: flabel(el),
        type: ftype(el), group: el.getAttribute('data-group') || '内容'
      });
    });
  }

  /* ---------- 7. 读写数据 ---------- */
  function serializeItem(itemEl) {
    var obj = {};
    $all('[data-field]', itemEl).forEach(function (f) {
      var k = fkey(f), t = ftype(f);
      if (t === 'lines') {
        obj[k] = $all('li', f).map(function (li) { return li.textContent.trim(); });
      } else if (t === 'icon') {
        obj[k] = f.getAttribute('data-icon') || colorIcon(f);
      } else {
        obj[k] = f.textContent.trim();
      }
    });
    return obj;
  }

  function renderItem(tpl, data) {
    var node = tpl.cloneNode(true);
    $all('[data-field]', node).forEach(function (f) {
      var k = fkey(f), t = ftype(f), v = data[k];
      if (t === 'lines') {
        f.innerHTML = (v || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
      } else if (t === 'icon') {
        setIcon(f, v || 'lightbulb');
      } else {
        f.textContent = v == null ? '' : v;
      }
    });
    return node;
  }

  function readInitial() {
    state.fields = {};
    schema.fields.forEach(function (f) {
      var el = $('[data-field="' + f.key + '"]');
      state.fields[f.key] = el ? el.textContent.trim() : '';
    });
    state.lists = {};
    schema.lists.forEach(function (L) {
      state.lists[L.key] = $all(':scope > [data-item]', L.el).map(serializeItem);
    });
  }

  function applyFields() {
    Object.keys(state.fields).forEach(function (k) {
      $all('[data-field="' + k + '"]').forEach(function (el) {
        if (ftype(el) === 'icon') return;
        el.textContent = state.fields[k];
      });
    });
  }
  function renderList(L) {
    var items = state.lists[L.key] || [];
    L.el.innerHTML = '';
    items.forEach(function (d) { L.el.appendChild(renderItem(L.template, d)); });
  }
  function renderAllLists() { schema.lists.forEach(renderList); }

  /* ---------- 8. 持久化 ---------- */
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { }
    var st = $('#ed-status');
    if (st) {
      st.textContent = '已自动保存 · ' + new Date().toLocaleTimeString('zh-CN', { hour12: false });
      st.className = 'ed-status ok';
    }
  }

  /* ---------- 9. 面板渲染 ---------- */
  function inputHTML(f, value, extra) {
    var ex = extra || '';
    if (f.type === 'textarea') return '<textarea class="ed-input" ' + ex + '>' + esc(value) + '</textarea>';
    if (f.type === 'icon') {
      var opts = Object.keys(ICONS).map(function (k) {
        return '<option value="' + k + '"' + (value === k ? ' selected' : '') + '>' + esc(ICONS[k].label) + '</option>';
      }).join('');
      return '<select class="ed-input" ' + ex + '>' + opts + '</select>';
    }
    if (f.type === 'lines') {
      var txt = Array.isArray(value) ? value.join('\n') : (value || '');
      return '<textarea class="ed-input" ' + ex + '>' + esc(txt) + '</textarea>';
    }
    return '<input class="ed-input" type="text" value="' + esc(value == null ? '' : value) + '" ' + ex + '>';
  }

  function renderPanel() {
    var d = $('#editor-drawer');
    var h = '';
    h += '<div class="ed-head"><div><h2>内容控制台</h2>' +
      '<div class="ed-sub">本机专用 · 改动自动保存到浏览器</div></div>' +
      '<button class="ed-close" data-act="close" title="关闭">×</button></div>';
    h += '<div class="ed-toolbar">' +
      '<button class="ed-btn primary" data-act="save">保存</button>' +
      '<button class="ed-btn" data-act="export">导出 HTML</button>' +
      '<button class="ed-btn" data-act="exportjson">导出 JSON</button>' +
      '<button class="ed-btn" data-act="import">导入 JSON</button>' +
      '<button class="ed-btn danger" data-act="reset">恢复默认</button>' +
      '<p class="ed-status" id="ed-status">自动保存中…</p></div>';
    h += '<div class="ed-body">';

    // 单值字段：按 group 聚合
    var groups = {}, order = [];
    schema.fields.forEach(function (f) {
      if (!groups[f.group]) { groups[f.group] = []; order.push(f.group); }
      groups[f.group].push(f);
    });
    order.forEach(function (g) {
      h += '<div class="ed-group open"><button class="ed-group-head" data-act="toggle">' +
        '<span>' + esc(g) + '</span><span class="chev">›</span></button><div class="ed-group-panel">';
      groups[g].forEach(function (f) {
        h += '<div class="ed-field"><label>' + esc(f.label) + '</label>' +
          inputHTML(f, state.fields[f.key], 'data-scope="field" data-key="' + esc(f.key) + '"') + '</div>';
      });
      h += '</div></div>';
    });

    // 列表
    schema.lists.forEach(function (L) {
      var items = state.lists[L.key] || [];
      h += '<div class="ed-group open"><button class="ed-group-head" data-act="toggle">' +
        '<span>' + esc(L.label) + '（' + items.length + '）</span><span class="chev">›</span></button><div class="ed-group-panel">';
      h += '<div class="ed-items">';
      items.forEach(function (it, i) {
        h += '<div class="ed-item"><div class="ed-item-head"><span class="ed-item-title">#' + (i + 1) + '</span>' +
          '<span class="ed-item-ops">' +
          '<button class="ed-icon-btn" data-act="up" data-list="' + esc(L.key) + '" data-index="' + i + '" title="上移">↑</button>' +
          '<button class="ed-icon-btn" data-act="down" data-list="' + esc(L.key) + '" data-index="' + i + '" title="下移">↓</button>' +
          '<button class="ed-icon-btn danger" data-act="del" data-list="' + esc(L.key) + '" data-index="' + i + '" title="删除">×</button>' +
          '</span></div>';
        L.fields.forEach(function (f) {
          h += '<div class="ed-field"><label>' + esc(f.label) + '</label>' +
            inputHTML(f, it[f.key], 'data-scope="item" data-list="' + esc(L.key) + '" data-index="' + i + '" data-key="' + esc(f.key) + '"') +
            '</div>';
        });
        h += '</div>';
      });
      h += '</div>';
      h += '<button class="ed-add" data-act="add" data-list="' + esc(L.key) + '">＋ 添加一项</button>';
      h += '</div></div>';
    });

    h += '</div>';
    d.innerHTML = h;
  }

  function panelList(L) {
    // 只重绘面板里某个 list 的 items 区域：简单起见整体重绘
    renderPanel();
  }

  /* ---------- 10. 打开/关闭 ---------- */
  function open() {
    renderPanel();
    var d = $('#editor-drawer');
    d.hidden = false;
    document.body.classList.add('editing');
    requestAnimationFrame(function () { d.classList.add('open'); });
  }
  function close() {
    var d = $('#editor-drawer');
    d.classList.remove('open');
    document.body.classList.remove('editing');
    setTimeout(function () { d.hidden = true; }, 260);
  }
  function toggle() {
    var d = $('#editor-drawer');
    if (d.hidden || !d.classList.contains('open')) open(); else close();
  }

  /* ---------- 11. 列表操作 ---------- */
  function findList(key) {
    for (var i = 0; i < schema.lists.length; i++) if (schema.lists[i].key === key) return schema.lists[i];
    return null;
  }
  function addItem(key) {
    var L = findList(key); if (!L) return;
    var empty = {};
    L.fields.forEach(function (f) {
      empty[f.key] = f.type === 'lines' ? [] : (f.type === 'icon' ? 'lightbulb' : '');
    });
    state.lists[key].push(empty);
    renderList(L); save(); renderPanel();
  }
  function delItem(key, i) {
    var L = findList(key); if (!L) return;
    state.lists[key].splice(i, 1);
    renderList(L); save(); renderPanel();
  }
  function moveItem(key, i, delta) {
    var L = findList(key); if (!L) return;
    var arr = state.lists[key], j = i + delta;
    if (j < 0 || j >= arr.length) return;
    var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    renderList(L); save(); renderPanel();
  }

  /* ---------- 12. 事件 ---------- */
  function bind() {
    var fab = $('.editor-fab');
    if (fab) fab.addEventListener('click', toggle);

    var d = $('#editor-drawer');

    d.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'close') close();
      else if (act === 'toggle') { var g = t.closest('.ed-group'); if (g) g.classList.toggle('open'); }
      else if (act === 'add') addItem(t.getAttribute('data-list'));
      else if (act === 'del') delItem(t.getAttribute('data-list'), +t.getAttribute('data-index'));
      else if (act === 'up') moveItem(t.getAttribute('data-list'), +t.getAttribute('data-index'), -1);
      else if (act === 'down') moveItem(t.getAttribute('data-list'), +t.getAttribute('data-index'), 1);
      else if (act === 'save') save();
      else if (act === 'export') exportHTML();
      else if (act === 'exportjson') download(JSON.stringify(state, null, 2), 'site-data.json', 'application/json');
      else if (act === 'import') { var fi = $('#import-file'); if (fi) fi.click(); }
      else if (act === 'reset') reset();
    });

    d.addEventListener('input', function (e) {
      var t = e.target;
      if (!t.classList.contains('ed-input')) return;
      var scope = t.getAttribute('data-scope');
      var key = t.getAttribute('data-key');
      var type = resolveType(scope, t);
      var val = t.value;

      if (scope === 'field') {
        state.fields[key] = val;
        $all('[data-field="' + key + '"]').forEach(function (el) {
          if (ftype(el) === 'icon') return;
          el.textContent = val;
        });
        save();
      } else if (scope === 'item') {
        var lk = t.getAttribute('data-list');
        var idx = +t.getAttribute('data-index');
        var it = state.lists[lk][idx];
        if (!it) return;
        if (type === 'lines') {
          it[key] = val.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        } else {
          it[key] = val;
        }
        var L = findList(lk);
        if (L) renderList(L);
        save();
      }
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); toggle(); }
      if (e.key === 'Escape' && !d.hidden) close();
    });
  }

  function resolveType(scope, t) {
    var k = t.getAttribute('data-key');
    if (scope === 'field') {
      for (var i = 0; i < schema.fields.length; i++) if (schema.fields[i].key === k) return schema.fields[i].type;
    } else {
      var L = findList(t.getAttribute('data-list'));
      if (L) for (var j = 0; j < L.fields.length; j++) if (L.fields[j].key === k) return L.fields[j].type;
    }
    return 'text';
  }

  /* ---------- 13. 导出 ---------- */
  function exportHTML() {
    var clone = document.documentElement.cloneNode(true);
    clone.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    if (clone.querySelector('body')) clone.querySelector('body').classList.remove('editing');
    clone.querySelectorAll('.editor-fab, #editor-drawer, script[src="editor.js"], script[src*="editor.js"]').forEach(function (el) { el.remove(); });
    var name = location.pathname.split('/').pop() || 'index.html';
    download('<!doctype html>\n' + clone.outerHTML, name, 'text/html');
  }

  function reset() {
    if (!confirm('确定恢复默认内容吗？当前改动将被清除。')) return;
    try { localStorage.removeItem(LS_KEY); } catch (e) { }
    location.reload();
  }

  /* ---------- 14. 初始化 ---------- */
  function init() {
    // 补全 icon 元素的 data-icon
    $all('[data-type="icon"]').forEach(function (el) {
      if (!el.getAttribute('data-icon')) el.setAttribute('data-icon', colorIcon(el));
    });

    scan();
    readInitial();

    // 从 localStorage 恢复（仅当结构匹配时）
    try {
      var saved = localStorage.getItem(LS_KEY);
      if (saved) {
        var data = JSON.parse(saved);
        if (data && data.fields && data.lists) {
          Object.keys(data.fields).forEach(function (k) {
            if (k in state.fields) state.fields[k] = data.fields[k];
          });
          Object.keys(data.lists).forEach(function (k) {
            if (k in state.lists && Array.isArray(data.lists[k])) state.lists[k] = data.lists[k];
          });
        }
      }
    } catch (e) { }

    applyFields();
    renderAllLists();

    // 导入 input
    var fi = document.createElement('input');
    fi.type = 'file'; fi.accept = 'application/json,.json'; fi.id = 'import-file';
    fi.style.display = 'none';
    fi.addEventListener('change', function () {
      var file = fi.files && fi.files[0]; if (!file) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var data = JSON.parse(r.result);
          if (data && data.fields && data.lists) {
            Object.keys(data.fields).forEach(function (k) { if (k in state.fields) state.fields[k] = data.fields[k]; });
            Object.keys(data.lists).forEach(function (k) { if (k in state.lists && Array.isArray(data.lists[k])) state.lists[k] = data.lists[k]; });
            applyFields(); renderAllLists(); save(); renderPanel();
          } else alert('格式不正确：缺少 fields / lists。');
        } catch (err) { alert('解析失败：不是有效的 JSON。'); }
      };
      r.readAsText(file); fi.value = '';
    });
    document.body.appendChild(fi);

    bind();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
