import { defineCustomElement } from 'vue';
import MyElement from './MyElement.ce.vue';

customElements.define('my-element', defineCustomElement(MyElement));
document
  .getElementById('root')
  .appendChild(document.createElement('my-element'));
