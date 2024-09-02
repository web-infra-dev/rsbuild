import { Hero as BaseHero } from '@rstack-dev/doc-ui/hero';
import { useNavigate } from 'rspress/runtime';
import { useI18nUrl } from './utils';

export function Hero() {
  const navigate = useNavigate();
  const tUrl = useI18nUrl();
  const handleClickGetStarted = () => {
    navigate(tUrl('/guide/start/index'));
  };
  const handleClickLearnMore = () => {
    navigate(tUrl('/guide/start/quick-start'));
  };
  return (
    <>
      <style>
        {`
:root {
  --rs-hero-title-gradient: -webkit-linear-gradient(120deg, var(--rp-c-brand) 30%, #42d392);
  --rs-hero-button-gradient: linear-gradient(275deg, var(--rp-c-brand-dark) 3%, var(--rp-c-brand-light) 97%);
  --rs-hero-button-border: #0095ff;

  --rs-hero-oval-background: conic-gradient(from 180deg at 50% 50%,var(--rp-c-brand)0deg,180deg,#42d392 1turn);
  --rs-hero-oval-filter: blur(30px); 
}
`}
      </style>
      <BaseHero
        onClickGetStarted={handleClickGetStarted}
        onClickLearnMore={handleClickLearnMore}
        title="Rsbuild"
        subTitle="The Rspack Powered Build Tool"
        description="Build your web application instantly"
        logoUrl="https://assets.rspack.dev/rsbuild/rsbuild-logo.svg"
        getStartedButtonText="Introduction"
        learnMoreButtonText="Quick Start"
      />
    </>
  );
}
