export class SolidHMRInjector {
  static inject(code: string, id: string): string {
    return `
${code}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule && newModule.default) {
      console.log('[Ray Solid HMR] Hot updating Solid component: ${id}');
    }
  });
}
`;
  }
}
