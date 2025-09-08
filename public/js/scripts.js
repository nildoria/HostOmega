/* ========= Tiny helpers ========= */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);
const raf = (fn) => requestAnimationFrame(fn);

/* ========= 1) Star field + meteors + pricing glow ========= */
(() => {
  try {
    // Star field
    const container = document.getElementById("bannerStar");
    if (container) {
      const rect = container.getBoundingClientRect();
      const W = rect.width || window.innerWidth;
      const H = rect.height || window.innerHeight;
      const frag = document.createDocumentFragment();

      for (let i = 0; i < 1000; i++) {
        const star = document.createElement("div");
        star.className = "banner_star";
        const duration = (Math.random() * 5 + 5).toFixed(2);
        const delay = (Math.random() * 1 + 1).toFixed(2);
        const topPx = Math.random() * H;
        const leftPx = Math.random() * W;
        star.style.position = "absolute";
        star.style.top = `${topPx}px`;
        star.style.left = `${leftPx}px`;
        star.style.animation = `twinkle ${duration}s linear ${delay}s infinite`;
        frag.appendChild(star);
      }
      container.appendChild(frag);
    }

    // Meteors (safe: only attach if .meteor exists)
    $$(".meteor").forEach((m) => {
      on(m, "animationend", (e) => {
        e.target.className = "";
        setTimeout(() => (e.target.className = "meteor"), 0);
      });
    });

    // Pricing Table Border (glow follow)
    const SELECTOR = ".hostomega-pricing-table .card-item";
    const BOUND = new WeakSet();

    const ensureGlow = (el) => {
      if (!el.querySelector(":scope > .glow")) {
        const glow = document.createElement("div");
        glow.className = "glow";
        el.prepend(glow);
      }
    };

    const bind = (el) => {
      if (!el || BOUND.has(el)) return;
      BOUND.add(el);
      ensureGlow(el);
      let rId = 0;
      const onMove = (e) => {
        cancelAnimationFrame(rId);
        rId = raf(() => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          let angle = Math.atan2(y, x) * (180 / Math.PI);
          angle = (angle + 360) % 360;
          el.style.setProperty("--start", angle + 60);
        });
      };
      on(el, "mousemove", onMove, { passive: true });
      on(el, "mouseleave", () => el.style.removeProperty("--start"), { passive: true });
    };

    const initGlow = (root = document) => $$(SELECTOR, root).forEach(bind);

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => initGlow());
    } else {
      initGlow();
    }

    const mo = new MutationObserver((muts) => {
      for (const m of muts) {
        m.addedNodes &&
          m.addedNodes.forEach((n) => {
            if (!(n instanceof Element)) return;
            if (n.matches && n.matches(SELECTOR)) bind(n);
            if (n.querySelectorAll) initGlow(n);
          });
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (err) {
    console.warn("[star+meteors+glow] skipped:", err);
  }
})();

/* ========= 2) TLD chips carousel (exactly 6 visible) ========= */
(() => {
  try {
    const chips = document.getElementById("tldChips");
    if (!chips) return;

    const wrap = chips.parentElement;
    if (wrap) wrap.style.overflow = "hidden";

    const prev = document.getElementById("chipsPrev");
    const next = document.getElementById("chipsNext");

    const widthOfFirst = (n) => {
      const items = $(":scope > *", chips) ? $$(".tld-chip, :scope > *", chips) : Array.from(chips.children);
      const count = Math.min(n, items.length);
      if (!count) return 0;
      const cs = getComputedStyle(chips);
      const gap = parseFloat(cs.columnGap || cs.gap || 0);
      let w = 0;
      for (let i = 0; i < count; i++) w += items[i].offsetWidth;
      w += gap * (count - 1);
      return Math.round(w);
    };

    const sizeViewportToSix = () => {
      const sixWidth = widthOfFirst(6);
      const max = wrap ? wrap.clientWidth : sixWidth;
      chips.style.width = Math.min(sixWidth, max) + "px";
    };

    const stepSize = () => chips.clientWidth || widthOfFirst(6);

    const updateArrows = () => {
      const max = chips.scrollWidth - chips.clientWidth - 1;
      if (prev) prev.disabled = chips.scrollLeft <= 0;
      if (next) next.disabled = chips.scrollLeft >= max;
    };

    on(next, "click", () => chips.scrollBy({ left: stepSize(), behavior: "smooth" }));
    on(prev, "click", () => chips.scrollBy({ left: -stepSize(), behavior: "smooth" }));

    let dragging = false, startX = 0, startLeft = 0;
    on(chips, "pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startLeft = chips.scrollLeft;
      chips.setPointerCapture(e.pointerId);
    });
    on(chips, "pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      chips.scrollLeft = startLeft - dx;
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((t) =>
      on(chips, t, () => (dragging = false))
    );

    on(chips, "scroll", updateArrows);
    on(window, "resize", () => {
      const oldStep = stepSize();
      sizeViewportToSix();
      const newStep = stepSize();
      const page = Math.round(chips.scrollLeft / (oldStep || 1));
      chips.scrollLeft = page * newStep;
      updateArrows();
    });

    (document.fonts?.ready || Promise.resolve()).then(() => {
      raf(() => {
        sizeViewportToSix();
        updateArrows();
      });
    });
  } catch (err) {
    console.warn("[tld chips carousel] skipped:", err);
  }
})();

/* ========= 3) TLD dropdown + domain submit ========= */
(() => {
  try {
    const tldBtn     = document.getElementById("tldBtn");
    const tldMenu    = document.getElementById("tldMenu");
    const tldCurrent = document.getElementById("tldCurrent");
    const domainInp  = document.getElementById("domain");
    const submitBtn  = document.getElementById("domainSubmit");

    if (!(tldBtn || tldMenu || tldCurrent || domainInp || submitBtn)) return;

    const isMenuOpen = () => tldMenu?.dataset.open === "true";
    const toggleMenu = (open) => {
      if (!tldMenu || !tldBtn) return;
      tldMenu.dataset.open = String(open);
      tldBtn.setAttribute("aria-expanded", String(open));
    };

    on(tldBtn, "click", (e) => {
      e.stopPropagation();
      toggleMenu(!isMenuOpen());
    });

    on(tldMenu, "click", (e) => {
      const li = e.target.closest(".tld-item");
      if (!li || !tldCurrent) return;
      const ext = li.dataset.ext || li.textContent.trim();
      tldCurrent.textContent = ext;
      toggleMenu(false);
      domainInp?.focus();
    });

    on(document, "click", (e) => {
      if (!tldMenu || !isMenuOpen()) return;
      const inMenu = e.target.closest("#tldMenu");
      const inBtn  = e.target.closest("#tldBtn");
      if (!inMenu && !inBtn) toggleMenu(false);
    });

    on(document, "keydown", (e) => {
      if (e.key === "Escape") toggleMenu(false);
      if (e.key === "Enter" && document.activeElement === domainInp) {
        e.preventDefault();
        submitBtn?.click();
      }
    });

    on(submitBtn, "click", () => {
      const name = (domainInp?.value || "").trim().replace(/^\.+/, "").replace(/\s+/g, "");
      const ext  = (tldCurrent?.textContent || "").trim();
      const query = name ? name + ext : ext;
      console.log("Search domain:", query);
      // TODO: replace with real request
    });
  } catch (err) {
    console.warn("[tld dropdown] skipped:", err);
  }
})();

/* ========= 4) Chips quick-scroll arrow (independent) ========= */
(() => {
  try {
    const chipsNext = document.getElementById("chipsNext");
    const tldChips  = document.getElementById("tldChips");
    if (!chipsNext || !tldChips) return;
    on(chipsNext, "click", () => {
      const step = Math.max(220, Math.floor(tldChips.clientWidth * 0.85));
      tldChips.scrollBy({ left: step, behavior: "smooth" });
    });
  } catch (err) {
    console.warn("[chips quick scroll] skipped:", err);
  }
})();

/* ========= 5) Pricing toggle (monthly/yearly) ========= */
(() => {
  try {
    const monthlyBtn = document.getElementById("monthlyBtn");
    const yearlyBtn  = document.getElementById("yearlyBtn");
    const prices     = $$("[data-monthly]");

    if (!(monthlyBtn && yearlyBtn && prices.length)) return;

    const showMonthly = () => {
      monthlyBtn.classList.add("bg-green-500", "text-white");
      monthlyBtn.classList.remove("text-black");
      yearlyBtn.classList.remove("bg-green-500", "text-white");
      yearlyBtn.classList.add("text-blue-600");
      prices.forEach((p) => (p.textContent = p.dataset.monthly));
      monthlyBtn.setAttribute("aria-pressed", "true");
      yearlyBtn.setAttribute("aria-pressed", "false");
    };

    const showYearly = () => {
      yearlyBtn.classList.add("bg-green-500", "text-white");
      yearlyBtn.classList.remove("text-blue-600");
      monthlyBtn.classList.remove("bg-green-500", "text-white");
      monthlyBtn.classList.add("text-black");
      prices.forEach((p) => (p.textContent = p.dataset.yearly));
      yearlyBtn.setAttribute("aria-pressed", "true");
      monthlyBtn.setAttribute("aria-pressed", "false");
    };

    on(monthlyBtn, "click", showMonthly);
    on(yearlyBtn, "click", showYearly);

    // default state
    showMonthly();
  } catch (err) {
    console.warn("[pricing toggle] skipped:", err);
  }
})();

/* ========= 6) Intersection reveal (data-reveal) ========= */
(() => {
  try {
    const targets = $$("[data-reveal]");
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("animate-fade-up");
            const d = e.target.getAttribute("data-delay");
            if (d) e.target.style.animationDelay = `${d}ms`;
            e.target.style.willChange = "transform, opacity";
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    targets.forEach((el) => {
      el.classList.add("opacity-0", "translate-y-4");
      io.observe(el);
    });
  } catch (err) {
    console.warn("[reveal] skipped:", err);
  }
})();

/* ========= 7) Footer year ========= */
(() => {
  try {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  } catch (err) {
    console.warn("[year] skipped:", err);
  }
})();

/* ========= 8) Sticky header on scroll ========= */
(() => {
  try {
    const header = document.getElementById("site-header");
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 100) {
        header.classList.add("bg-black", "shadow-md");
        header.classList.remove("bg-transparent");
      } else {
        header.classList.remove("bg-black", "shadow-md");
        header.classList.add("bg-transparent");
      }
    };
    on(window, "scroll", onScroll, { passive: true });
    onScroll();
  } catch (err) {
    console.warn("[sticky header] skipped:", err);
  }
})();

