export function generateStaticHTML(rawHtml: string, minifyHTML: boolean = false): string {
  if (!minifyHTML) return rawHtml;
  return rawHtml.replace(/>\s+</g, '><').trim();
}
