(function() {
  var SITE_VERSION = "2.2";
  function getTier(product) {
    if (product && product.valueTier) return product.valueTier;
    var priority = Number((product && product.priority) || 0);
    if (priority >= 9) return "premium";
    if (priority >= 7) return "mid";
    return "entry";
  }

  function getTierLabel(tier) {
    if (tier === "premium") return "Premium Tier";
    if (tier === "mid") return "Mid Tier";
    return "Entry Tier";
  }
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getCardClassForSection(sectionId) {
    return sectionId === "stealth-operator"
      ? 'part-card" style="background: #1E293B; border-color: #334155;'
      : "part-card";
  }

  function getImageClassForSection(sectionId) {
    return sectionId === "stealth-operator" ? "stealth-part-image" : "part-image";
  }

  function getButtonStyleForSection(sectionId) {
    if (sectionId === "stealth-operator") {
      return ' style="background: #0F172A; color: white; border-color: #475569;"';
    }
    return "";
  }

  function getTitleStyleForSection(sectionId) {
    return sectionId === "stealth-operator" ? ' style="color: white;"' : "";
  }

  function getMedalClassForSection(sectionId) {
    return sectionId === "stealth-operator" ? "medal-badge medal-dark" : "medal-badge";
  }

  function renderProductCard(product) {
    var sectionId = product.section || "zen-workspace";
    var amazonUrl = product.amazonUrl || "#";
    var badge = product.badge || "Top Pick";
    var name = product.name || "Curated Product";
    var image = product.image || "";
    var alt = product.alt || name;
    var benefit = product.benefit || "Balanced value and practical daily performance.";
    var pinterestMedia = product.pinterestMedia || image;
    var category = product.category || "gear";
    var tier = getTier(product);
    var cardClass = getCardClassForSection(sectionId);
    var imageClass = getImageClassForSection(sectionId);
    var buttonStyle = getButtonStyleForSection(sectionId);
    var titleStyle = getTitleStyleForSection(sectionId);
    var medalClass = getMedalClassForSection(sectionId);
    var pinUrl =
      "https://pinterest.com/pin/create/button/?url=https://setupvaulthq.com/#" +
      encodeURIComponent(product.id || "") +
      "&media=https://setupvaulthq.com/" +
      encodeURIComponent(pinterestMedia || "") +
      "&description=" +
      encodeURIComponent((name || "") + " - Setup Vault");

    return (
      '<div class="' + cardClass + '" id="' + escapeHtml(product.id || "") + '" data-category="' + escapeHtml(category) + '" data-tier="' + escapeHtml(tier) + '">' +
      '<div class="img-wrapper">' +
      '<a href="' + pinUrl + '" target="_blank" class="pinterest-save-btn">Save</a>' +
      '<img src="' + escapeHtml(image) + '" class="' + imageClass + '" alt="' + escapeHtml(alt) + '" loading="lazy">' +
      "</div>" +
      '<div class="' + medalClass + '">' + escapeHtml(badge) + "</div>" +
      '<span class="tier-badge ' + escapeHtml(tier) + '">' + escapeHtml(getTierLabel(tier)) + "</span>" +
      '<div class="title-wrapper">' +
      '<h4 class="part-title"' + titleStyle + ">" + escapeHtml(name) + "</h4>" +
      '<a href="#' + escapeHtml(product.id || "") + '" class="copy-link-icon" title="Right click to copy link">🔗</a>' +
      "</div>" +
      '<p class="part-benefit-note">' + escapeHtml(benefit) + "</p>" +
      '<a href="' + escapeHtml(amazonUrl) + '" target="_blank" class="part-btn"' + buttonStyle + ">" +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1z"/><path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V3h-12v-.5z"/><path d="M14 5H2v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5zM1 4v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4H1z"/></svg>' +
      "View on Amazon</a>" +
      '<p class="trust-inline-note">Affiliate note: we may earn from qualifying purchases.</p>' +
      "</div>"
    );
  }

  function renderSectionProducts(products) {
    var sections = document.querySelectorAll("[data-dynamic-section]");
    if (!sections.length) return;
    sections.forEach(function(grid) {
      var sectionId = grid.getAttribute("data-dynamic-section");
      var html = (products || [])
        .filter(function(product) {
          return Boolean(product.active) && product.section === sectionId;
        })
        .sort(function(a, b) {
          return (b.priority || 0) - (a.priority || 0);
        })
        .map(renderProductCard)
        .join("");
      if (html) {
        grid.innerHTML = html;
      }
    });
  }

  function syncStaticCardTiers(data) {
    var products = (data && data.products) || [];
    if (!products.length) return;
    var byId = {};
    products.forEach(function(product) {
      if (product && product.id) byId[product.id] = product;
    });

    var cards = document.querySelectorAll(".setup-content-grid .part-card[id]");
    cards.forEach(function(card) {
      var productId = card.getAttribute("id");
      var matched = byId[productId];
      if (!matched) return;
      var tier = getTier(matched);
      var category = matched.category || "gear";
      card.setAttribute("data-tier", tier);
      card.setAttribute("data-category", category);
    });
  }

  function renderCategoryLibrary(data) {
    var tabsWrap = document.getElementById("categoryTabs");
    var grid = document.getElementById("categoryProductsGrid");
    if (!tabsWrap || !grid) return;

    var categories = data.categories || [];
    var products = (data.products || []).filter(function(product) {
      return Boolean(product.active);
    });
    if (!categories.length || !products.length) return;

    tabsWrap.innerHTML = categories
      .map(function(cat, idx) {
        return (
          '<button type="button" class="catalog-tab' +
          (idx === 0 ? " active" : "") +
          '" data-category-id="' +
          escapeHtml(cat.id) +
          '">' +
          escapeHtml(cat.label) +
          "</button>"
        );
      })
      .join("");

    function draw(categoryId) {
      var html = products
        .filter(function(product) {
          return product.category === categoryId;
        })
        .sort(function(a, b) {
          return (b.priority || 0) - (a.priority || 0);
        })
        .map(function(product) {
          var tier = getTier(product);
          return (
            '<article class="pick-card" data-tier="' + escapeHtml(tier) + '">' +
            '<span class="pick-label">' + escapeHtml(product.section === "stealth-operator" ? "Stealth" : "Zen") + "</span>" +
            '<span class="tier-badge ' + escapeHtml(tier) + '">' + escapeHtml(getTierLabel(tier)) + "</span>" +
            '<p class="pick-name">' + escapeHtml(product.name || "") + "</p>" +
            '<p class="pick-note">' + escapeHtml(product.benefit || "Smart value pick.") + "</p>" +
            '<a class="pick-link" href="#' + escapeHtml(product.id) + '">View Product</a>' +
            "</article>"
          );
        })
        .join("");
      grid.innerHTML = html || '<p class="pick-note">No active products in this category yet.</p>';
      if (typeof window.__svReapplyTierFilter === "function") {
        window.__svReapplyTierFilter();
      }
    }

    draw(categories[0].id);

    tabsWrap.addEventListener("click", function(e) {
      var tab = e.target.closest(".catalog-tab");
      if (!tab) return;
      tabsWrap.querySelectorAll(".catalog-tab").forEach(function(btn) {
        btn.classList.remove("active");
      });
      tab.classList.add("active");
      draw(tab.getAttribute("data-category-id"));
    });
  }

  function renderTierFilters(products) {
    var chips = document.getElementById("tierFilterChips");
    if (!chips) return;
    var options = [
      { id: "all", label: "All Tiers" },
      { id: "entry", label: "Entry Tier" },
      { id: "mid", label: "Mid Tier" },
      { id: "premium", label: "Premium Tier" }
    ];
    chips.innerHTML = options
      .map(function(opt, idx) {
        return '<button type="button" class="tier-chip' + (idx === 0 ? " active" : "") + '" data-tier-filter="' + opt.id + '">' + opt.label + "</button>";
      })
      .join("");

    var currentTier = "all";

    function applyTierFilter(tier) {
      if (typeof tier === "string") {
        currentTier = tier;
      }
      var filterTier = currentTier;
      var cards = document.querySelectorAll(
        ".setup-content-grid .part-card[data-tier], " +
          "#categoryProductsGrid .pick-card[data-tier], " +
          "#categorySpotlightGrid .spotlight-card[data-tier], " +
          "#topPicksGrid .pick-card[data-tier]"
      );
      cards.forEach(function(card) {
        var cardTier = card.getAttribute("data-tier") || "entry";
        var visible = filterTier === "all" || cardTier === filterTier;
        card.style.display = visible ? "" : "none";
      });
    }

    window.__svReapplyTierFilter = function() {
      applyTierFilter();
    };

    applyTierFilter("all");
    chips.addEventListener("click", function(e) {
      var btn = e.target.closest(".tier-chip");
      if (!btn) return;
      var tier = btn.getAttribute("data-tier-filter") || "all";
      chips.querySelectorAll(".tier-chip").forEach(function(item) {
        item.classList.remove("active");
      });
      btn.classList.add("active");
      applyTierFilter(tier);
    });
  }

  function renderCategorySpotlights(data) {
    var wrap = document.getElementById("categorySpotlightGrid");
    if (!wrap) return;
    var categories = data.categories || [];
    var products = (data.products || []).filter(function(product) {
      return Boolean(product.active);
    });
    if (!categories.length || !products.length) {
      wrap.innerHTML = "";
      return;
    }
    var html = categories
      .map(function(category) {
        var best = products
          .filter(function(product) {
            return product.category === category.id;
          })
          .sort(function(a, b) {
            return (b.priority || 0) - (a.priority || 0);
          })[0];
        if (!best) return "";
        var tier = getTier(best);
        return (
          '<article class="spotlight-card" data-tier="' + escapeHtml(tier) + '">' +
          '<span class="spotlight-kicker">' + escapeHtml(category.label) + " • " + escapeHtml(tier) + " tier</span>" +
          '<span class="tier-badge ' + escapeHtml(tier) + '">' + escapeHtml(getTierLabel(tier)) + "</span>" +
          '<p class="pick-name">' + escapeHtml(best.name) + "</p>" +
          '<p class="pick-note">' + escapeHtml(best.benefit || "Top value pick in this category.") + "</p>" +
          '<a class="pick-link" href="#' + escapeHtml(best.id) + '">View Product</a>' +
          "</article>"
        );
      })
      .join("");
    wrap.innerHTML = html || '<p class="pick-note">Category highlights will appear as products grow.</p>';
  }

  function renderTopPicks(topPicks, products) {
    var grid = document.getElementById("topPicksGrid");
    if (!grid || !Array.isArray(topPicks) || topPicks.length === 0) {
      return;
    }

    var byId = {};
    (products || []).forEach(function(p) {
      if (p && p.id) byId[p.id] = p;
    });

    var html = topPicks
      .slice(0, 3)
      .map(function(pick) {
        var linked = pick && pick.id ? byId[pick.id] : null;
        var tier = linked ? getTier(linked) : "entry";
        return (
          '<article class="pick-card" data-tier="' + escapeHtml(tier) + '">' +
          '<span class="pick-label">' + escapeHtml(pick.label || "Top Pick") + "</span>" +
          '<p class="pick-name">' + escapeHtml(pick.name || "Curated product") + "</p>" +
          '<p class="pick-note">' + escapeHtml(pick.note || "Selected for practical daily value.") + "</p>" +
          '<a class="pick-link" href="' + escapeHtml(pick.anchor || "#") + '">View Pick</a>' +
          "</article>"
        );
      })
      .join("");

    grid.innerHTML = html;
  }

  function exposeProductStore(data) {
    window.SiteProductData = {
      meta: data.meta || {},
      topPicks: data.topPicks || [],
      products: data.products || [],
      getActiveProducts: function() {
        return (data.products || []).filter(function(product) {
          return Boolean(product.active);
        });
      },
      getProductsBySection: function(sectionId) {
        return (data.products || []).filter(function(product) {
          return product.section === sectionId && Boolean(product.active);
        });
      }
    };
  }

  function loadProductsData() {
    fetch("data/products.json", { cache: "no-store" })
      .then(function(response) {
        if (!response.ok) {
          throw new Error("products.json could not be loaded");
        }
        return response.json();
      })
      .then(function(data) {
        exposeProductStore(data || {});
        renderTopPicks((data && data.topPicks) || [], (data && data.products) || []);
        renderSectionProducts((data && data.products) || []);
        syncStaticCardTiers(data || {});
        renderCategorySpotlights(data || {});
        renderCategoryLibrary(data || {});
        renderTierFilters((data && data.products) || []);
        if (typeof window.__svReapplyTierFilter === "function") {
          window.__svReapplyTierFilter();
        }
        var badge = document.getElementById("siteVersionBadge");
        if (badge) {
          var dataVersion = data && data.meta && data.meta.version ? data.meta.version : "-";
          var freshness = "LATEST";
          if (data && data.meta && data.meta.updatedAt) {
            var updatedTs = Date.parse(String(data.meta.updatedAt));
            if (!Number.isNaN(updatedTs)) {
              var ageHours = (Date.now() - updatedTs) / (1000 * 60 * 60);
              if (ageHours <= 48) {
                freshness = "UPDATED RECENTLY";
              }
            }
          }
          badge.textContent = "◈" + SITE_VERSION + " · ⬢" + dataVersion + " · " + freshness;
        }
      })
      .catch(function(error) {
        window.SiteProductData = {
          meta: {},
          topPicks: [],
          products: []
        };
        console.warn("Using fallback top picks:", error.message);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProductsData);
  } else {
    loadProductsData();
  }
})();
