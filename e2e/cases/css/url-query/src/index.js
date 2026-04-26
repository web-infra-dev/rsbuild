import styleUrl from './style.css?url';

const target = document.createElement('div');
target.id = 'target';
target.className = 'url-query-class';
target.textContent = 'CSS URL query';
document.body.appendChild(target);

window.getCssUrlResult = async () => ({
  styleUrl,
  styleContent: await fetch(styleUrl).then((res) => res.text()),
  targetColor: getComputedStyle(target).color,
});
