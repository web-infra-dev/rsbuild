import styleUrl from './style.styl?url';

const target = document.createElement('div');
target.className = 'url-query-stylus';
target.textContent = 'Stylus URL query';
document.body.appendChild(target);

window.getStylusUrlResult = async () => ({
  styleContent: await fetch(styleUrl).then((res) => res.text()),
  styleUrl,
  targetColor: getComputedStyle(target).color,
});
