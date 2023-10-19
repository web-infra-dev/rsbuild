import path from 'path';
import { RsbuildTarget, SharedNormalizedConfig } from '../types';

export function getTemplatePath(
  entryName: string,
  config: SharedNormalizedConfig,
) {
  const DEFAULT_TEMPLATE = path.resolve(
    __dirname,
    '../../static/template.html',
  );
  const { template = DEFAULT_TEMPLATE, templateByEntries = {} } = config.html;
  return templateByEntries[entryName] || template;
}

export const isHtmlDisabled = (
  config: SharedNormalizedConfig,
  target: RsbuildTarget,
) => {
  const { htmlPlugin } = config.tools as {
    htmlPlugin: boolean | Array<unknown>;
  };
  return (
    htmlPlugin === false ||
    (Array.isArray(htmlPlugin) && htmlPlugin.includes(false)) ||
    target === 'node' ||
    target === 'web-worker' ||
    target === 'service-worker'
  );
};
