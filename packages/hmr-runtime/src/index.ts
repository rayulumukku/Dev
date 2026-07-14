/**
 * The client-side runtime injected into the browser.
 * Establishes a WebSocket connection back to the dev server
 * and listens for reload commands or CSS updates to hot swap styles live.
 */
export const hmrClientCode = `
(function() {
  const socketUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/__ray_ws';
  let socket;
  let reconnectTimer;

  function connect() {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    socket = new WebSocket(socketUrl);

    socket.addEventListener('open', () => {
      console.log('[Ray] Client runtime connected');
      clearTimeout(reconnectTimer);
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'full-reload') {
          console.log('[Ray] Reloading due to file change: ' + payload.path);
          location.reload();
        } else if (payload.type === 'css-update') {
          const path = payload.path;
          const timestamp = payload.timestamp;
          console.log('[Ray] Hot updating CSS: ' + path);
          
          let updated = false;

          // 1. Update <link rel="stylesheet"> tags
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

                newLink.onload = () => {
                  link.remove();
                };
                newLink.onerror = () => {
                  console.error('[Ray] Failed to load stylesheet HMR: ' + path + ', reloading...');
                  location.reload();
                };

                updated = true;
              }
            }
          }

          // 2. Update <style id="..."> tags injected by ESM imports
          const styleTag = document.getElementById(path);
          if (styleTag) {
            // Import the updated style JS module dynamically, with timestamp cache bust
            import(path + '?import&t=' + timestamp)
              .then(() => {
                console.log('[Ray] Style module updated successfully: ' + path);
              })
              .catch((err) => {
                console.error('[Ray] CSS HMR module import failed, reloading...', err);
                location.reload();
              });
            updated = true;
          }

          if (!updated) {
            console.warn('[Ray] Style ' + path + ' was not matched on page. Reloading as fallback.');
            location.reload();
          }
        }
      } catch (err) {
        console.error('[Ray] Failed to process socket message:', err);
      }
    });

    socket.addEventListener('close', () => {
      console.warn('[Ray] Connection closed. Attempting reconnect in 2s...');
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
