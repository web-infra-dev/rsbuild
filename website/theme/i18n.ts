import { useLang } from 'rspress/runtime';

export const EN_US = {
  benchmarkTitle: 'Lightning Fast',
  benchmarkDesc:
    'Combining Rust and TypeScript with a parallelized architecture to bring you the ultimate developer experience.',
} as const;

export const ZH_CN: Record<keyof typeof EN_US, string> = {
  benchmarkTitle: '极快的构建速度',
  benchmarkDesc:
    '基于 Rust 和 TypeScript 的高度并行、增量编译架构，构建性能极佳，带来极致的开发体验。',
};

const translations = {
  en: EN_US,
  zh: ZH_CN,
} as const;

export function useI18n() {
  const lang = useLang() as keyof typeof translations;
  return (key: keyof typeof EN_US) => translations[lang][key];
}
