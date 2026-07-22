export class SvelteHMRInjector {
  static inject(code: string, id: string): string {
    return `
${code}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.default) {
      console.log('[Ray Svelte HMR] Hot updating Svelte component: ${id}');
    }
  });
}
`;
  }
}
