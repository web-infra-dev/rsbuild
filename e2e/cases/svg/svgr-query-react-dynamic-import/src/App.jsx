export async function getApp() {
  const name = 'small';
  const { default: Component } = await import(`./${name}.svg?react`);
  const { default: url } = await import(`./${name}.svg?url`);

  return () => (
    <div>
      <Component id="component" />
      <img id="url" src={url} alt="url" />
    </div>
  );
}
