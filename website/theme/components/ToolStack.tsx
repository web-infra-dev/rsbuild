import {
  containerStyle,
  descStyle,
  innerContainerStyle,
  titleAndDescStyle,
  titleStyle,
} from '@rstack-dev/doc-ui/section-style';
import { ToolStack as BaseToolStack } from '@rstack-dev/doc-ui/tool-stack';
import { useLang } from 'rspress/runtime';
import { useI18n } from 'rspress/runtime';

export function ToolStack() {
  const t = useI18n<typeof import('i18n')>();
  const lang = useLang();
  return (
    <section className={containerStyle}>
      <div className={innerContainerStyle}>
        <div className={titleAndDescStyle}>
          <h1 className={titleStyle}>{t('toolStackTitle')}</h1>
          <p className={descStyle}>{t('toolStackDesc')}</p>
        </div>
        <BaseToolStack lang={lang} />
      </div>
    </section>
  );
}
