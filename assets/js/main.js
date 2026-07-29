// document.documentElement gets the 'js' class immediately (see inline
// script in <head>), so scroll-reveal only ever hides content when JS is
// confirmed running. Without JS, .reveal has no opacity/transform applied
// at all — nothing depends on an observer firing to become visible.
(function () {
  // iOS Safari only applies :active styles to a tap if some element on the
  // page has a touchstart listener — this is that listener. Lets the gate's
  // hold-to-preview split (mirrored from :hover) actually fire on touch.
  document.addEventListener('touchstart', function () {}, { passive: true });

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  var burger = document.getElementById('navBurger');
  var mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        burger.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('.switcher').forEach(function (root) {
    var tabs = root.querySelectorAll('.switcher-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        if (tab.classList.contains('active')) return;
        tabs.forEach(function (t) { t.classList.remove('active'); });
        root.querySelectorAll('.switcher-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
      });
    });
  });

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduceMotion && 'IntersectionObserver' in window) {
    var reveals = document.querySelectorAll('.reveal');
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in-view'); });
  }

  // Count-up animation for stat numbers, e.g. the About-page progress ring.
  document.querySelectorAll('[data-count-to]').forEach(function (el) {
    var target = parseFloat(el.dataset.countTo);
    var suffix = el.dataset.countSuffix || '';
    var decimals = (el.dataset.countTo.split('.')[1] || '').length;
    var started = false;
    var run = function () {
      if (started) return;
      started = true;
      if (reduceMotion) { el.textContent = target.toFixed(decimals) + suffix; return; }
      var duration = 900, start = null;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / duration);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var ioNum = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { if (entry.isIntersecting) { run(); ioNum.disconnect(); } });
      }, { threshold: 0.6 });
      ioNum.observe(el);
    } else {
      run();
    }
  });
})();
