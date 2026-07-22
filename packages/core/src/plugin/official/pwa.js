/**
 * Official Ray plugin for ServiceWorker / PWA registrations.
 * Injects Sw initialization block into project index.html.
 */
export function pwaPlugin() {
    return {
        name: '@ray/plugin-pwa',
        async transform(code, id) {
            if (id.endsWith('index.html')) {
                const swScript = `
<script>
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('[PWA] ServiceWorker registration failed: ', err);
      });
    });
  }
</script>
`;
                const replaced = code.replace('</body>', `${swScript}\n</body>`);
                return { code: replaced };
            }
            return null;
        },
    };
}
//# sourceMappingURL=pwa.js.map