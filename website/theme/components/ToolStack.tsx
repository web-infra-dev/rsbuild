import { containerStyle } from '@rstack-dev/doc-ui/section-style';
import { ToolStack as BaseToolStack } from '@rstack-dev/doc-ui/tool-stack';
import { useLang } from 'rspress/runtime';

export function ToolStack() {
  const lang = useLang();
  return (
    <section className={containerStyle}>
      <BaseToolStack lang={lang} />
    </section>
  );
}
