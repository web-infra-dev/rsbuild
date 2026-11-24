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

  // Reuse the payload before the WebSocket connects.
  const payload = { value: 1 };
  import.meta.webpackHot.send('ping', payload);
  payload.value = 2;
  import.meta.webpackHot.send('ping', payload);

  import.meta.webpackHot.accept();
}
