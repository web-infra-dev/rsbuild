export default function resolveWebSocketUrl(url: string): string {
  const resolved = new URL(url);
  resolved.host = location.host;
  (
    window as Window & {
      __RSBUILD_WEBSOCKET_URL__?: string;
    }
  ).__RSBUILD_WEBSOCKET_URL__ = resolved.toString();
  return resolved.toString();
}
