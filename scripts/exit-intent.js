(function() {
  var STORAGE_KEY = "sv_exit_intent_shown_v1";
  var ARM_DELAY_MS = 8000;
  var MOBILE_SCROLL_UP_PX = 90;
  var MOBILE_SCROLL_MS = 380;

  var OFFER = {
    url: "https://amzn.to/4nl8dyg",
    productName: "Cloud-Touch Mechanical Board",
    cta: "Grab Today's #1 Deal on Amazon"
  };

  function alreadyShown() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function markShown() {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch (e) {}
  }

  function useScrollTrigger() {
    return window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  }

  function isCookieBannerVisible() {
    var banner = document.getElementById("cookieBanner");
    if (!banner) return false;
    var style = window.getComputedStyle(banner);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function isBlocked() {
    if (alreadyShown()) return true;
    if (document.body.classList.contains("focus-mode")) return true;
    if (isCookieBannerVisible()) return true;
    var legalModal = document.getElementById("modalOverlay");
    if (legalModal && legalModal.style.display === "flex") return true;
    var exitOverlay = document.getElementById("exitIntentOverlay");
    if (exitOverlay && !exitOverlay.hidden) return true;
    return false;
  }

  function ensureModal() {
    if (document.getElementById("exitIntentOverlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "exitIntentOverlay";
    overlay.className = "exit-intent-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "exitIntentTitle");
    overlay.hidden = true;

    overlay.innerHTML =
      '<div class="exit-intent-card">' +
      '<button type="button" class="exit-intent-close" aria-label="Close">&times;</button>' +
      '<p class="exit-intent-kicker">Limited-time pick</p>' +
      '<h2 id="exitIntentTitle" class="exit-intent-title">Wait! Don\'t miss today\'s hidden Amazon hardware deals</h2>' +
      '<p class="exit-intent-product">' +
      OFFER.productName +
      "</p>" +
      '<a href="' +
      OFFER.url +
      '" target="_blank" rel="noopener noreferrer" class="part-btn exit-intent-cta" data-exit-intent="1">' +
      OFFER.cta +
      "</a>" +
      '<button type="button" class="exit-intent-dismiss">No thanks, I\'ll pass</button>' +
      "</div>";

    document.body.appendChild(overlay);

    var card = overlay.querySelector(".exit-intent-card");
    overlay.addEventListener("click", hideModal);
    card.addEventListener("click", function(ev) {
      ev.stopPropagation();
    });
    overlay.querySelector(".exit-intent-close").addEventListener("click", hideModal);
    overlay.querySelector(".exit-intent-dismiss").addEventListener("click", hideModal);

    overlay.addEventListener("keydown", function(ev) {
      if (ev.key === "Escape") {
        hideModal();
        return;
      }
      if (ev.key !== "Tab") return;
      var nodes = overlay.querySelectorAll(
        'button, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!nodes.length) return;
      var list = Array.prototype.slice.call(nodes);
      var first = list[0];
      var last = list[list.length - 1];
      if (ev.shiftKey && document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      } else if (!ev.shiftKey && document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    });
  }

  function showModal() {
    if (isBlocked()) return;
    ensureModal();
    var overlay = document.getElementById("exitIntentOverlay");
    if (!overlay || !overlay.hidden) return;
    markShown();
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    var cta = overlay.querySelector(".exit-intent-cta");
    if (cta) cta.focus();
  }

  function hideModal() {
    var overlay = document.getElementById("exitIntentOverlay");
    if (!overlay) return;
    overlay.hidden = true;
    if (!document.body.classList.contains("focus-mode")) {
      var legalModal = document.getElementById("modalOverlay");
      if (!legalModal || legalModal.style.display !== "flex") {
        document.body.style.overflow = "";
      }
    }
  }

  function initExitIntent() {
    if (alreadyShown()) return;

    var armed = false;
    var disarmed = false;

    setTimeout(function() {
      armed = true;
    }, ARM_DELAY_MS);

    function tryShow() {
      if (!armed || disarmed || isBlocked()) return;
      disarmed = true;
      showModal();
    }

    if (!useScrollTrigger()) {
      document.documentElement.addEventListener(
        "mouseleave",
        function(ev) {
          if (ev.clientY > 12) return;
          tryShow();
        },
        { passive: true }
      );
    } else {
      var lastY = window.scrollY;
      var lastT = Date.now();

      window.addEventListener(
        "scroll",
        function() {
          if (!armed || disarmed) return;
          var y = window.scrollY;
          var t = Date.now();
          var dy = y - lastY;
          var dt = t - lastT;
          if (dt > 0 && dy < -MOBILE_SCROLL_UP_PX && dt <= MOBILE_SCROLL_MS) {
            tryShow();
          }
          lastY = y;
          lastT = t;
        },
        { passive: true }
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initExitIntent);
  } else {
    initExitIntent();
  }
})();
