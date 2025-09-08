// Generate star field (vanilla)
(function () {
  const container = document.getElementById("bannerStar");
  if (!container) return;

  // Use container size; fall back to viewport if container isn't sized yet
  const rect = container.getBoundingClientRect();
  const W = rect.width || window.innerWidth;
  const H = rect.height || window.innerHeight;

  const frag = document.createDocumentFragment();

  for (let i = 0; i < 1000; i++) {
    const star = document.createElement("div");
    star.className = "banner_star";

    const duration = (Math.random() * 5 + 5).toFixed(2); // 5–10s
    const delay = (Math.random() * 1 + 1).toFixed(2); // 5–10s
    const topPx = Math.random() * H;
    const leftPx = Math.random() * W;

    star.style.position = "absolute"; // ensure absolute if not in your CSS
    star.style.top = `${topPx}px`;
    star.style.left = `${leftPx}px`;
    star.style.animation = `twinkle ${duration}s linear ${delay}s infinite`;

    frag.appendChild(star);
  }

  container.appendChild(frag);

  // Meteors
  var reset = function (e) {
    e.target.className = "";
    setTimeout(function () {
      e.target.className = "meteor";
    }, 0);
  };
  var meteors = document.querySelectorAll(".meteor");
  for (var i = 0; i < meteors.length; i++) {
    meteors[i].addEventListener("animationend", reset);
  }

  // Pricing Table Border
  const SELECTOR = ".hostomega-pricing-table .card-item";
  const BOUND = new WeakSet();

  function ensureGlow(el) {
    if (!el.querySelector(":scope > .glow")) {
      const glow = document.createElement("div");
      glow.className = "glow";
      el.prepend(glow);
    }
  }

  function bind(el) {
    if (BOUND.has(el)) return;
    BOUND.add(el);

    ensureGlow(el);

    let raf = 0;
    function onMove(e) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        let angle = Math.atan2(y, x) * (180 / Math.PI);
        angle = (angle + 360) % 360;
        el.style.setProperty("--start", angle + 60);
      });
    }

    el.addEventListener("mousemove", onMove, { passive: true });
    el.addEventListener(
      "mouseleave",
      () => {
        el.style.removeProperty("--start");
      },
      { passive: true }
    );
  }

  function init(root = document) {
    root.querySelectorAll(SELECTOR).forEach(bind);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }

  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes &&
        m.addedNodes.forEach((n) => {
          if (!(n instanceof Element)) return;
          if (n.matches && n.matches(SELECTOR)) bind(n);
          if (n.querySelectorAll) init(n);
        });
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();

// === TLD chips carousel: show exactly 6 items ===
(function initTldCarousel() {
  const chips = document.getElementById('tldChips');
  if (!chips) return;

  const prev = document.getElementById('chipsPrev'); // may be null (ok)
  const next = document.getElementById('chipsNext');
  const wrap = chips.parentElement; // viewport container

  // Ensure the viewport clips the track
  wrap.style.overflow = 'hidden';

  // Helper: width of first N chips + gaps
  function widthOfFirst(n) {
    const items = Array.from(chips.children);
    const count = Math.min(n, items.length);
    if (!count) return 0;

    const cs = getComputedStyle(chips);
    const gap = parseFloat(cs.columnGap || cs.gap || 0);

    let w = 0;
    for (let i = 0; i < count; i++) w += items[i].offsetWidth;
    w += gap * (count - 1);
    return Math.round(w);
  }

  // Make the track show exactly 6 chips (unless screen is too small)
  function sizeViewportToSix() {
    const sixWidth = widthOfFirst(6);
    const max = wrap.clientWidth; // available space
    chips.style.width = Math.min(sixWidth, max) + 'px';
  }

  function stepSize() {
    // One "page" = current viewport (i.e., 6 chips)
    return chips.clientWidth || widthOfFirst(6);
  }

  function updateArrows() {
    const max = chips.scrollWidth - chips.clientWidth - 1;
    if (prev) prev.disabled = chips.scrollLeft <= 0;
    if (next) next.disabled = chips.scrollLeft >= max;
  }

  // Buttons
  next?.addEventListener('click', () => {
    chips.scrollBy({ left: stepSize(), behavior: 'smooth' });
  });
  prev?.addEventListener('click', () => {
    chips.scrollBy({ left: -stepSize(), behavior: 'smooth' });
  });

  // Drag to scroll (mouse/touch via Pointer Events)
  let dragging = false, startX = 0, startLeft = 0;
  chips.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    startLeft = chips.scrollLeft;
    chips.setPointerCapture(e.pointerId);
  });
  chips.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    chips.scrollLeft = startLeft - dx;
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t =>
    chips.addEventListener(t, () => (dragging = false))
  );

  chips.addEventListener('scroll', updateArrows);
  window.addEventListener('resize', () => {
    sizeViewportToSix();
    // keep the current page aligned to the new width
    const page = Math.round(chips.scrollLeft / stepSize());
    sizeViewportToSix();
    chips.scrollLeft = page * stepSize();
    updateArrows();
  });

  // Initial layout after fonts/images load
  (document.fonts?.ready || Promise.resolve()).then(() => {
    requestAnimationFrame(() => {
      sizeViewportToSix();
      updateArrows();
    });
  });
})();


// TLD dropdown
const tldBtn     = document.getElementById('tldBtn');
const tldMenu    = document.getElementById('tldMenu');
const tldCurrent = document.getElementById('tldCurrent');
const domainInp  = document.getElementById('domain');
const submitBtn  = document.getElementById('domainSubmit');

function isMenuOpen() {
  return tldMenu?.dataset.open === 'true';
}
function toggleMenu(open) {
  if (!tldMenu || !tldBtn) return;
  tldMenu.dataset.open = String(open);
  tldBtn.setAttribute('aria-expanded', String(open));
}

// open/close on button
tldBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleMenu(!isMenuOpen());
});

// choose a TLD (event delegation)
tldMenu?.addEventListener('click', (e) => {
  const li = e.target.closest('.tld-item');
  if (!li) return;
  const ext = li.dataset.ext || li.textContent.trim();
  tldCurrent.textContent = ext;
  toggleMenu(false);
  domainInp?.focus();
});

// close on outside click
document.addEventListener('click', (e) => {
  if (!tldMenu || !isMenuOpen()) return;
  const inMenu  = e.target.closest('#tldMenu');
  const inBtn   = e.target.closest('#tldBtn');
  if (!inMenu && !inBtn) toggleMenu(false);
});

// close on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleMenu(false);
  // submit with Enter from input
  if (e.key === 'Enter' && document.activeElement === domainInp) {
    e.preventDefault();
    submitBtn?.click();
  }
});

// Submit action (replace with real search)
submitBtn?.addEventListener('click', () => {
  const name = (domainInp?.value || '')
    .trim()
    .replace(/^\.+/, '')
    .replace(/\s+/g, '');
  const ext  = (tldCurrent?.textContent || '').trim();
  const query = name ? name + ext : ext;
  console.log('Search domain:', query);
  // TODO: trigger your search request here
});

// Chips slider (arrow scrolls the chip row)
const chipsNext = document.getElementById('chipsNext');
const tldChips  = document.getElementById('tldChips');

chipsNext?.addEventListener('click', () => {
  if (!tldChips) return;
  const step = Math.max(220, Math.floor(tldChips.clientWidth * 0.85));
  tldChips.scrollBy({ left: step, behavior: 'smooth' });
});


// Pricing Toggle
const monthlyBtn = document.getElementById("monthlyBtn");
const yearlyBtn = document.getElementById("yearlyBtn");
const prices = document.querySelectorAll("[data-monthly]");

function showMonthly() {
  monthlyBtn.classList.add("bg-green-500", "text-white");
  monthlyBtn.classList.remove("text-black");

  yearlyBtn.classList.remove("bg-green-500", "text-white");
  yearlyBtn.classList.add("text-blue-600");

  prices.forEach((p) => (p.textContent = p.dataset.monthly));
}

function showYearly() {
  yearlyBtn.classList.add("bg-green-500", "text-white");
  yearlyBtn.classList.remove("text-blue-600");

  monthlyBtn.classList.remove("bg-green-500", "text-white");
  monthlyBtn.classList.add("text-black");

  prices.forEach((p) => (p.textContent = p.dataset.yearly));
}

monthlyBtn.addEventListener("click", showMonthly);
yearlyBtn.addEventListener("click", showYearly);

monthlyBtn.setAttribute("aria-pressed", "true");
yearlyBtn.setAttribute("aria-pressed", "false");
// END Pricing Toggle

// Coverage Global codes
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("animate-fade-up");
        // optional stagger via data-delay:  <div data-reveal data-delay="240">
        const d = e.target.getAttribute("data-delay");
        if (d) e.target.style.animationDelay = `${d}ms`;
        e.target.style.willChange = "transform, opacity";
        io.unobserve(e.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll("[data-reveal]").forEach((el) => {
  el.classList.add("opacity-0", "translate-y-4"); // initial state
  io.observe(el);
});
// End Coverage Global codes

// Set current year in footer
document.getElementById("year").innerHTML = new Date().getFullYear();

// Sticky header background on scroll
window.addEventListener("scroll", function () {
  const header = document.getElementById("site-header");
  if (window.scrollY > 100) {
    header.classList.add("bg-black", "shadow-md");
    header.classList.remove("bg-transparent");
  } else {
    header.classList.remove("bg-black", "shadow-md");
    header.classList.add("bg-transparent");
  }
});
