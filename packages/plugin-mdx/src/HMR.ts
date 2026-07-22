export function injectMDXHMRCode(code: string): string {
  return `${code}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('[Ray MDX HMR] MDX document updated.');
  });
}
`;
}
