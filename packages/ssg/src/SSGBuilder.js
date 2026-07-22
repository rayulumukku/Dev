import fs from 'fs';
import path from 'path';
import { collectSSGRoutes } from './RouteCollector.js';
import { generateStaticHTML } from './HTMLGenerator.js';
import { generateSitemapXML, generateRobotsTxt } from './SitemapGenerator.js';
import { writeManifest } from './ManifestWriter.js';
import { PrerenderQueue } from './PrerenderQueue.js';

export class SSGBuilder {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      routes: config.routes || ['/'],
      sitemap: config.sitemap ?? true,
      robots: config.robots ?? true,
      minifyHTML: config.minifyHTML ?? false,
      outDir: config.outDir || 'dist',
    };
    this.queue = new PrerenderQueue();
  }

  async build(renderFn) {
    const outDir = path.resolve(this.config.outDir || 'dist');
    const ssgRoutes = collectSSGRoutes(this.config.routes || ['/'], outDir);

    const prerenderResults = await this.queue.processRoutes(ssgRoutes, renderFn);
    let errorsCount = 0;

    for (let i = 0; i < ssgRoutes.length; i++) {
      const routeInfo = ssgRoutes[i];
      const result = prerenderResults[i];

      if (result.error) {
        errorsCount++;
        console.error(`❌ [Ray SSG] Failed to render route ${routeInfo.path}: ${result.error.message}`);
        continue;
      }

      const finalHTML = generateStaticHTML(result.html, this.config.minifyHTML);
      fs.mkdirSync(path.dirname(routeInfo.outputPath), { recursive: true });
      fs.writeFileSync(routeInfo.outputPath, finalHTML);
    }

    if (this.config.sitemap) {
      const xml = generateSitemapXML({ routes: this.config.routes || ['/'] });
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), xml);
    }

    if (this.config.robots) {
      const robots = generateRobotsTxt();
      fs.writeFileSync(path.join(outDir, 'robots.txt'), robots);
    }

    writeManifest(outDir, {
      generatedAt: new Date().toISOString(),
      routes: ssgRoutes.map((r) => r.path),
    });

    return { routesCount: ssgRoutes.length, errorsCount };
  }
}
