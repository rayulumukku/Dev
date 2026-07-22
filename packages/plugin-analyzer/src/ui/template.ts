import { AnalysisResult } from '../types.js';

export function generateHtmlReport(result: AnalysisResult): string {
  const jsonData = JSON.stringify(result);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ray Bundle Analyzer Report</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --warning: #f59e0b;
      --danger: #ef4444;
      --success: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 1.5rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }
    h1 { font-size: 1.8rem; font-weight: 700; color: var(--text); }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
    }
    .stat-card .label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; }
    .stat-card .val { font-size: 1.5rem; font-weight: 700; color: var(--accent); margin-top: 0.25rem; }
    
    .nav-tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1.5rem;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      padding: 0.75rem 1.25rem;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .tab-btn.active {
      color: var(--accent);
      border-bottom-color: var(--accent);
    }

    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .search-bar {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--text);
      font-size: 1rem;
      margin-bottom: 1.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 1.5rem;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th { background: rgba(255, 255, 255, 0.05); font-weight: 600; }

    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-high { background: var(--danger); color: #fff; }
    .badge-medium { background: var(--warning); color: #000; }
    .badge-low { background: var(--success); color: #fff; }

    .rec-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 8px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }
    .rec-card.high { border-left-color: var(--danger); }
    .rec-card.medium { border-left-color: var(--warning); }

    .treemap-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      height: 400px;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      overflow: hidden;
    }
    .treemap-box {
      background: rgba(99, 102, 241, 0.2);
      border: 1px solid var(--accent);
      border-radius: 4px;
      padding: 0.5rem;
      color: #fff;
      font-size: 0.85rem;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>⚡ Ray Bundle Analyzer</h1>
      <p style="color: var(--text-muted);">Generated at ${new Date(result.timestamp).toLocaleString()}</p>
    </div>
  </header>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="label">Total Bundle Size</div>
      <div class="val">${(result.bundleSize / 1024).toFixed(1)} KB</div>
    </div>
    <div class="stat-card">
      <div class="label">Estimated Gzip</div>
      <div class="val">${(result.gzipSize / 1024).toFixed(1)} KB</div>
    </div>
    <div class="stat-card">
      <div class="label">Estimated Brotli</div>
      <div class="val">${(result.brotliSize / 1024).toFixed(1)} KB</div>
    </div>
    <div class="stat-card">
      <div class="label">Chunks Count</div>
      <div class="val">${result.chunkCount}</div>
    </div>
    <div class="stat-card">
      <div class="label">Tree-Shaking Saved</div>
      <div class="val">${result.treeShakenPercentage}%</div>
    </div>
  </div>

  <div class="nav-tabs">
    <button class="tab-btn active" onclick="switchTab('treemap')">Treemap</button>
    <button class="tab-btn" onclick="switchTab('modules')">Modules (${result.moduleCount})</button>
    <button class="tab-btn" onclick="switchTab('assets')">Assets & Chunks</button>
    <button class="tab-btn" onclick="switchTab('recommendations')">Recommendations (${result.recommendations.length})</button>
  </div>

  <input type="text" id="searchInput" class="search-bar" placeholder="Search modules, packages, chunks..." oninput="filterData()">

  <div id="tab-treemap" class="tab-content active">
    <div class="treemap-container" id="treemapBox">
      <!-- Generated treemap boxes -->
    </div>
  </div>

  <div id="tab-modules" class="tab-content">
    <table>
      <thead>
        <tr>
          <th>Module Name</th>
          <th>Size (Raw)</th>
          <th>Transformed</th>
          <th>Package</th>
          <th>Tree-Shaken</th>
        </tr>
      </thead>
      <tbody id="modulesTableBody">
      </tbody>
    </table>
  </div>

  <div id="tab-assets" class="tab-content">
    <table>
      <thead>
        <tr>
          <th>Asset / Chunk Name</th>
          <th>Type</th>
          <th>Raw Size</th>
          <th>Est. Gzip</th>
        </tr>
      </thead>
      <tbody id="assetsTableBody">
      </tbody>
    </table>
  </div>

  <div id="tab-recommendations" class="tab-content">
    <div id="recommendationsList">
    </div>
  </div>

  <script>
    const data = ${jsonData};

    function renderTreemap() {
      const container = document.getElementById('treemapBox');
      container.innerHTML = '';
      const modules = data.modules.sort((a,b) => b.transformedSize - a.transformedSize).slice(0, 30);
      const totalSize = modules.reduce((acc, m) => acc + m.transformedSize, 0) || 1;

      modules.forEach(m => {
        const pct = Math.max(5, Math.round((m.transformedSize / totalSize) * 100));
        const box = document.createElement('div');
        box.className = 'treemap-box';
        box.style.flex = \`1 1 \${pct}%\`;
        box.innerHTML = \`<strong>\${m.name}</strong><br/>\${(m.transformedSize/1024).toFixed(1)} KB\`;
        container.appendChild(box);
      });
    }

    function renderModules(filter = '') {
      const tbody = document.getElementById('modulesTableBody');
      tbody.innerHTML = '';
      const query = filter.toLowerCase();

      data.modules
        .filter(m => !query || m.name.toLowerCase().includes(query) || (m.packageName && m.packageName.toLowerCase().includes(query)))
        .forEach(m => {
          const tr = document.createElement('tr');
          tr.innerHTML = \`
            <td>\${m.name}</td>
            <td>\${(m.size/1024).toFixed(1)} KB</td>
            <td>\${(m.transformedSize/1024).toFixed(1)} KB</td>
            <td>\${m.packageName || 'app'}</td>
            <td>\${m.isTreeShaken ? '✔ Yes' : 'No'}</td>
          \`;
          tbody.appendChild(tr);
        });
    }

    function renderAssets() {
      const tbody = document.getElementById('assetsTableBody');
      tbody.innerHTML = '';
      data.chunks.concat(data.assets).forEach(a => {
        const tr = document.createElement('tr');
        tr.innerHTML = \`
          <td>\${a.fileName || a.name}</td>
          <td>\${a.type || (a.isEntry ? 'Entry Chunk' : 'Chunk')}</td>
          <td>\${(a.size/1024).toFixed(1)} KB</td>
          <td>\${(a.gzipSize/1024).toFixed(1)} KB</td>
        \`;
        tbody.appendChild(tr);
      });
    }

    function renderRecommendations() {
      const list = document.getElementById('recommendationsList');
      list.innerHTML = '';
      data.recommendations.forEach(r => {
        const div = document.createElement('div');
        div.className = \`rec-card \${r.severity}\`;
        div.innerHTML = \`
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h3 style="font-size:1.1rem; color:var(--text);">\${r.title}</h3>
            <span class="badge badge-\${r.severity}">\${r.severity}</span>
          </div>
          <p style="color:var(--text-muted); margin-bottom:0.5rem;">\${r.message}</p>
          <p style="font-size:0.9rem; margin-bottom:0.5rem;"><strong>Why it matters:</strong> \${r.explanation}</p>
          <p style="font-size:0.9rem; color:var(--accent);"><strong>Action:</strong> \${r.action}</p>
        \`;
        list.appendChild(div);
      });
    }

    function switchTab(name) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + name).classList.add('active');
    }

    function filterData() {
      const val = document.getElementById('searchInput').value;
      renderModules(val);
    }

    renderTreemap();
    renderModules();
    renderAssets();
    renderRecommendations();
  </script>
</body>
</html>`;
}
