// Shared behaviour: mobile nav toggle only. Content stays visible without
// depending on JS running — no scroll-triggered reveal animation.
(function () {
  var burger = document.getElementById('navBurger');
  var mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', function () {
      mobileNav.classList.toggle('open');
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { mobileNav.classList.remove('open'); });
    });
  }
})();
