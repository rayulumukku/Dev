export function generateStaticHTML(rawHtml, minifyHTML = false) {
  if (!minifyHTML) return rawHtml;
  return rawHtml.replace(/>\s+</g, '><').trim();
}
