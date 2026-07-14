/**
 * The client-side runtime injected into the browser.
 * Establishes a WebSocket connection back to the dev server.
 * Implements import.meta.hot (accept, dispose, data), a component proxying engine
 * to preserve hooks state across updates, root re-rendering, and a full-screen error overlay.
 */
export const hmrClientCode = `
(function() {
  const socketUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/__ray_ws';
  let socket;
  let reconnectTimer;

  // Active React roots & components mapping
  window.__ray_active_roots = window.__ray_active_roots || new Set();
  window.__ray_root_components = window.__ray_root_components || new Map();

  // 1. React Component Proxy Registry (For state-preserving HMR updates)
  const componentProxies = new Map(); // id -> { stableWrapper, currentImplementation }

  window.__ray_register_component = (moduleId, name, implementation) => {
    const id = moduleId + '::' + name;
    let record = componentProxies.get(id);

    if (!record) {
      let stableWrapper;
      if (typeof implementation === 'function') {
        stableWrapper = function ProxyComponent(props, ref) {
          return record.currentImplementation(props, ref);
        };
        Object.defineProperty(stableWrapper, 'name', { value: name });
      } else if (typeof implementation === 'object' && implementation !== null) {
        // Support forwardRef or memo proxying
        stableWrapper = {
          ...implementation,
          render: (props, ref) => {
            return record.currentImplementation.render
              ? record.currentImplementation.render(props, ref)
              : record.currentImplementation(props, ref);
          }
        };
      } else {
        stableWrapper = implementation;
      }

      record = { stableWrapper, currentImplementation: implementation };
      componentProxies.set(id, record);
    } else {
      record.currentImplementation = implementation;
    }

    return record.stableWrapper;
  };

  // 2. Client-side HMR Module Registry
  const moduleRegistry = new Map(); // path -> ModuleRecord

  class HotContext {
    constructor(ownerPath) {
      this.ownerPath = ownerPath;
      this.acceptCallbacks = [];
      this.disposeCallbacks = [];

      let record = moduleRegistry.get(ownerPath);
      if (!record) {
        record = {
          id: ownerPath,
          url: ownerPath,
          disposeCallbacks: this.disposeCallbacks,
          acceptCallbacks: this.acceptCallbacks,
          data: {}
        };
        moduleRegistry.set(ownerPath, record);
      } else {
        record.disposeCallbacks = this.disposeCallbacks;
        record.acceptCallbacks = this.acceptCallbacks;
      }

      this.data = record.data;
    }

    accept(deps, callback) {
      if (!deps) {
        // self-accepting module
        this.acceptCallbacks.push({ deps: [this.ownerPath], callback: () => {} });
      } else if (typeof deps === 'function') {
        // self-accepting module with callback
        this.acceptCallbacks.push({ deps: [this.ownerPath], callback: deps });
      } else if (typeof deps === 'string') {
        this.acceptCallbacks.push({ deps: [deps], callback });
      } else if (Array.isArray(deps)) {
        this.acceptCallbacks.push({ deps, callback });
      }
    }

    dispose(callback) {
      this.disposeCallbacks.push(callback);
    }

    invalidate() {
      console.warn('[Ray HMR] Module invalidated: ' + this.ownerPath + '. Reloading...');
      location.reload();
    }

    decline() {
      console.warn('[Ray HMR] Module declined HMR: ' + this.ownerPath + '. Reloading...');
      location.reload();
    }
  }

  window.__ray_create_hot_context = (ownerUrl) => {
    const url = new URL(ownerUrl, location.href);
    return new HotContext(url.pathname);
  };

  // 3. Error Overlay Rendering
  function showOverlay(err) {
    let overlay = document.getElementById('ray-error-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'ray-error-overlay';
      overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,15,22,0.97);color:#f87171;font-family:monospace;padding:3rem;box-sizing:border-box;z-index:99999;white-space:pre-wrap;overflow:auto;';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = '<h2>⚡ Ray HMR Compile Error ⚡</h2>' +
      '<div style="color:#fca5a5;font-weight:bold;margin-bottom:1rem;">' + err.message + '</div>' +
      (err.filename ? '<div style="color:#d1d5db;margin-bottom:1rem;"><strong>File:</strong> ' + err.filename + '</div>' : '') +
      '<pre style="background:#1e1e24;color:#e5e7eb;padding:1.5rem;border-radius:8px;border:1px solid #374151;overflow:auto;">' + (err.stack || '') + '</pre>';
  }

  function dismissOverlay() {
    const overlay = document.getElementById('ray-error-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  // 4. Trigger React Re-render of Active Roots
  function performReactRefresh() {
    for (const root of window.__ray_active_roots) {
      const element = window.__ray_root_components.get(root);
      if (element) {
        console.log('[Ray] Triggering root component state-preserving re-render...');
        root.render(element);
      }
    }
  }

  // 5. Connect WebSocket client
  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    socket = new WebSocket(socketUrl);

    socket.addEventListener('open', () => {
      console.log('[Ray] Client HMR runtime connected');
      clearTimeout(reconnectTimer);
    });

    socket.addEventListener('message', async (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'full-reload') {
          console.log('[Ray] JS change detected. Performing full reload: ' + payload.path);
          location.reload();
        } else if (payload.type === 'css-update') {
          const path = payload.path;
          const timestamp = payload.timestamp;
          console.log('[Ray] Hot updating CSS: ' + path);

          let updated = false;

          // Update link tags
          const links = document.querySelectorAll('link[rel="stylesheet"]');
          for (const link of links) {
            const href = link.getAttribute('href');
            if (href) {
              const url = new URL(href, location.href);
              if (url.pathname === path) {
                const newLink = link.cloneNode();
                const newUrl = new URL(href, location.href);
                newUrl.searchParams.set('t', timestamp);
                newLink.href = newUrl.toString();
                link.parentNode.insertBefore(newLink, link.nextSibling);

                newLink.onload = () => link.remove();
                newLink.onerror = () => location.reload();
                updated = true;
              }
            }
          }

          // Update style tags
          const styleTag = document.getElementById(path);
          if (styleTag) {
            await import(path + '?import&t=' + timestamp);
            updated = true;
          }

          if (!updated) {
            location.reload();
          }
        } else if (payload.type === 'update') {
          dismissOverlay();
          const updates = payload.updates;

          for (const update of updates) {
            const path = update.path;
            const acceptedPath = update.acceptedPath;
            const timestamp = update.timestamp;

            console.log('[Ray HMR] Applying module HMR: ' + acceptedPath);

            const record = moduleRegistry.get(acceptedPath);
            if (record) {
              // Run dispose callbacks
              for (const cb of record.disposeCallbacks) {
                try {
                  cb(record.data);
                } catch (e) {
                  console.error('[Ray HMR] Error in dispose callback for ' + acceptedPath, e);
                }
              }
              // Clear callbacks for re-registration
              record.disposeCallbacks.length = 0;
              record.acceptCallbacks.length = 0;
            }

            try {
              // Import cache-busted module version
              const newUrl = acceptedPath + '?t=' + timestamp;
              const newModule = await import(newUrl);

              if (record) {
                record.namespace = newModule;
                // Run accept callbacks
                for (const item of record.acceptCallbacks) {
                  try {
                    item.callback(newModule);
                  } catch (e) {
                    console.error('[Ray HMR] Error in accept callback for ' + acceptedPath, e);
                  }
                }
              }
            } catch (err) {
              console.error('[Ray HMR] HMR module loading error: ', err);
              showOverlay(err);
              return;
            }
          }

          // Trigger root re-renders
          performReactRefresh();
        }
      } catch (err) {
        console.error('[Ray] WebSocket message handling error:', err);
        showOverlay(err);
      }
    });

    socket.addEventListener('close', () => {
      console.warn('[Ray] Connection lost. Attempting reconnect in 2s...');
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connect, 2000);
    });

    socket.addEventListener('error', (err) => {
      // Handled silently
    });
  }

  connect();
})();
`;
