import { Hero as BaseHero } from '@rstack-dev/doc-ui/hero';
import { useI18n, useNavigate } from 'rspress/runtime';
import { useI18nUrl } from './utils';

export function Hero() {
  const navigate = useNavigate();
  const tUrl = useI18nUrl();
  const t = useI18n<typeof import('i18n')>();
  const handleClickGetStarted = () => {
    navigate(tUrl('/guide/start/index'));
  };
  const handleClickLearnMore = () => {
    navigate(tUrl('/guide/start/quick-start'));
  };
  return (
    <>
      <style>
        {`.rs-oval {
            width: 70% !important;
            height: 70% !important;
            top: calc(50% + 20px) !important;
            left: calc(50% + 5px) !important;
          }
        `}
      </style>
      <BaseHero
        showStars
        onClickGetStarted={handleClickGetStarted}
        onClickLearnMore={handleClickLearnMore}
        title="Rsbuild"
        subTitle={t('subtitle')}
        description={t('slogan')}
        logoUrl="https://assets.rspack.dev/rsbuild/rsbuild-logo.svg"
        getStartedButtonText={t('Introduction')}
        learnMoreButtonText={t('QuickStart')}
      />
    </>
  );
}
