import css from './style.modules.css';
import scss from './style.modules.scss';
import less from './style.modules.less';

for (const [extension, styles] of Object.entries({ css, scss, less })) {
  const element = document.createElement('div');
  element.id = extension;
  element.className = styles.title;
  element.textContent = extension;
  document.body.appendChild(element);
}
