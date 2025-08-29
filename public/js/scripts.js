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


document.getElementById("year").innerHTML = new Date().getFullYear();