import './index.css';
import circle from '@assets/circle.svg?url';
import icon from '@assets/icon.png?url';
import image from '@assets/image.png?url';
import mobile from '@assets/mobile.svg?url';

console.log(icon, image, circle, mobile);

import(/* webpackChunkName: "foo" */ './async');
