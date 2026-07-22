export function extractClassNames(code: string): Set<string> {
  const classes = new Set<string>();
  const classMatches = Array.from(code.matchAll(/\bclass(?:Name)?=["']([^"']+)["']/g));
  for (const m of classMatches) {
    const list = m[1].split(/\s+/);
    for (const c of list) {
      if (c.trim()) classes.add(c.trim());
    }
  }
  return classes;
}
