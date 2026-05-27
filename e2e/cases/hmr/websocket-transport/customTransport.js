// Simulate the micro-frontend scenario where the WebSocket URL
// is derived from the script's own host instead of the page origin.
let cachedBaseUrl = null;

export default function createWebSocket(url) {
  if (!cachedBaseUrl) {
    const scriptUrl = new URL(document.currentScript.src);
    const wsProtocol = scriptUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    cachedBaseUrl = `${wsProtocol}//${scriptUrl.host}/rsbuild-hmr`;
  }
  // Preserve the token query param from the original url
  const token = new URL(url).searchParams.get('token');
  const finalUrl = `${cachedBaseUrl}?token=${token}`;
  window.__CUSTOM_TRANSPORT_URL__ = finalUrl;
  return new WebSocket(finalUrl);
}
