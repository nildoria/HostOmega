// Year at the bottom
document.getElementById('year').innerHTML = new Date().getFullYear();

// Pricing Table Toggle
  const monthlyBtn = document.getElementById('monthlyBtn');
  const yearlyBtn = document.getElementById('yearlyBtn');
  const prices = document.querySelectorAll('[data-monthly]');

  monthlyBtn.addEventListener('click', () => {
    monthlyBtn.classList.add('bg-green-500', 'text-white');
    yearlyBtn.classList.remove('bg-green-500', 'text-white');
    yearlyBtn.classList.add('bg-green-500');

    prices.forEach(p => p.textContent = p.dataset.monthly);
  });

  yearlyBtn.addEventListener('click', () => {
    yearlyBtn.classList.add('bg-green-500', 'text-white');
    monthlyBtn.classList.remove('bg-green-500', 'text-white');
    monthlyBtn.classList.add('text-black');

    prices.forEach(p => p.textContent = p.dataset.yearly);
  });

