/* ==========================================================================
   弹性过渡动效
   - 节奏参考苹果官网：短距离、轻回弹、错峰入场
   - 用 transition 而不是 animation：类名本身就带终态，
     动画没跑起来内容也不会消失（比 animation + forwards 稳）
   - 尊重 prefers-reduced-motion：开启减弱动效时完全不介入
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  root.classList.add('js-motion');

  var TARGETS = [
    '.hero > *', '.page-hero > *',
    '.section-head', '.group-head',
    '.fcard', '.blog-row', '.blog-card',
    '.article-body > *',
    '.work-cover', '.stat-row', '.gallery figure',
    '.contact-block', '.contact-card',
    '.skill-group', '.exp-item', '.work-nav',
    '.reveal'
  ].join(',');

  var STEP = 70;
  var MAX_DELAY = 420;

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    requestAnimationFrame(function () { root.classList.add('motion-in'); });

    var all = Array.prototype.slice.call(document.querySelectorAll(TARGETS));
    var targets = all.filter(function (el) {
      for (var i = 0; i < all.length; i++) {
        if (all[i] !== el && all[i].contains(el)) return false;
      }
      return true;
    });

    var delayOf = [];
    targets.forEach(function (el) {
      var i = 0, sib = el.previousElementSibling;
      while (sib) {
        if (targets.indexOf(sib) >= 0) i++;
        sib = sib.previousElementSibling;
      }
      delayOf.push(Math.min(i * STEP, MAX_DELAY));
      el.classList.add('m-target');
    });

    var pending = targets.slice();

    function reveal(el, delay) {
      setTimeout(function () {
        el.classList.add('m-in');
        var done = function (e) {
          if (e && (e.target !== el || e.propertyName !== 'transform')) return;
          el.classList.remove('m-target', 'm-in');
          el.removeEventListener('transitionend', done);
        };
        el.addEventListener('transitionend', done);
        setTimeout(done, 1200);
      }, delay || 0);
    }

    function flush() {
      if (!pending.length) return;
      var vh = window.innerHeight || 800;
      var rest = [];
      for (var i = 0; i < pending.length; i++) {
        var el = pending[i];
        if (el.classList.contains('m-in')) continue;
        if (el.getBoundingClientRect().top < vh * 0.94) reveal(el, delayOf[targets.indexOf(el)]);
        else rest.push(el);
      }
      pending = rest;
    }

    var tail = null;
    function schedule() {
      flush();
      clearTimeout(tail);
      tail = setTimeout(flush, 120);
    }

    flush();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('load', schedule);
    setTimeout(schedule, 600);

    var guard = setInterval(function () {
      if (!pending.length) { clearInterval(guard); return; }
      flush();
    }, 800);

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          io.unobserve(el);
          if (el.classList.contains('m-in')) return;
          var k = pending.indexOf(el);
          if (k >= 0) pending.splice(k, 1);
          reveal(el, 0);
        });
      }, { threshold: 0.02, rootMargin: '0px 0px -4% 0px' });
      targets.forEach(function (el) { io.observe(el); });
    }

    var nav = document.querySelector('.nav-wrap');
    if (nav) {
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          if (window.scrollY > 12) nav.classList.add('nav-scrolled');
          else nav.classList.remove('nav-scrolled');
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest ? e.target.closest('a') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

      var href = a.getAttribute('href') || '';
      if (!href || href.charAt(0) === '#' || /^(mailto|tel|javascript):/i.test(href)) return;
      if (!/\.html?([?#]|$)/i.test(href)) return;

      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (location.protocol !== 'file:' && url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;

      e.preventDefault();
      root.classList.add('motion-out');
      setTimeout(function () { location.href = a.href; }, 130);
    });

    window.addEventListener('pageshow', function () {
      root.classList.remove('motion-out');
    });
  });
})();
