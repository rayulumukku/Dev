/**
 * The client-side runtime injected into the browser.
 * Establishes a WebSocket connection back to the dev server
 * and listens for reload commands to perform live refreshes.
 */
export const hmrClientCode = `
(function() {
  // Use custom WebSocket protocol path to avoid overlapping with user endpoints
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
      // Handled silently to prevent terminal log spam
    });
  }

  connect();
})();
`;
