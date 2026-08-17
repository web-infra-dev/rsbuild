import { getMessage } from './shared';

const testElement = document.createElement('div');
testElement.id = 'test';
testElement.textContent = getMessage('Other');
document.body.appendChild(testElement);
