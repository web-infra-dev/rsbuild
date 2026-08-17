import { message } from './shared';

const testElement = document.createElement('div');
testElement.id = 'test';
testElement.textContent = message;
document.body.appendChild(testElement);
