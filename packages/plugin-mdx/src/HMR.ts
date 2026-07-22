export function injectMDXHMRCode(code: string): string {
  return `${code}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      console.log('[Ray MDX HMR] MDX document updated.');
    }
  });
}
`;
}
