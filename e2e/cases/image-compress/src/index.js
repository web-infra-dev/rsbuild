import imageIco from '@assets/image.ico?url';
import imageJpeg from '@assets/image.jpeg?url';
import imagePng from '@assets/image.png?url';
import imageSvg from '@assets/mobile.svg?url';

const images = [imageIco, imagePng, imageJpeg, imageSvg];

for (const image of images) {
  const el = new Image();
  el.src = image;
  document.body.appendChild(el);
}
