(function() {
    var content = {
        about: {
            title: "About Setup Vault",
            text: "<p>Setup Vault is a premium curation platform dedicated to the art of the workspace. We believe that your environment dictates your output, and we are here to help you craft a sanctuary that inspires greatness.</p><p>Our curation process focuses on balancing aesthetics, performance, and accessibility. We do not claim manufacturer sponsorship and we update selections based on relevance.</p>"
        },
        privacy: {
            title: "Privacy Policy",
            text: "<p>At Setup Vault, we value your privacy. We do not collect personal data from our visitors. We use third-party tools like Amazon Associates to provide our curation services.</p><p><b>Cookies:</b> We use cookies to ensure that we give you the best experience on our website. These cookies may track your usage to provide a seamless transition to partner sites.</p><p><b>Amazon Disclosure:</b> We are a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for us to earn fees by linking to Amazon.com and affiliated sites.</p>"
        },
        terms: {
            title: "Terms of Service",
            text: "<p>By using Setup Vault, you agree to the following terms: All content provided is for informational and inspirational purposes only. While we strive for accuracy, product prices, availability, and specifications are subject to change by the manufacturer or retailer.</p><p>We are not responsible for any issues arising from purchases made on third-party websites. Please review the terms and conditions of Amazon.com before completing any transaction.</p>"
        }
    };

    var modalLastFocus = null;

    function getModalFocusables(container) {
        return Array.prototype.slice
            .call(
                container.querySelectorAll(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
                )
            )
            .filter(function(el) {
                return el.offsetParent !== null;
            });
    }

    function trapModalTab(ev, modal) {
        if (ev.key !== "Tab" || modal.style.display !== "flex") return;
        var nodes = getModalFocusables(modal);
        if (!nodes.length) return;
        var first = nodes[0];
        var last = nodes[nodes.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
            ev.preventDefault();
            last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
            ev.preventDefault();
            first.focus();
        }
    }

    window.openModal = function(type) {
        var modal = document.getElementById("modalOverlay");
        var body = document.getElementById("modalBody");
        if (!modal || !body) return;
        var modalText = content[type].text;
        if (type === "privacy") {
            modalText =
                "<p>At Setup Vault, we value transparency and privacy.</p>" +
                "<p><b>What we process:</b> basic technical data such as IP address, browser/device information, and page interaction events may be processed by analytics and affiliate partners when consent is granted.</p>" +
                "<p><b>Cookies and similar technologies:</b> essential cookies are used for core site functionality. Analytics and tracking technologies are optional and loaded only after consent. You can change your preference anytime by clearing site storage and reloading.</p>" +
                "<p><b>Affiliate disclosure:</b> As an Amazon Associate I earn from qualifying purchases. Product availability and details may change on partner platforms.</p>";
        }
        modalLastFocus = document.activeElement;
        body.innerHTML = "<h3 id=\"modalDialogTitle\">" + content[type].title + "</h3>" + modalText;
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");
        modal.setAttribute("aria-labelledby", "modalDialogTitle");
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        var closeBtn = modal.querySelector(".modal-close");
        if (closeBtn) closeBtn.focus();
    };

    window.closeModal = function() {
        var modal = document.getElementById("modalOverlay");
        if (!modal) return;
        modal.style.display = "none";
        modal.removeAttribute("aria-modal");
        if (!document.body.classList.contains("focus-mode")) {
            var exitOverlay = document.getElementById("exitIntentOverlay");
            if (!exitOverlay || exitOverlay.hidden) {
                document.body.style.overflow = "";
            }
        }
        if (modalLastFocus && modalLastFocus.focus) {
            modalLastFocus.focus();
        }
        modalLastFocus = null;
    };

    document.addEventListener("keydown", function(ev) {
        var modal = document.getElementById("modalOverlay");
        if (ev.key === "Escape" && modal && modal.style.display === "flex") {
            window.closeModal();
            return;
        }
        if (modal) trapModalTab(ev, modal);
    });

    document.addEventListener("DOMContentLoaded", function() {
        var focusCloseBtn = document.getElementById("focusCloseBtn");
        var focusActivateTimer = null;
        var consentKey = "sv_cookie_consent_v1";
        var trackingEnabled = false;
        var pageUrl = new URL(window.location.href);
        var query = pageUrl.searchParams;
        var trafficSource = query.get("utm_source") || query.get("source") || "direct";
        var pinCampaign = query.get("utm_campaign") || "always_on";
        var pinCreative = query.get("utm_content") || query.get("pin") || "unknown_pin";
        var campaignDay = query.get("day") || "1";

        var campaignBadge = document.getElementById("campaignDayBadge");
        if (campaignBadge) {
            campaignBadge.textContent = "\u25C9 " + campaignDay + "/5";
        }

        function loadGa() {
            if (window.gtag) return;
            var gaScript = document.createElement("script");
            gaScript.async = true;
            gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + window.SV_TRACKING.gaId;
            document.head.appendChild(gaScript);
            window.dataLayer = window.dataLayer || [];
            window.gtag = function() {
                window.dataLayer.push(arguments);
            };
            window.gtag("js", new Date());
            window.gtag("config", window.SV_TRACKING.gaId);
        }

        function loadPinterestTag() {
            if (window.pintrk) return;
            window.pintrk = function() {
                window.pintrk.queue.push(Array.prototype.slice.call(arguments));
            };
            window.pintrk.queue = [];
            window.pintrk.version = "3.0";
            var pinScript = document.createElement("script");
            pinScript.async = true;
            pinScript.src = "https://s.pinimg.com/ct/core.js";
            document.head.appendChild(pinScript);
            window.pintrk("load", window.SV_TRACKING.pinterestTagId);
            window.pintrk("page");
        }

        function applyConsent(consentValue) {
            trackingEnabled = consentValue === "accepted";
            if (trackingEnabled) {
                loadGa();
                loadPinterestTag();
            }
        }

        function initConsentUi() {
            var banner = document.getElementById("cookieBanner");
            var acceptBtn = document.getElementById("cookieAcceptBtn");
            var rejectBtn = document.getElementById("cookieRejectBtn");
            var policyBtn = document.getElementById("cookiePolicyBtn");
            var prefsLink = document.getElementById("cookiePrefsLink");
            if (!banner || !acceptBtn || !rejectBtn || !policyBtn) return;

            policyBtn.addEventListener("click", function() {
                window.openModal("privacy");
            });
            if (prefsLink) {
                prefsLink.addEventListener("click", function() {
                    banner.style.display = "block";
                });
            }
            acceptBtn.addEventListener("click", function() {
                localStorage.setItem(consentKey, "accepted");
                banner.style.display = "none";
                applyConsent("accepted");
            });
            rejectBtn.addEventListener("click", function() {
                localStorage.setItem(consentKey, "rejected");
                banner.style.display = "none";
                applyConsent("rejected");
            });

            var current = localStorage.getItem(consentKey);
            if (!current) {
                banner.style.display = "block";
                applyConsent("rejected");
                return;
            }
            banner.style.display = "none";
            applyConsent(current);
        }

        function getDeviceType() {
            var width = window.innerWidth || document.documentElement.clientWidth;
            if (width <= 900) return "mobile";
            if (width <= 1200) return "tablet";
            return "desktop";
        }

        function getWeekdayUTC() {
            return new Date().toISOString().slice(0, 10);
        }

        function saveClickLog(payload) {
            if (!trackingEnabled) return;
            var key = "sv_click_log";
            var current = [];
            try {
                current = JSON.parse(localStorage.getItem(key) || "[]");
            } catch (err) {
                current = [];
            }
            current.push(payload);
            localStorage.setItem(key, JSON.stringify(current.slice(-400)));
        }

        document.body.addEventListener("click", function(ev) {
            var btn = ev.target.closest(".part-btn");
            if (btn && btn.tagName === "A") {
                var card = btn.closest(".part-card");
                var section = btn.closest("section");
                var productId = card && card.id ? card.id : "unknown_product";
                var setupType = section && section.id ? section.id : "unknown_setup";
                if (btn.getAttribute("data-exit-intent") === "1") {
                    productId = "angel-keyboard";
                    setupType = "exit_intent";
                }
                var priceTier = setupType === "stealth-operator" ? "upper_midrange" : "midrange_value";
                var deviceType = getDeviceType();
                var dayStamp = getWeekdayUTC();
                var targetUrl = btn.getAttribute("href") || "unknown_url";
                var clickPayload = {
                    ts: new Date().toISOString(),
                    day: dayStamp,
                    source: trafficSource,
                    campaign: pinCampaign,
                    creative: pinCreative,
                    product_id: productId,
                    section: setupType,
                    price_tier: priceTier,
                    device: deviceType,
                    target_url: targetUrl
                };

                saveClickLog(clickPayload);

                if (trackingEnabled && window.pintrk) {
                    pintrk("track", "lead", {
                        event_name: "Amazon_Click",
                        product_id: productId,
                        setup_type: setupType,
                        price_tier: priceTier,
                        traffic_source: trafficSource,
                        campaign_id: pinCampaign,
                        creative_id: pinCreative,
                        device_type: deviceType,
                        day_stamp: dayStamp
                    });
                }
                if (trackingEnabled && window.gtag) {
                    gtag("event", "Amazon_Click", {
                        event_category: "lead",
                        event_label: productId,
                        product_id: productId,
                        setup_type: setupType,
                        price_tier: priceTier,
                        traffic_source: trafficSource,
                        campaign_id: pinCampaign,
                        creative_id: pinCreative,
                        device_type: deviceType,
                        day_stamp: dayStamp
                    });
                }
                return;
            }

            var icon = ev.target.closest(".copy-link-icon");
            if (!icon) return;
            ev.preventDefault();
            icon.setAttribute("title", "Right click and copy link");
            var anchor = icon.getAttribute("href");
            if (!anchor) return;

            var fullUrl;
            try {
                fullUrl = new URL(anchor, window.location.href).href;
            } catch (err1) {
                fullUrl = "https://www.setupvaulthq.com/" + anchor.replace(/^\//, "");
            }

            navigator.clipboard.writeText(fullUrl).then(function() {
                var original = icon.textContent;
                icon.textContent = "Copied!";
                icon.style.fontSize = "11px";
                setTimeout(function() {
                    icon.textContent = original;
                    icon.style.fontSize = "";
                }, 1200);
            }).catch(function() {
                window.prompt("Copy this link:", fullUrl);
            });
        });

        function exitFocusMode() {
            if (focusActivateTimer) {
                clearTimeout(focusActivateTimer);
                focusActivateTimer = null;
            }
            document.body.classList.remove("focus-mode");
            var focusedCard = document.querySelector(".part-card.target-focus");
            if (focusedCard) {
                focusedCard.classList.remove("target-focus");
                focusedCard.classList.remove("focus-enter");
                focusedCard.classList.remove("focus-shift-right");
                focusedCard.classList.remove("focus-shift-left");
            }

            if (window.location.hash) {
                history.replaceState(null, "", window.location.pathname + window.location.search);
            }
        }

        function applyHashFocusMode() {
            if (focusActivateTimer) {
                clearTimeout(focusActivateTimer);
                focusActivateTimer = null;
            }

            var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            var isMobileViewport = viewportWidth <= 900;

            var cards = document.querySelectorAll(".part-card");
            var eligibleCards = document.querySelectorAll(
                ".setup-content-grid > .part-card:not(.case-unit-card)"
            );

            cards.forEach(function(card) {
                card.classList.remove("target-focus");
                card.classList.remove("focus-eligible");
                card.classList.remove("focus-shift-right");
                card.classList.remove("focus-shift-left");
            });

            eligibleCards.forEach(function(card) {
                card.classList.add("focus-eligible");
            });

            var targetId = window.location.hash ? window.location.hash.substring(1) : "";
            if (!targetId) {
                document.body.classList.remove("focus-mode");
                return;
            }

            var targetCard = document.getElementById(targetId);
            if (targetCard && targetCard.classList.contains("focus-eligible")) {
                var ancestorDetails = targetCard.closest("details");
                while (ancestorDetails) {
                    ancestorDetails.open = true;
                    ancestorDetails = ancestorDetails.parentElement
                        ? ancestorDetails.parentElement.closest("details")
                        : null;
                }
                targetCard.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

                if (isMobileViewport) {
                    document.body.classList.remove("focus-mode");
                    return;
                }

                focusActivateTimer = setTimeout(function() {
                    document.body.classList.add("focus-mode");
                    targetCard.classList.add("target-focus");

                    var cardRect = targetCard.getBoundingClientRect();
                    var vw = window.innerWidth || document.documentElement.clientWidth;
                    var sidebar = document.querySelector(".sidebar");
                    var safeLeftBoundary = 240;
                    if (sidebar && window.innerWidth > 900) {
                        safeLeftBoundary = sidebar.getBoundingClientRect().right + 40;
                    }
                    if (cardRect.left < safeLeftBoundary) {
                        targetCard.classList.add("focus-shift-right");
                    } else if (cardRect.right > vw - 80) {
                        targetCard.classList.add("focus-shift-left");
                    }

                    targetCard.classList.remove("focus-enter");
                    void targetCard.offsetWidth;
                    targetCard.classList.add("focus-enter");
                }, 420);
            } else {
                document.body.classList.remove("focus-mode");
            }
        }

        function attachTopPickAnalytics() {
            var topPicksGrid = document.getElementById("topPicksGrid");
            if (!topPicksGrid) return;
            topPicksGrid.addEventListener("click", function(e) {
                var link = e.target.closest(".pick-link");
                if (!link) return;
                var href = link.getAttribute("href") || "#";
                var payload = {
                    ts: new Date().toISOString(),
                    day: getWeekdayUTC(),
                    source: trafficSource,
                    campaign: pinCampaign,
                    creative: pinCreative,
                    action: "top_pick_click",
                    target_anchor: href,
                    device: getDeviceType()
                };
                saveClickLog(payload);
                if (trackingEnabled && window.gtag) {
                    gtag("event", "Top_Pick_Click", payload);
                }
            });
        }

            if (focusCloseBtn) {
                focusCloseBtn.addEventListener("click", exitFocusMode);
            }
            document.addEventListener("keydown", function(e) {
                if (e.key === "Escape" && document.body.classList.contains("focus-mode")) {
                    exitFocusMode();
                }
            });

            window.__svApplyHashFocus = applyHashFocusMode;

            applyHashFocusMode();
            initConsentUi();
            attachTopPickAnalytics();
            window.addEventListener("hashchange", applyHashFocusMode);
        });
})();
