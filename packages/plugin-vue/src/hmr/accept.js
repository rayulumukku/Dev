export function generateVueHMRAccept(filename, updateType = 'multiple') {
  return `
if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.default) {
      const updateType = ${JSON.stringify(updateType)};
      if (typeof window !== 'undefined' && window.__VUE_HMR_RUNTIME__) {
        window.__VUE_HMR_RUNTIME__.reload(${JSON.stringify(filename)}, newModule.default);
      } else {
        console.log('[Vue HMR] (' + updateType + ') Updated:', ${JSON.stringify(filename)});
      }
    }
  });
}
`;
}
