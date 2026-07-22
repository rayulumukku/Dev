import { OverlayError } from './types.js';

export class OverlayUI {
  private container: HTMLDivElement | null = null;
  private isMounted = false;

  mount(): void {
    if (typeof document === 'undefined' || this.isMounted) return;
    this.container = document.createElement('div');
    this.container.id = 'ray-hmr-overlay-v2';
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'true');
    this.container.setAttribute('tabindex', '-1');
    document.body.appendChild(this.container);
    this.isMounted = true;
  }

  render(errors: OverlayError[]): void {
    if (!this.isMounted) this.mount();
    if (!this.container) return;

    if (errors.length === 0) {
      this.unmount();
      return;
    }

    const err = errors[errors.length - 1];
    let html = `<div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(15,23,42,0.95);color:#fff;font-family:sans-serif;padding:2rem;z-index:999999;overflow:auto;">`;
    html += `<h2 style="color:#ef4444;margin:0 0 1rem 0;">[${err.category.toUpperCase()}] ${err.title}</h2>`;
    html += `<pre style="background:#1e293b;padding:1rem;border-radius:6px;white-space:pre-wrap;">${err.message}</pre>`;

    if (err.codeFrame) {
      html += `<h3>Code Frame</h3><pre style="background:#0f172a;padding:1rem;color:#38bdf8;">`;
      for (const line of err.codeFrame.lines) {
        const mark = line.isTarget ? '>' : ' ';
        html += `${mark} ${line.lineNumber} | ${line.content}\n`;
      }
      html += `</pre>`;
    }

    if (err.diagnostics && err.diagnostics.length > 0) {
      html += `<h3>Suggested Fixes</h3><ul>`;
      for (const hint of err.diagnostics) {
        html += `<li><strong>${hint.message}</strong> ${hint.suggestion || ''}</li>`;
      }
      html += `</ul>`;
    }

    html += `<button id="ray-overlay-dismiss-btn" style="margin-top:1rem;padding:8px 16px;background:#3b82f6;color:#fff;border:none;border-radius:4px;cursor:pointer;">Dismiss Overlay</button></div>`;

    this.container.innerHTML = html;
  }

  unmount(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.isMounted = false;
  }
}
