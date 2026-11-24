/// <reference types="@rsbuild/core/types" />

const pongEl = document.createElement('div');
pongEl.id = 'pong';
document.body.append(pongEl);

declare global {
  interface Window {
    sendPing: (value: number) => void;
  }
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.on<number>('pong', (value) => {
    pongEl.innerText = String(value);
  });

  window.sendPing = (value) => {
    import.meta.webpackHot?.send('ping', { value });
  };

  // Sent before the WebSocket connects, so it should be queued
  window.sendPing(1);

  import.meta.webpackHot.accept();
}
