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
    var reveals = document.querySelectorAll('.reveal, .pop-card');
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
    document.querySelectorAll('.reveal, .pop-card').forEach(function (el) { el.classList.add('in-view'); });
  }

  // ---------- swipe-demo: draggable card stack, mirrors the app's own gesture.
  // The whole hero section is the drag surface (not just the card box), so it
  // reads as "swipe anywhere here" the way the real app would feel. A touch
  // still has to prove it's a horizontal swipe (not a vertical scroll) before
  // it hijacks the gesture, so scrolling past the section is never broken. ----------
  document.querySelectorAll('.swipe-demo').forEach(function (demo) {
    var zone = demo.closest('section') || demo.parentElement;
    var cards = Array.from(demo.querySelectorAll('.swipe-card'));
    var order = cards.map(function (_, i) { return i; });
    var dots = demo.parentElement.querySelectorAll('.swipe-dot');
    var dragging = false, locked = false, startX = 0, startY = 0, curX = 0, activeCard = null;

    var bgPhotos = null;
    try { bgPhotos = JSON.parse(demo.dataset.bgPhotos || 'null'); } catch (e) {}
    var bgTarget = bgPhotos && demo.closest('.hero-photo-section');

    function layout() {
      order.forEach(function (cardIndex, pos) {
        cards[cardIndex].dataset.pos = pos;
      });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === order[0]); });
      if (bgTarget) {
        var photo = bgPhotos[order[0]];
        if (photo) {
          bgTarget.style.setProperty('--hero-bg', "url('" + photo.src + "')");
          bgTarget.style.setProperty('--hero-bg-pos', photo.pos || 'center 30%');
        }
      }
    }
    layout();

    function advance(dir) {
      var frontIndex = order[0];
      var front = cards[frontIndex];
      front.classList.add(dir > 0 ? 'fly-right' : 'fly-left');
      front.style.transform = '';
      order.push(order.shift());
      layout();
      setTimeout(function () { front.classList.remove('fly-right', 'fly-left'); }, 360);
    }

    function startDrag(clientX, clientY) {
      dragging = true; locked = false; startX = clientX; startY = clientY; curX = 0;
      activeCard = cards[order[0]];
    }
    function moveDrag(clientX, clientY) {
      if (!dragging) return false;
      var dx = clientX - startX, dy = clientY - startY;
      if (!locked) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return false;
        if (Math.abs(dy) > Math.abs(dx)) { dragging = false; return false; }
        locked = true;
        activeCard.classList.add('dragging');
      }
      curX = dx;
      activeCard.style.transform = 'translateX(' + curX + 'px) rotate(' + (curX / 18) + 'deg)';
      return true;
    }
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      if (!locked) return;
      activeCard.classList.remove('dragging');
      if (Math.abs(curX) > 70) {
        advance(curX);
      } else {
        activeCard.style.transform = '';
      }
    }

    zone.addEventListener('mousedown', function (e) {
      if (e.target.closest('a, button')) return;
      startDrag(e.clientX, e.clientY);
      var onMove = function (ev) { moveDrag(ev.clientX, ev.clientY); };
      var onUp = function () {
        endDrag();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    zone.addEventListener('touchstart', function (e) {
      if (e.target.closest('a, button')) return;
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    zone.addEventListener('touchmove', function (e) {
      var isHorizontalDrag = moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      if (isHorizontalDrag) e.preventDefault();
    }, { passive: false });
    zone.addEventListener('touchend', endDrag);
    zone.addEventListener('touchcancel', endDrag);

    var prevBtn = demo.parentElement.querySelector('#swipePrev');
    var nextBtn = demo.parentElement.querySelector('#swipeNext');
    if (nextBtn) nextBtn.addEventListener('click', function () { advance(1); });
    if (prevBtn) prevBtn.addEventListener('click', function () { advance(-1); });
  });

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
