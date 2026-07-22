module.exports = {
  plugins: [
    // Custom inline PostCSS transform simulation
    (css) => css.replace(/--primary-color/g, '#0ea5e9'),
  ],
};
