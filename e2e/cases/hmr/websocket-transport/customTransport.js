export default function createWebSocket(url) {
  window.__CUSTOM_TRANSPORT_USED__ = true;
  return new WebSocket(url);
}
