import { memo } from 'react';
import { usePageData } from 'rspress/runtime';
import styles from './Copyright.module.scss';

export const CopyRight = memo(() => {
  const { siteData } = usePageData();
  const { message } = siteData.themeConfig.footer || {};

  if (!message) {
    return null;
  }

  return (
    <footer className={styles.copyRight}>
      <div className={styles.copyRightInner}>
        <div className={styles.copyRightText}>{message}</div>
      </div>
    </footer>
  );
});
