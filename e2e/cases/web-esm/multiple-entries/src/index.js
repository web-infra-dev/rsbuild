import { getMessage } from './shared';

const testElement = document.createElement('div');
testElement.id = 'test';
testElement.textContent = getMessage('Index');
document.body.appendChild(testElement);
