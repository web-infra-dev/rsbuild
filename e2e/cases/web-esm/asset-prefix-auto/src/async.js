import imageUrl from '@e2e/assets/image.png?url';
import './async.css';

export const renderAsyncContent = () => {
  const content = document.createElement('div');
  content.id = 'async';
  content.textContent = 'Auto asset prefix loaded!';

  const image = document.createElement('img');
  image.id = 'async-image';
  image.src = imageUrl;

  document.body.append(content, image);
};
