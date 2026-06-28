/* =========================================================
   Ice Ice Bejby — main.js
   Enhancements only — the site is fully usable with JS disabled.
     1) Topbar gains .is-scrolled after 40px of scroll.
     2) Sticky action bar slides up once the hero CTAs leave view.
     3) Hero intro (mobile + motion OK): logo parallax + fade,
         headline reveal on scroll, scroll-arrow fade. DESIGN §4.2/§7.
     4) Fault report prototype submit: native validation + confirmation.
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

    // Logo: recede into the background — gentle upward parallax + shrink +
    // fade. Never translates DOWN (that would overlap the CTAs beneath it).
    heroImg.style.transform =
      "translate3d(0," + (-(y * 0.06)).toFixed(1) + "px,0) scale(" + (1 - p * 0.10).toFixed(3) + ")";
    heroImg.style.opacity = clamp(1 - y / (h * 0.55), 0, 1).toFixed(3);

    // Headline: reveal almost immediately as scrolling starts, rising up.
    var t = clamp((y - h * 0.05) / (h * 0.22), 0, 1);
    heroText.style.opacity = t.toFixed(3);
    heroText.style.transform = "translateY(" + ((1 - t) * 28).toFixed(1) + "px)";
    // re-enable interaction/selection only once it's actually showing
    heroText.style.pointerEvents = t > 0.02 ? "auto" : "none";

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

  /* ---- 4. Fault report prototype submit ---- */
  var faultForm = document.getElementById("fault-form");
  var faultStatus = document.getElementById("fault-form-status");
  var faultConfirmation = "Závada byla přijata. Budeme vás co nejdříve kontaktovat.";
  var faultError = "Odeslání se nezdařilo. Zavolejte nám prosím na +420 000 000 000.";
  // Web3Forms doručuje přílohy jako e-mailové attachmenty; nad limit to spadne.
  // Větší videa raději odmítneme tady a nasměrujeme na WhatsApp.
  var MAX_ATTACH_BYTES = 9 * 1024 * 1024; // ~9 MB celkem za všechny přílohy

  if (faultForm && faultStatus) {
    // Keep native validation available with JS off; take control only when JS runs.
    faultForm.setAttribute("novalidate", "");

    var faultSubmitBtn = faultForm.querySelector(".fault-form__submit");

    function showStatus(message, isError) {
      faultStatus.textContent = message;
      faultStatus.hidden = false;
      faultStatus.classList.toggle("fault-form__status--error", !!isError);
      faultStatus.focus();
    }

    faultForm.addEventListener("submit", function (event) {
      event.preventDefault();

      if (!faultForm.checkValidity()) {
        faultStatus.hidden = true;
        faultStatus.textContent = "";
        faultForm.reportValidity();
        return;
      }

      // Hlídáme celkovou velikost příloh, ať uživatel nečeká na tichý fail.
      var fileInput = faultForm.querySelector('input[type="file"]');
      var hasFiles = fileInput && fileInput.files.length > 0;
      if (hasFiles) {
        var total = 0;
        for (var i = 0; i < fileInput.files.length; i++) total += fileInput.files[i].size;
        if (total > MAX_ATTACH_BYTES) {
          showStatus("Přílohy jsou příliš velké (max 9 MB). Větší video pošlete prosím přes WhatsApp.", true);
          return;
        }
      }

      var data = new FormData(faultForm);
      // Prázdný file input posílá Web3Forms 400 (Bad Request) — bez příloh ho odebereme.
      if (!hasFiles && fileInput) data.delete(fileInput.name);

      if (faultSubmitBtn) {
        faultSubmitBtn.disabled = true;
        faultSubmitBtn.dataset.label = faultSubmitBtn.textContent;
        faultSubmitBtn.textContent = "Odesílám…";
      }

      fetch(faultForm.action, { method: "POST", body: data })
        .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
        .then(function (result) {
          if (result.ok && result.json && result.json.success) {
            faultForm.reset();
            showStatus(faultConfirmation, false);
          } else {
            showStatus(faultError, true);
          }
        })
        .catch(function () { showStatus(faultError, true); })
        .finally(function () {
          if (faultSubmitBtn) {
            faultSubmitBtn.disabled = false;
            faultSubmitBtn.textContent = faultSubmitBtn.dataset.label || "Odeslat závadu";
          }
        });
    });
  }
})();
