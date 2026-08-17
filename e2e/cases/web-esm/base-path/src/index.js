const loadButton = document.createElement('button');
loadButton.id = 'load';
loadButton.textContent = 'Load async chunk';
loadButton.addEventListener('click', async () => {
  const { renderAsyncContent } = await import('./async');
  renderAsyncContent();
});
document.body.appendChild(loadButton);
