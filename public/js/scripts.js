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