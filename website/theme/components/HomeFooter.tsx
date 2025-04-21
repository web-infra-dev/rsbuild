import { memo } from 'react';
import { useLang } from 'rspress/runtime';
import { useI18n } from 'rspress/runtime';
import { Link } from 'rspress/theme';
import styles from './HomeFooter.module.scss';

function useFooterData() {
  const t = useI18n<typeof import('i18n')>();
  const lang = useLang();
  const getLink = (link: string) => (lang === 'en' ? link : `/${lang}${link}`);

  return [
    {
      title: t('guide'),
      items: [
        {
          title: t('introduction'),
          link: getLink('/guide/start/index'),
        },
        {
          title: t('quickStart'),
          link: getLink('/guide/start/quick-start'),
        },
        {
          title: t('features'),
          link: getLink('/guide/start/features'),
        },
        {
          title: t('migration'),
          link: getLink('/guide/migration/webpack'),
        },
      ],
    },
    {
      title: 'API',
      items: [
        {
          title: t('cli'),
          link: getLink('/guide/basic/cli'),
        },
        {
          title: t('configuration'),
          link: getLink('/guide/configuration/rsbuild'),
        },
        {
          title: t('pluginApi'),
          link: getLink('/plugins/dev/index'),
        },
        {
          title: 'JavaScript API',
          link: getLink('/api/start/index'),
        },
      ],
    },
    {
      title: t('ecosystem'),
      items: [
        {
          title: 'Rspack',
          link: 'https://rspack.dev/',
        },
        {
          title: 'Rspress',
          link: 'https://rspress.dev/',
        },
        {
          title: 'Rsdoctor',
          link: 'https://rsdoctor.dev/',
        },
        {
          title: 'Rslib',
          link: 'https://lib.rsbuild.dev/',
        },
      ],
    },
    {
      title: t('community'),
      items: [
        {
          title: 'GitHub',
          link: 'https://github.com/web-infra-dev/rsbuild',
        },
        {
          title: 'Discord',
          link: 'https://discord.gg/sYK4QjyZ4V',
        },
        {
          title: 'Twitter (X)',
          link: 'https://twitter.com/rspack_dev',
        },
        {
          title: 'Awesome Rspack',
          link: 'https://github.com/web-infra-dev/awesome-rspack',
        },
      ],
    },
  ];
}

export const HomeFooter = memo(() => {
  const footerData = useFooterData();
  return (
    <div className={styles.footer}>
      <div className={styles.container}>
        {footerData.map((item) => (
          <div key={item.title} className={styles.column}>
            <h2>{item.title}</h2>
            <ul>
              {item.items.map((subItem) => (
                <li key={subItem.title}>
                  <Link href={subItem.link}>
                    <span className={styles.text}>{subItem.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
});
