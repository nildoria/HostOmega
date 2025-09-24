const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        "primary-color": "#0fa",
      },
          keyframes: {
        fadeIn: {
          "0%": { opacity: 0, transform: "scale(1.05)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      screens: {
        xs: "361px",
        ...defaultTheme.screens,
      },
    },
       animation: {
        fadeIn: "fadeIn 0.8s ease-in-out",
      },
  },
  plugins: [],
};

