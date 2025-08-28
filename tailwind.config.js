const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
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
