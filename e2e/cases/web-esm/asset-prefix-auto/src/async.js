import imageUrl from '@e2e/assets/image.png?url';
import './async.css';

document.body.innerHTML = `
  <div id="async">Auto asset prefix loaded!</div>
  <img id="async-image" src="${imageUrl}">
`;
