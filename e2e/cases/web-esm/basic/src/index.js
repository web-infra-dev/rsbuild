import { message } from './message';
import './style.css';

const testElement = document.createElement('div');
testElement.id = 'test';
testElement.textContent = message;
document.body.appendChild(testElement);
