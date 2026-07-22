export function parseSFC(code, filename) {
  const scriptMatch = code.match(/<script([^>]*)>([\s\S]*?)<\/script>/i);
  const templateMatch = code.match(/<template([^>]*)>([\s\S]*?)<\/template>/i);
  const styleMatches = Array.from(code.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/gi));
  const customBlockMatches = Array.from(code.matchAll(/<(i18n|custom)([^>]*)>([\s\S]*?)<\/\1>/gi));

  let script = undefined;
  if (scriptMatch) {
    const attrs = scriptMatch[1];
    const isSetup = /\bsetup\b/i.test(attrs);
    const langMatch = attrs.match(/\blang=["']([^"']+)["']/i);
    script = {
      content: scriptMatch[2].trim(),
      setup: isSetup,
      lang: langMatch ? langMatch[1] : undefined,
    };
  }

  let template = undefined;
  if (templateMatch) {
    const attrs = templateMatch[1];
    const langMatch = attrs.match(/\blang=["']([^"']+)["']/i);
    template = {
      content: templateMatch[2].trim(),
      lang: langMatch ? langMatch[1] : undefined,
    };
  }

  const styles = styleMatches.map((m) => {
    const attrs = m[1];
    const scoped = /\bscoped\b/i.test(attrs);
    const langMatch = attrs.match(/\blang=["']([^"']+)["']/i);
    return {
      content: m[2].trim(),
      scoped,
      lang: langMatch ? langMatch[1] : undefined,
    };
  });

  const customBlocks = customBlockMatches.map((m) => ({
    type: m[1],
    content: m[3].trim(),
  }));

  return {
    filename,
    source: code,
    script,
    template,
    styles,
    customBlocks,
  };
}
