// navbar.js (robust & vanilla)
document.addEventListener("DOMContentLoaded", () => {
  // support either #hamburger or #navToggle
  const toggle =
    document.getElementById("hamburger") ||
    document.getElementById("navToggle");
  const links = document.getElementById("links");
  const main = document.querySelector("main") || document.body;

  // if markup isn't present, bail gracefully
  if (!toggle || !links) return;

  const HIDDEN = "hidden";

  function toggleMenu() {
    const willOpen = links.classList.contains(HIDDEN);
    links.classList.toggle(HIDDEN);
    toggle.classList.toggle("active", willOpen);
    toggle.setAttribute("aria-expanded", String(willOpen));
  }

  function closeMenu() {
    if (!links.classList.contains(HIDDEN)) {
      links.classList.add(HIDDEN);
      toggle.classList.remove("active");
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  // toggle button
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // close when clicking a link inside the menu
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });

  // click outside to close
  document.addEventListener("click", (e) => {
    const insideMenu = e.target.closest("#links");
    const insideToggle = e.target.closest("#hamburger, #navToggle");
    if (!insideMenu && !insideToggle) closeMenu();
  });

  // optional: close if main area is clicked
  main.addEventListener("click", closeMenu);
});
