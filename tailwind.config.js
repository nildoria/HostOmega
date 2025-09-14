const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        "primary-color": "#0fa",
      },
      screens: {
        xs: "361px",
        ...defaultTheme.screens,
      },
    },
  },
  plugins: [],
};
