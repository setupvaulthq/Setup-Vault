(function() {
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function renderTopPicks(topPicks) {
    var grid = document.getElementById("topPicksGrid");
    if (!grid || !Array.isArray(topPicks) || topPicks.length === 0) {
      return;
    }

    var html = topPicks
      .slice(0, 3)
      .map(function(pick) {
        return (
          '<article class="pick-card">' +
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
        renderTopPicks((data && data.topPicks) || []);
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
