import { Hero as BaseHero } from '@rstack-dev/doc-ui/hero';
import { useI18n, useNavigate } from 'rspress/runtime';
import { useI18nUrl } from './utils';
import './Hero.module.scss';

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
    <BaseHero
      showStars
      onClickGetStarted={handleClickGetStarted}
      onClickLearnMore={handleClickLearnMore}
      title="Rsbuild"
      subTitle={t('subtitle')}
      description={t('slogan')}
      logoUrl="https://assets.rspack.dev/rsbuild/rsbuild-logo.svg"
      getStartedButtonText={t('introduction')}
      learnMoreButtonText={t('quickStart')}
    />
  );
}
