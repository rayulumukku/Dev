export function injectMDXHMRCode(code) {
  return `${code}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    console.log('[Ray MDX HMR] MDX document updated.');
  });
}
`;
}
