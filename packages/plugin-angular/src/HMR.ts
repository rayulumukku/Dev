export class AngularHMRInjector {
  static inject(code: string, id: string): string {
    return `
${code}

if (import.meta.hot) {
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      console.log('[Ray Angular HMR] Hot updating Angular component/module: ${id}');
    }
  });
}
`;
  }
}
