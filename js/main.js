/* =========================================================
   Ice Ice Bejby — main.js
   Phase 1 behaviours only:
     1) Topbar gains .is-scrolled after 40px of scroll.
     2) Sticky action bar slides up once the hero CTAs leave view.
   No hero motion / reveals yet (Phase 4). Site is fully
   usable with JS disabled — these are enhancements only.
   ========================================================= */
(function () {
  "use strict";

  /* ---- 1. Topbar scrolled state (DESIGN §4.1) ---- */
  var topbar = document.getElementById("topbar");
  var SCROLL_TRIGGER = 40;
  var ticking = false;

  function syncTopbar() {
    if (!topbar) return;
    var scrolled = window.scrollY > SCROLL_TRIGGER;
    topbar.classList.toggle("is-scrolled", scrolled);
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(syncTopbar);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  syncTopbar(); // set correct state on load (e.g. refresh mid-page)

  /* ---- 2. Sticky action bar show/hide (DESIGN §5) ---- */
  var actionbar = document.getElementById("actionbar");
  var heroCta = document.getElementById("hero-cta");

  if (actionbar && heroCta && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // Hero CTAs visible -> hide bar (avoid doubled CTAs).
          // Hero CTAs scrolled away -> reveal bar under the thumb.
          actionbar.classList.toggle("is-visible", !entry.isIntersecting);
        });
      },
      { rootMargin: "0px", threshold: 0 }
    );
    observer.observe(heroCta);
  }
})();
