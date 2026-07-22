export function generateCSSHMR(filename) {
  return `
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.default !== undefined) {
      if (typeof document !== 'undefined') {
        const style = document.querySelector(\`style[data-ray-css="\${${JSON.stringify(filename)}}"]\`);
        if (style) {
          style.innerHTML = newModule.default;
        }
      }
    }
  });
}
`;
}
