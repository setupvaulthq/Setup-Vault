(function() {
  var SITE_VERSION = "3.2";
  var SITE_MEDIA_ORIGIN = "https://www.setupvaulthq.com";
  var AMAZON_PART_BTN_LABEL = "Check Current Price on Amazon";
  var AMAZON_PART_BTN_LABEL_COMPACT = "See Amazon Discount";

  function resolveSiteAssetUrl(path) {
    if (!path) return "";
    var p = String(path).trim();
    if (/^https?:\/\//i.test(p)) return p;
    if (p.indexOf("//") === 0) return "https:" + p;
    var normalized = p.indexOf("/") === 0 ? p : "/" + p;
    var base = SITE_MEDIA_ORIGIN + normalized.replace(/\/{2,}/g, "/");
    var sep = base.indexOf("?") >= 0 ? "&" : "?";
    return base + sep + "v=" + encodeURIComponent(SITE_VERSION);
  }

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

  function getProductPageFilename(sectionId) {
    if (sectionId === "stealth-operator") return "stealth.html";
    if (sectionId === "vault-noir") return "noir.html";
    if (sectionId === "gear-library") return "gear.html";
    return "zen.html";
  }

  function getProductDeepLink(product) {
    if (!product) return "#";
    var sectionId = product.section || "zen-workspace";
    if (sectionId === "gear-library") {
      var amz = String(product.amazonUrl || "").trim();
      if (amz) return amz;
      var gid = product.id ? String(product.id) : "";
      return "gear.html#" + gid;
    }
    var id = product.id ? String(product.id) : "";
    return getProductPageFilename(sectionId) + "#" + id;
  }

  function renderViewProductAnchor(product) {
    var href = getProductDeepLink(product);
    var safe = escapeHtml(href);
    var isExternal = /^https?:\/\//i.test(href || "");
    var attrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : "";
    var label =
      product && product.section === "gear-library" && isExternal
        ? "View on Amazon"
        : "View Product";
    return '<a class="pick-link" href="' + safe + '"' + attrs + ">" + label + "</a>";
  }

  function isStandaloneCatalogProduct(product) {
    return Boolean(product && product.section === "gear-library");
  }

  function getProductSharePageUrl(product) {
    if (!product || !product.id) return SITE_MEDIA_ORIGIN + "/gear.html";
    var sectionId = product.section || "zen-workspace";
    return (
      SITE_MEDIA_ORIGIN +
      "/" +
      getProductPageFilename(sectionId) +
      "#" +
      encodeURIComponent(String(product.id))
    );
  }

  function buildPinterestUrlForProduct(product) {
    var pinPage = getProductSharePageUrl(product);
    var pinterestMedia = (product && (product.pinterestMedia || product.image)) || "";
    var name = (product && product.name) || "Setup Vault";
    return (
      "https://pinterest.com/pin/create/button/?url=" +
      encodeURIComponent(pinPage) +
      "&media=" +
      encodeURIComponent(resolveSiteAssetUrl(pinterestMedia)) +
      "&description=" +
      encodeURIComponent(name + " - Setup Vault")
    );
  }

  function isGearLibraryHtmlPage() {
    var p = window.location.pathname || "";
    return /(^|\/)gear\.html$/i.test(p);
  }

  function getWindowHashProductId() {
    var hashRaw =
      typeof window.location.hash === "string" && window.location.hash.length > 1
        ? window.location.hash.slice(1)
        : "";
    if (!hashRaw) return "";
    try {
      return decodeURIComponent(hashRaw);
    } catch (e1) {
      return hashRaw;
    }
  }

  /** gear.html?cat=…#id → index.html#id for standalone catalog cards (home Gear Library). */
  function maybeRedirectGearCatalogHashToHome(data) {
    if (!isGearLibraryHtmlPage()) return false;
    var hashId = getWindowHashProductId();
    if (!hashId) return false;
    var products = (data && data.products) || [];
    var found = products.find(function(p) {
      return p && p.id === hashId && p.active && p.section === "gear-library";
    });
    if (!found) return false;
    window.location.replace("index.html#" + encodeURIComponent(hashId));
    return true;
  }

  function standaloneGearAnchorHref(product, withCatQuery) {
    var id = product && product.id ? String(product.id) : "";
    if (!id) return "#";
    var encId = encodeURIComponent(id);
    if (withCatQuery && product.category) {
      return (
        "gear.html?cat=" +
        encodeURIComponent(String(product.category)) +
        "#" +
        encId
      );
    }
    return "gear.html#" + encId;
  }

  function renderGearCatalogCta(product) {
    if (!isStandaloneCatalogProduct(product) || !product.id) {
      return renderViewProductAnchor(product);
    }
    var href = standaloneGearAnchorHref(product, true);
    return (
      '<a class="pick-link" href="' +
      escapeHtml(href) +
      '">View in Gear Library</a>'
    );
  }

  function isStealthSection(sectionId) {
    return sectionId === "stealth-operator" || sectionId === "vault-noir";
  }

  function pickLabelForSection(sectionId) {
    if (sectionId === "stealth-operator") return "Stealth";
    if (sectionId === "vault-noir") return "Noir";
    if (sectionId === "gear-library") return "Gear";
    return "Zen";
  }

  function getCardClassForSection(sectionId) {
    return isStealthSection(sectionId) ? "part-card stealth-card" : "part-card";
  }

  function getImageClassForSection(sectionId) {
    return isStealthSection(sectionId) ? "stealth-part-image" : "part-image";
  }

  function getMedalClassForSection(sectionId) {
    return isStealthSection(sectionId) ? "medal-badge medal-dark" : "medal-badge";
  }

  function renderProductCard(product, options) {
    options = options || {};
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
    var medalClass = getMedalClassForSection(sectionId);
    var imgW = product.imageWidth != null ? Number(product.imageWidth) : 240;
    var imgH = product.imageHeight != null ? Number(product.imageHeight) : 160;
    var pinPage =
      SITE_MEDIA_ORIGIN + "/" + getProductPageFilename(sectionId) + "#" + encodeURIComponent(product.id || "");
    var copyHref =
      sectionId === "gear-library"
        ? standaloneGearAnchorHref(product, true)
        : "#" + escapeHtml(product.id || "");
    var pinUrl =
      "https://pinterest.com/pin/create/button/?url=" +
      encodeURIComponent(pinPage) +
      "&media=" +
      encodeURIComponent(resolveSiteAssetUrl(pinterestMedia || "")) +
      "&description=" +
      encodeURIComponent((name || "") + " - Setup Vault");
    var imageSrc = resolveSiteAssetUrl(image);

    return (
      '<div class="' + cardClass + '" id="' + escapeHtml(product.id || "") + '" data-category="' + escapeHtml(category) + '" data-tier="' + escapeHtml(tier) + '">' +
      '<div class="img-wrapper">' +
      '<a href="' + pinUrl + '" target="_blank" class="pinterest-save-btn">Save</a>' +
      '<img src="' + escapeHtml(imageSrc) + '" class="' + imageClass + '" alt="' + escapeHtml(alt) + '" width="' + imgW + '" height="' + imgH + '" loading="lazy">' +
      "</div>" +
      '<div class="' + medalClass + '">' + escapeHtml(badge) + "</div>" +
      '<span class="tier-badge ' + escapeHtml(tier) + '">' + escapeHtml(getTierLabel(tier)) + "</span>" +
      '<div class="title-wrapper">' +
      '<h4 class="part-title">' + escapeHtml(name) + "</h4>" +
      '<a href="' +
      escapeHtml(copyHref) +
      '" class="copy-link-icon" title="Right click to copy link">🔗</a>' +
      "</div>" +
      '<p class="part-benefit-note">' + escapeHtml(benefit) + "</p>" +
      '<a href="' + escapeHtml(amazonUrl) + '" target="_blank" class="part-btn">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11 5.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-1z"/><path d="M2 2.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V3h-12v-.5z"/><path d="M14 5H2v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5zM1 4v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4H1z"/></svg>' +
      escapeHtml(options.compactCta ? AMAZON_PART_BTN_LABEL_COMPACT : AMAZON_PART_BTN_LABEL) + "</a>" +
      '<p class="trust-inline-note">Affiliate note: we may earn from qualifying purchases.</p>' +
      "</div>"
    );
  }

  function parseCategoryFilterFromGrid(grid) {
    var excludeRaw = grid.getAttribute("data-category-exclude") || "";
    var onlyRaw = grid.getAttribute("data-category-only") || "";
    return {
      exclude: excludeRaw
        .split(",")
        .map(function(s) {
          return s.trim();
        })
        .filter(Boolean),
      only: onlyRaw
        .split(",")
        .map(function(s) {
          return s.trim();
        })
        .filter(Boolean)
    };
  }

  function productMatchesCategoryFilter(product, filter) {
    var cat = (product && product.category) || "";
    if (filter.only.length && filter.only.indexOf(cat) < 0) return false;
    if (filter.exclude.length && filter.exclude.indexOf(cat) >= 0) return false;
    return true;
  }

  function applyVaultNoirState(products) {
    var hasNoir = (products || []).some(function(product) {
      return product && product.active && product.section === "vault-noir";
    });
    var comingSoonNodes = document.querySelectorAll("[data-noir-coming-soon]");
    var productsWrapNodes = document.querySelectorAll("[data-noir-products-wrap]");
    comingSoonNodes.forEach(function(el) {
      el.style.display = hasNoir ? "none" : "";
    });
    productsWrapNodes.forEach(function(el) {
      if (hasNoir) {
        el.removeAttribute("hidden");
        el.style.display = "";
      } else {
        el.setAttribute("hidden", "");
      }
    });
  }

  function renderBuildUnitCard(product, internals) {
    var sectionId = product.section || "";
    var isNoir = sectionId === "vault-noir";
    var isStealth = sectionId === "stealth-operator";
    var palette = isNoir
      ? {
          card: "background-color: var(--noir-secondary); border: 1px solid var(--noir-border);",
          summary:
            "background-color: var(--noir-dominant); color: var(--noir-heading); border: 1px solid var(--noir-btn-border); padding: 15px; font-size: 16px; cursor: pointer;",
          medalCls: "medal-badge medal-dark",
          medalStyle: "background: var(--noir-dominant); color: var(--noir-accent); border-color: var(--noir-border);",
          title: "color: var(--noir-heading); font-size: 20px;",
          desc: "color: var(--noir-text-muted); font-size: 14px; margin-bottom: 16px;"
        }
      : isStealth
      ? {
          card: "background-color: var(--dark-secondary); border-color: var(--dark-border);",
          summary:
            "background-color: var(--dark-dominant); color: var(--color-accent-contrast); border: 1px solid var(--dark-btn-border); padding: 15px; font-size: 16px; cursor: pointer;",
          medalCls: "medal-badge medal-dark",
          medalStyle: "",
          title: "color: var(--color-accent-contrast); font-size: 20px;",
          desc: "color: var(--dark-text-muted); font-size: 14px; margin-bottom: 20px;"
        }
      : {
          card: "",
          summary: "padding: 15px; font-size: 16px; cursor: pointer;",
          medalCls: "medal-badge",
          medalStyle: "",
          title: "font-size: 20px;",
          desc: "font-size: 14px; margin-bottom: 16px;"
        };

    var rawImage = (product && product.image) || "";
    var imgSrc = resolveSiteAssetUrl(rawImage);
    var hasHeroImage = Boolean(String(rawImage).trim());
    var name = product.name || "Assembled PC Build";
    var desc = product.benefit || "Tap the photo to expand the internal parts.";
    var badgeText = product.badge || "PC Build";
    var detailsId = "buildUnit_" + (product.id || Math.random().toString(36).slice(2));
    var partsHtml = (internals || [])
      .map(function(p) {
        return renderProductCard(p, { compactCta: true });
      })
      .join("");
    var partsCount = (internals || []).length;
    var summaryLabel =
      partsCount > 0
        ? "🔍 View PC Build Parts (" + partsCount + " items)"
        : "🔍 View PC Build Parts (waiting for items)";
    var emptyHint =
      partsCount > 0
        ? ""
        : '<p class="build-desc" style="margin: 16px 0 0; font-size: 12px; color: ' +
          (isNoir
            ? "var(--noir-text-muted)"
            : isStealth
            ? "var(--dark-text-muted)"
            : "var(--text-muted)") +
          ';">Add products with section <strong>' +
          escapeHtml(sectionId || "this build") +
          "</strong> + category <strong>pc-component</strong> in Admin to populate the drawer.</p>";

    var toggleDetails =
      "var d=document.getElementById('" +
      detailsId +
      "'); if(d) d.open = !d.open;";
    var heroVisual = hasHeroImage
      ? '<img src="' +
        escapeHtml(imgSrc) +
        '" class="case-assembled-image" alt="' +
        escapeHtml(product.alt || name) +
        '" loading="lazy" decoding="async" onclick="' +
        toggleDetails +
        '">'
      : '<div class="case-assembled-coming-soon" role="img" aria-label="Coming soon" onclick="' +
        toggleDetails +
        '"><span class="case-assembled-coming-soon-label">Coming Soon</span></div>';

    return (
      '<div class="part-card case-unit-card" id="' +
      escapeHtml(product.id || "") +
      '" style="grid-column: 1 / -1; ' +
      palette.card +
      '">' +
      heroVisual +
      '<div class="case-unit-details">' +
      '<div class="' +
      palette.medalCls +
      '"' +
      (palette.medalStyle ? ' style="' + palette.medalStyle + '"' : "") +
      ">" +
      escapeHtml(badgeText) +
      "</div>" +
      '<h4 class="part-title" style="' +
      palette.title +
      '">' +
      escapeHtml(name) +
      "</h4>" +
      '<p class="build-desc" style="' +
      palette.desc +
      '">' +
      escapeHtml(desc) +
      "</p>" +
      '<details class="case-internals-accordion" id="' +
      detailsId +
      '">' +
      '<summary style="' +
      palette.summary +
      '">' +
      summaryLabel +
      "</summary>" +
      '<div class="case-parts-grid" style="margin-top: 20px;">' +
      partsHtml +
      "</div>" +
      "</details>" +
      emptyHint +
      "</div>" +
      "</div>"
    );
  }

  function renderSectionProducts(products) {
    var sections = document.querySelectorAll("[data-dynamic-section]");
    if (!sections.length) return;
    var all = products || [];
    sections.forEach(function(grid) {
      var sectionId = grid.getAttribute("data-dynamic-section");
      var catFilter = parseCategoryFilterFromGrid(grid);
      var includeBuildUnits = catFilter.only.indexOf("pc-component") < 0;
      var sectionProducts = all.filter(function(p) {
        return Boolean(p && p.active) && p.section === sectionId;
      });
      var pieces = sectionProducts
        .filter(function(p) {
          if (p.isBuildUnit) return includeBuildUnits;
          return productMatchesCategoryFilter(p, catFilter);
        })
        .sort(function(a, b) {
          var aBuild = a.isBuildUnit ? 1 : 0;
          var bBuild = b.isBuildUnit ? 1 : 0;
          if (aBuild !== bBuild) return aBuild - bBuild;
          return (b.priority || 0) - (a.priority || 0);
        })
        .map(function(p) {
          if (p.isBuildUnit) {
            var internals = sectionProducts
              .filter(function(x) {
                return x && x.category === "pc-component";
              })
              .sort(function(a, b) {
                return (b.priority || 0) - (a.priority || 0);
              });
            return renderBuildUnitCard(p, internals);
          }
          return renderProductCard(p);
        });
      grid.innerHTML = pieces.join("");
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
          var thumbClass =
            isStealthSection(product.section) ? "pick-thumb pick-thumb--stealth" : "pick-thumb";
          var thumbSrc = resolveSiteAssetUrl(product.image || "");
          var thumbImg = thumbSrc
            ? '<img src="' +
              escapeHtml(thumbSrc) +
              '" class="' +
              thumbClass +
              '" alt="' +
              escapeHtml(product.alt || product.name || "") +
              '" width="240" height="160" loading="lazy">'
            : "";
          var thumb;
          if (isStandaloneCatalogProduct(product)) {
            var pinGear = buildPinterestUrlForProduct(product);
            thumb =
              '<div class="pick-thumb-wrap pick-thumb-wrap--standalone">' +
              '<a href="' +
              escapeHtml(pinGear) +
              '" target="_blank" rel="noopener noreferrer" class="pinterest-save-btn">Save</a>' +
              thumbImg +
              "</div>";
          } else {
            thumb = '<div class="pick-thumb-wrap">' + thumbImg + "</div>";
          }
          var titleRow = isStandaloneCatalogProduct(product)
            ? '<div class="pick-title-row">' +
              '<p class="pick-name">' +
              escapeHtml(product.name || "") +
              "</p>" +
              '<a href="' +
              standaloneGearAnchorHref(product, true) +
              '" class="copy-link-icon" title="Sağ tıkla bağlantıyı kopyala">🔗</a>' +
              "</div>"
            : '<p class="pick-name">' + escapeHtml(product.name || "") + "</p>";
          var cardId =
            isStandaloneCatalogProduct(product) && product.id
              ? ' id="' + escapeHtml(product.id) + '"'
              : "";
          return (
            '<article class="pick-card"' +
            cardId +
            ' data-tier="' +
            escapeHtml(tier) +
            '">' +
            thumb +
            '<span class="pick-label">' + escapeHtml(pickLabelForSection(product.section)) + "</span>" +
            '<span class="tier-badge ' + escapeHtml(tier) + '">' + escapeHtml(getTierLabel(tier)) + "</span>" +
            titleRow +
            '<p class="pick-note">' + escapeHtml(product.benefit || "Smart value pick.") + "</p>" +
            renderViewProductAnchor(product) +
            "</article>"
          );
        })
        .join("");
      grid.innerHTML = html || '<p class="pick-note">No active products in this category yet.</p>';
      if (typeof window.__svReapplyTierFilter === "function") {
        window.__svReapplyTierFilter();
      }
    }

    tabsWrap.addEventListener("click", function(e) {
      var tab = e.target.closest(".catalog-tab");
      if (!tab) return;
      tabsWrap.querySelectorAll(".catalog-tab").forEach(function(btn) {
        btn.classList.remove("active");
      });
      tab.classList.add("active");
      draw(tab.getAttribute("data-category-id"));
    });

    var params =
      typeof URLSearchParams !== "undefined" ? new URLSearchParams(window.location.search) : null;
    var catParam = params && params.get("cat");
    var hashRaw =
      typeof window.location.hash === "string" && window.location.hash.length > 1
        ? window.location.hash.slice(1)
        : "";
    var hashId = hashRaw;
    try {
      hashId = decodeURIComponent(hashRaw.replace(/^#/, ""));
    } catch (eHash) {
      hashId = hashRaw.replace(/^#/, "");
    }

    var initialCat = categories[0].id;
    if (catParam && categories.some(function(c) {
      return c.id === catParam;
    })) {
      initialCat = catParam;
    } else if (hashId) {
      var hashProduct = products.find(function(p) {
        return p.id === hashId;
      });
      if (hashProduct && hashProduct.category) {
        initialCat = hashProduct.category;
      }
    }

    tabsWrap.querySelectorAll(".catalog-tab").forEach(function(btn) {
      btn.classList.toggle("active", btn.getAttribute("data-category-id") === initialCat);
    });
    draw(initialCat);

    if (hashId) {
      window.requestAnimationFrame(function() {
        window.requestAnimationFrame(function() {
          var el = document.getElementById(hashId);
          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      });
    }
  }

  function renderGearLibraryHomeSection(data) {
    var mount = document.getElementById("gearLibraryHomeMount");
    if (!mount) return;
    var categories = data.categories || [];
    var products = (data.products || []).filter(function(p) {
      return Boolean(p.active) && p.section === "gear-library";
    });
    if (!products.length) {
      mount.innerHTML =
        '<p class="pick-note">Gear-only picks will appear here as you add them in Admin.</p>';
      return;
    }
    var html = categories
      .map(function(cat) {
        var catProducts = products
          .filter(function(p) {
            return p.category === cat.id;
          })
          .sort(function(a, b) {
            return (b.priority || 0) - (a.priority || 0);
          });
        if (!catProducts.length) return "";
        var cards = catProducts.map(renderProductCard).join("");
        return (
          '<div class="gear-library-category-block" data-category="' +
          escapeHtml(cat.id) +
          '">' +
          '<h3 class="gear-library-cat-title">' +
          escapeHtml(cat.label) +
          "</h3>" +
          '<div class="setup-content-grid gear-library-product-grid">' +
          cards +
          "</div>" +
          "</div>"
        );
      })
      .join("");
    mount.innerHTML = html;
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
          "#vault-noir .case-parts-grid .part-card[data-tier], " +
          "#gearLibraryHomeMount .part-card[data-tier], " +
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

  var SPOTLIGHT_CATEGORY_LIMIT = 6;

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
        var spImg =
          '<img src="' +
          escapeHtml(resolveSiteAssetUrl(best.image || "")) +
          '" class="' +
          (isStealthSection(best.section)
            ? "spotlight-thumb spotlight-thumb--stealth"
            : "spotlight-thumb") +
          '" alt="' +
          escapeHtml(best.alt || best.name || "") +
          '" width="240" height="160" loading="lazy">';
        var spThumb;
        if (isStandaloneCatalogProduct(best)) {
          var pinSpot = buildPinterestUrlForProduct(best);
          spThumb =
            '<div class="spotlight-thumb-wrap spotlight-thumb-wrap--standalone">' +
            '<a href="' +
            escapeHtml(pinSpot) +
            '" target="_blank" rel="noopener noreferrer" class="pinterest-save-btn">Save</a>' +
            spImg +
            "</div>";
        } else {
          spThumb = '<div class="spotlight-thumb-wrap">' + spImg + "</div>";
        }
        var spotTitle = isStandaloneCatalogProduct(best)
          ? '<div class="pick-title-row">' +
            '<p class="pick-name">' +
            escapeHtml(best.name) +
            "</p>" +
            '<a href="' +
            standaloneGearAnchorHref(best, true) +
            '" class="copy-link-icon" title="Sağ tıkla bağlantıyı kopyala">🔗</a>' +
            "</div>"
          : '<p class="pick-name">' + escapeHtml(best.name) + "</p>";
        var spotId = "";
        return (
          '<article class="spotlight-card"' +
          spotId +
          ' data-tier="' +
          escapeHtml(tier) +
          '">' +
          spThumb +
          '<span class="spotlight-kicker">' + escapeHtml(category.label) + " • " + escapeHtml(tier) + " tier</span>" +
          '<span class="tier-badge ' + escapeHtml(tier) + '">' + escapeHtml(getTierLabel(tier)) + "</span>" +
          spotTitle +
          '<p class="pick-note">' + escapeHtml(best.benefit || "Top value pick in this category.") + "</p>" +
          renderGearCatalogCta(best) +
          "</article>"
        );
      })
      .filter(function(chunk) {
        return Boolean(chunk);
      })
      .slice(0, SPOTLIGHT_CATEGORY_LIMIT)
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
        var topThumb = "";
        if (linked && linked.image) {
          var tsrc = resolveSiteAssetUrl(linked.image);
          var tcls =
            isStealthSection(linked.section)
              ? "pick-thumb pick-thumb--stealth"
              : "pick-thumb";
          topThumb =
            '<div class="pick-thumb-wrap">' +
            '<img src="' +
            escapeHtml(tsrc) +
            '" class="' +
            tcls +
            '" alt="' +
            escapeHtml(linked.alt || linked.name || "") +
            '" width="240" height="160" loading="lazy">' +
            "</div>";
        }
        return (
          '<article class="pick-card" data-tier="' + escapeHtml(tier) + '">' +
          topThumb +
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
        if (maybeRedirectGearCatalogHashToHome(data || {})) {
          return;
        }
        exposeProductStore(data || {});
        renderTopPicks((data && data.topPicks) || [], (data && data.products) || []);
        renderSectionProducts((data && data.products) || []);
        applyVaultNoirState((data && data.products) || []);
        renderCategorySpotlights(data || {});
        renderCategoryLibrary(data || {});
        renderTierFilters((data && data.products) || []);
        renderGearLibraryHomeSection(data || {});
        if (typeof window.__svReapplyTierFilter === "function") {
          window.__svReapplyTierFilter();
        }
        function reapplyHashFocus() {
          if (typeof window.__svApplyHashFocus === "function") {
            window.__svApplyHashFocus();
          }
        }
        reapplyHashFocus();
        setTimeout(reapplyHashFocus, 0);
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
