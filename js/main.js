/* =========================================================
   Ice Ice Bejby — main.js
   Enhancements only — the site is fully usable with JS disabled.
     1) Topbar gains .is-scrolled after 40px of scroll.
     2) Sticky action bar slides up once the hero CTAs leave view.
     3) Hero intro (mobile + motion OK): logo parallax + fade,
        headline reveal on scroll, scroll-arrow fade. DESIGN §4.2/§7.
   All motion is gated behind (prefers-reduced-motion: no-preference)
   and uses transforms/opacity only.
   ========================================================= */
(function () {
  "use strict";

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /* ---- 1. Topbar scrolled state (DESIGN §4.1) ---- */
  var topbar = document.getElementById("topbar");
  var SCROLL_TRIGGER = 40;
  var topbarTicking = false;

  function syncTopbar() {
    topbarTicking = false;
    if (!topbar) return;
    topbar.classList.toggle("is-scrolled", window.scrollY > SCROLL_TRIGGER);
  }
  function onTopbarScroll() {
    if (!topbarTicking) {
      topbarTicking = true;
      window.requestAnimationFrame(syncTopbar);
    }
  }
  window.addEventListener("scroll", onTopbarScroll, { passive: true });
  syncTopbar();

  /* ---- 2. Sticky action bar show/hide (DESIGN §5) ---- */
  var actionbar = document.getElementById("actionbar");
  var heroCta = document.getElementById("hero-cta");

  if (actionbar && heroCta && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // Hero CTAs visible -> hide bar; scrolled away -> reveal under thumb.
          actionbar.classList.toggle("is-visible", !entry.isIntersecting);
        });
      },
      { rootMargin: "0px", threshold: 0 }
    );
    observer.observe(heroCta);
  }

  /* ---- 3. Hero intro motion (mobile only, DESIGN §4.2/§7) ---- */
  var hero = document.getElementById("hero");
  var heroImg = hero && hero.querySelector(".hero__img");
  var heroText = hero && hero.querySelector(".hero__text");
  var heroScroll = hero && hero.querySelector(".hero__scroll");

  var motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");
  var mobileQuery = window.matchMedia("(max-width: 767px)");
  var heroTicking = false;
  var heroActive = false;

  function renderHero() {
    heroTicking = false;
    if (!heroActive) return;
    var h = window.innerHeight || 1;
    var y = window.scrollY;
    var p = clamp(y / h, 0, 1);

    // Logo: parallax down, subtle scale-up + fade as it recedes into the bg.
    heroImg.style.transform =
      "translate3d(0," + (y * 0.18).toFixed(1) + "px,0) scale(" + (1 + p * 0.12).toFixed(3) + ")";
    heroImg.style.opacity = clamp(1 - y / (h * 0.65), 0, 1).toFixed(3);

    // Headline: reveal almost immediately as scrolling starts.
    var t = clamp((y - h * 0.06) / (h * 0.22), 0, 1);
    heroText.style.opacity = t.toFixed(3);
    heroText.style.transform = "translateY(" + ((1 - t) * 16).toFixed(1) + "px)";

    // Scroll arrow: fade out as soon as the user scrolls.
    if (heroScroll) {
      var a = clamp(1 - y / (h * 0.06), 0, 1);
      heroScroll.style.opacity = a.toFixed(3);
      heroScroll.style.pointerEvents = a < 0.05 ? "none" : "";
    }
  }
  function onHeroScroll() {
    if (!heroTicking) {
      heroTicking = true;
      window.requestAnimationFrame(renderHero);
    }
  }
  function clearHeroStyles() {
    [heroImg, heroText, heroScroll].forEach(function (el) {
      if (!el) return;
      el.style.transform = "";
      el.style.opacity = "";
      el.style.pointerEvents = "";
    });
  }
  function syncHeroMotion() {
    var enable = !!(hero && heroImg && heroText && mobileQuery.matches && motionQuery.matches);
    if (enable && !heroActive) {
      heroActive = true;
      hero.classList.add("hero--motion");
      window.addEventListener("scroll", onHeroScroll, { passive: true });
      renderHero();
    } else if (!enable && heroActive) {
      heroActive = false;
      hero.classList.remove("hero--motion");
      window.removeEventListener("scroll", onHeroScroll);
      clearHeroStyles();
    }
  }

  function addMqListener(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn); // older Safari
  }

  if (hero && heroImg && heroText) {
    syncHeroMotion();
    addMqListener(mobileQuery, syncHeroMotion);
    addMqListener(motionQuery, syncHeroMotion);
    window.addEventListener("resize", function () { if (heroActive) onHeroScroll(); }, { passive: true });
  }
})();
