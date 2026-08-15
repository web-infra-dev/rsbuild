import { message } from './message.js';

console.log(message);

import(/* rspackChunkName: "featureA" */ './featureA.js');
import(/* rspackChunkName: "featureB" */ './featureB.js');
