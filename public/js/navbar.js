// Mobile nav drawer

(function () {
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const overlay   = document.getElementById('mobileOverlay');
  if (!navToggle || !mobileNav || !overlay) return;

  const body = document.body;

  function firstFocusable(container){
    return container.querySelector('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
  }

  function openNav(){
    mobileNav.classList.remove('-translate-x-full');
    mobileNav.setAttribute('aria-hidden','false');

    overlay.classList.remove('pointer-events-none');
    overlay.classList.add('opacity-100');  // implicit via CSS transition
    overlay.style.opacity = '1';

    navToggle.setAttribute('aria-expanded','true');
    body.classList.add('overflow-hidden'); // prevent background scroll

    const el = firstFocusable(mobileNav);
    if (el) setTimeout(()=>el.focus(), 120);
  }

  function closeNav(){
    mobileNav.classList.add('-translate-x-full');
    mobileNav.setAttribute('aria-hidden','true');

    overlay.classList.add('pointer-events-none');
    overlay.classList.remove('opacity-100');
    overlay.style.opacity = '0';

    navToggle.setAttribute('aria-expanded','false');
    body.classList.remove('overflow-hidden');
  }

  function isOpen(){
    return !mobileNav.classList.contains('-translate-x-full');
  }

  // Toggle click
  navToggle.addEventListener('click', (e)=>{
    e.preventDefault();
    isOpen() ? closeNav() : openNav();
  });

  // Click overlay to close
  overlay.addEventListener('click', closeNav);

  // ESC to close
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape' && isOpen()) closeNav();
  });

  // Close when resizing to desktop
  const mq = window.matchMedia('(min-width: 1024px)');
  mq.addEventListener('change', () => { if (mq.matches) closeNav(); });

  // Optional: close when clicking any link inside the drawer
  mobileNav.addEventListener('click', (e)=>{
    const a = e.target.closest('a[href]');
    if (a) closeNav();
  });
})();
(function(){
  const closeBtn = document.getElementById('mobileNavClose');
  const navToggle = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const overlay   = document.getElementById('mobileOverlay');

  if (closeBtn) closeBtn.addEventListener('click', () => {
    mobileNav.classList.add('-translate-x-full');
    overlay.classList.add('pointer-events-none');
    overlay.style.opacity = '0';
    navToggle.setAttribute('aria-expanded','false');
    document.body.classList.remove('overflow-hidden');
  });
})();
// END Mobile nav drawer


// Language selection (robust & vanilla)
(function(){
  const btn   = document.getElementById('langBtn');
  const menu  = document.getElementById('langMenu');
  const label = document.getElementById('langLabel');
  if (!btn || !menu || !label) return;

  // Persist selection
  const LS_KEY = 'site_lang';
  const names  = { en: 'English', bn: 'বাংলা', he: 'עברית' };

  // Init label from storage
  const saved = localStorage.getItem(LS_KEY);
  if (saved && names[saved]) label.textContent = names[saved];

  const open  = () => { menu.classList.remove('hidden'); btn.setAttribute('aria-expanded','true'); };
  const close = () => { menu.classList.add('hidden');  btn.setAttribute('aria-expanded','false'); };
  const isOpen = () => !menu.classList.contains('hidden');

  // Toggle
  btn.addEventListener('click', (e)=>{ e.stopPropagation(); isOpen() ? close() : open(); });

  // Select language (desktop + mobile share .lang-item)
  document.querySelectorAll('.lang-item').forEach(el=>{
    el.addEventListener('click', (e)=>{
      const code = e.currentTarget.getAttribute('data-lang');
      if (!code) return;
      localStorage.setItem(LS_KEY, code);
      if (names[code]) label.textContent = names[code];
      close();
      // Hook: perform actual i18n swap here if you have one.
      // e.g., window.location.search='?lang='+code; or trigger your i18n router.
    });
  });

  // Close on outside click / ESC
  document.addEventListener('click', (e)=>{ if (isOpen() && !btn.contains(e.target) && !menu.contains(e.target)) close(); });
  document.addEventListener('keydown', (e)=>{ if (e.key==='Escape' && isOpen()) close(); });

  // Basic focus handling for accessibility
  menu.addEventListener('keydown', (e)=>{
    const items = Array.from(menu.querySelectorAll('.lang-item'));
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown'){ e.preventDefault(); (items[i+1]||items[0]).focus(); }
    if (e.key === 'ArrowUp'){   e.preventDefault(); (items[i-1]||items.at(-1)).focus(); }
    if (e.key === 'Tab'){ close(); }
  });
})();