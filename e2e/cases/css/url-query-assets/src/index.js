import styleUrl from './nested/style.css?url';

const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = styleUrl;
link.onload = async () => {
  const image = new Image();
  image.src = getComputedStyle(document.body).backgroundImage.slice(5, -2);
  await image.decode();
  window.imageWidth = image.naturalWidth;
};
document.head.appendChild(link);
