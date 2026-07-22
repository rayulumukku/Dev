export function generateSitemapXML(options) {
  const domain = options.domain || 'https://example.com';
  const urls = options.routes
    .map((r) => `  <url>\n    <loc>${domain}${r}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

export function generateRobotsTxt(domain) {
  const sitemapUrl = `${domain || 'https://example.com'}/sitemap.xml`;
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}`;
}
