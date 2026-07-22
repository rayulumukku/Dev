export function generateVueHMR(filename: string): string {
  return `
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.default) {
      console.log('[Vue HMR] Module updated:', ${JSON.stringify(filename)});
    }
  });
}
`;
}
