import { RsbuildTarget, NormalizedConfig } from '../types';

export const isHtmlDisabled = (
  config: NormalizedConfig,
  target: RsbuildTarget,
) => {
  const { htmlPlugin } = config.tools as {
    htmlPlugin: boolean | Array<unknown>;
  };
  return (
    htmlPlugin === false ||
    (Array.isArray(htmlPlugin) && htmlPlugin.includes(false)) ||
    target !== 'web'
  );
};
