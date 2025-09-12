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

/* ========= 9) pOPUP ========= */
document.addEventListener('DOMContentLoaded', function() {
    const signupBtn = document.getElementById('signupBtn');
    const signupModal = document.getElementById('signupModal');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.getElementById('closeModal');
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const passwordHelp = document.getElementById('passwordHelp');
    const signupForm = document.getElementById('signupForm');

    // Open modal with Tailwind animations
    signupBtn.addEventListener('click', function(e) {
        e.preventDefault();
        signupModal.classList.remove('hidden');
        signupModal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        
        // Trigger enter animation
        setTimeout(() => {
            signupModal.classList.remove('opacity-0');
            signupModal.classList.add('opacity-100');
            modalContent.classList.remove('scale-95', 'translate-y-4');
            modalContent.classList.add('scale-100', 'translate-y-0');
        }, 10);
    });

    // Close modal functions
    function closeModalFunction() {
        // Trigger exit animation
        signupModal.classList.remove('opacity-100');
        signupModal.classList.add('opacity-0');
        modalContent.classList.remove('scale-100', 'translate-y-0');
        modalContent.classList.add('scale-95', 'translate-y-4');
        
        // Hide modal after animation
        setTimeout(() => {
            signupModal.classList.add('hidden');
            signupModal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // Close modal events
    closeModal.addEventListener('click', closeModalFunction);

    // Close on backdrop click
    signupModal.addEventListener('click', function(e) {
        if (e.target === signupModal) {
            closeModalFunction();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !signupModal.classList.contains('hidden')) {
            closeModalFunction();
        }
    });

    // Password toggle functionality
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update icon with Tailwind transitions
        if (type === 'text') {
            this.innerHTML = `
                <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                </svg>
            `;
        } else {
            this.innerHTML = `
                <svg class="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
            `;
        }
    });

    // Form validation with Tailwind classes
    const inputs = signupForm.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.classList.remove('border-gray-300', 'focus:border-blue-500');
                this.classList.add('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
            } else {
                this.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                this.classList.add('border-gray-300', 'focus:border-blue-500', 'focus:ring-blue-500');
            }
        });

        input.addEventListener('input', function() {
            if (this.classList.contains('border-red-500') && this.value.trim() !== '') {
                this.classList.remove('border-red-500', 'focus:border-red-500', 'focus:ring-red-500');
                this.classList.add('border-gray-300', 'focus:border-blue-500', 'focus:ring-blue-500');
            }
        });
    });

    // Password strength with Tailwind classes
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        
        if (password.length === 0) {
            passwordHelp.textContent = 'Must be at least 8 characters';
            passwordHelp.className = 'text-xs text-gray-500 mt-1 transition-colors duration-200';
        } else if (password.length < 8) {
            passwordHelp.textContent = 'Password too short';
            passwordHelp.className = 'text-xs text-red-500 mt-1 transition-colors duration-200';
        } else {
            passwordHelp.textContent = 'Strong password ✓';
            passwordHelp.className = 'text-xs text-green-500 mt-1 transition-colors duration-200';
        }
    });

    // Form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Add loading state with Tailwind
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalContent = submitBtn.innerHTML;
        
        submitBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
        `;
        submitBtn.disabled = true;
        
        // Simulate API call
        setTimeout(() => {
            submitBtn.innerHTML = originalContent;
            submitBtn.disabled = false;
            alert('Account created successfully!');
            closeModalFunction();
            signupForm.reset();
            // Reset password help text
            passwordHelp.textContent = 'Must be at least 8 characters';
            passwordHelp.className = 'text-xs text-gray-500 mt-1 transition-colors duration-200';
        }, 2000);
    });
});




// Login

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded'); // Debug log
    
    // Get all required elements
    const loginBtn = document.getElementById('loginBtn');
    const signupBtnInModal = document.querySelector('#signupModal #signupBtn'); // Updated selector
    const signupModal = document.getElementById('signupModal');
    const loginModal = document.getElementById('loginModal');
    const closeSignupModal = document.getElementById('closeModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    
    // Debug: Check if elements exist
    console.log('Elements found:', {
        loginBtn: !!loginBtn,
        signupBtnInModal: !!signupBtnInModal,
        signupModal: !!signupModal,
        loginModal: !!loginModal,
        closeSignupModal: !!closeSignupModal,
        closeLoginModal: !!closeLoginModal
    });

    // Modal animation functions
    function openModal(modal) {
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        
        console.log('Opening modal:', modal.id);
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        
        // Trigger animation
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.classList.add('opacity-100');
            
            const content = modal.querySelector('[id$="Content"], #modalContent');
            if (content) {
                content.classList.remove('scale-95', 'translate-y-4');
                content.classList.add('scale-100', 'translate-y-0');
            }
        }, 10);
    }

    function closeModal(modal) {
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        
        console.log('Closing modal:', modal.id);
        modal.classList.remove('opacity-100');
        modal.classList.add('opacity-0');
        
        const content = modal.querySelector('[id$="Content"], #modalContent');
        if (content) {
            content.classList.remove('scale-100', 'translate-y-0');
            content.classList.add('scale-95', 'translate-y-4');
        }
        
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = 'auto';
        }, 300);
    }

    // Event listeners with error checking
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Login button clicked');
            openModal(loginModal);
        });
    } else {
        console.error('Login button not found');
    }

    if (signupBtnInModal) {
        signupBtnInModal.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Signup button clicked');
            openModal(signupModal);
        });
    }

    if (closeSignupModal) {
        closeSignupModal.addEventListener('click', function() {
            console.log('Close signup modal clicked');
            closeModal(signupModal);
        });
    }

    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', function() {
            console.log('Close login modal clicked');
            closeModal(loginModal);
        });
    }

    // Close on backdrop click
    [signupModal, loginModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    console.log('Backdrop clicked');
                    closeModal(modal);
                }
            });
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            console.log('Escape key pressed');
            if (signupModal && !signupModal.classList.contains('hidden')) {
                closeModal(signupModal);
            }
            if (loginModal && !loginModal.classList.contains('hidden')) {
                closeModal(loginModal);
            }
        }
    });

    // Password toggle functionality
    function setupPasswordToggle(passwordId, toggleId) {
        const passwordInput = document.getElementById(passwordId);
        const toggleBtn = document.getElementById(toggleId);
        
        if (passwordInput && toggleBtn) {
            toggleBtn.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                console.log('Password visibility toggled:', type);
            });
        }
    }

    // Setup password toggles
    setupPasswordToggle('password', 'togglePassword');
    setupPasswordToggle('loginPassword', 'toggleLoginPassword');

    // Modal switching functionality
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.querySelector('#signupModal .text-blue-500[href="#"]');
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Switch to signup clicked');
            closeModal(loginModal);
            setTimeout(() => openModal(signupModal), 350);
        });
    }

    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Switch to login clicked');
            closeModal(signupModal);
            setTimeout(() => openModal(loginModal), 350);
        });
    }

    console.log('All event listeners set up');
});
