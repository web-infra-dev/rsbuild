import {
  containerStyle,
  innerContainerStyle,
} from '@rstack-dev/doc-ui/section-style';
import { useI18n } from 'rspress/runtime';
import { HomeFeature } from 'rspress/theme';

export function WhyRsbuild() {
  const t = useI18n<typeof import('i18n')>();
  const features = {
    features: [
      {
        title: 'Rspack-based',
        details: t('RspackBasedDesc'),
        icon: '🚀',
      },
      {
        title: 'Batteries Included',
        details: t('BatteriesIncludedDesc'),
        icon: '🦄',
      },
      {
        title: 'Framework Agnostic',
        details: t('FrameworkAgnosticDesc'),
        icon: '🎯',
      },
      {
        title: 'Deep Optimization',
        details: t('DeepOptimizationDesc'),
        icon: '🛠️',
      },
      {
        title: 'Highly Pluggable',
        details: t('HighlyPluggableDesc'),
        icon: '🎨',
      },
      {
        title: 'Easy to Configure',
        details: t('EasyToConfigureDesc'),
        icon: '🍭',
      },
    ],
  };
  return (
    <>
      <style>
        {`.max-w-6xl.flex.m-auto {
           max-width: 1440px;
          }
          html.dark {
            --rp-home-feature-bg: linear-gradient(
              135deg,
              rgba(255, 255, 255, 0),
              rgba(255, 255, 255, 0.03)
            );
          }
      `}
      </style>
      <section className={containerStyle}>
        <div className={innerContainerStyle}>
          <HomeFeature frontmatter={features} routePath="/" />
        </div>
      </section>
    </>
  );
}
