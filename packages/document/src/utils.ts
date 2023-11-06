import { useLang, withBase, usePageData } from 'rspress/runtime';

export function useUrl(url: string) {
  const lang = useLang();
  const {
    siteData: { lang: defaultLang },
  } = usePageData();
  return withBase(lang === defaultLang ? url : `/${lang}${url}`);
}
