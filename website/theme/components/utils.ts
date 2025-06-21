import { useCallback } from 'react';
import { useLang, usePageData, withBase } from 'rspress/runtime';

export function useI18nUrl() {
  const lang = useLang();
  const {
    siteData: { lang: defaultLang },
  } = usePageData();
  return useCallback(
    (url: string) => withBase(lang === defaultLang ? url : `/${lang}${url}`),
    [lang, defaultLang],
  );
}
