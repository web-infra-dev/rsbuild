import { useLang } from 'rspress/runtime';

export const EN_US = {
  toolStackTitle: 'Tool Stack',
  toolStackDesc:
    'High-performance tool stack built around Rspack to boost modern web development',
  benchmarkTitle: 'Lightning Fast',
  benchmarkDesc:
    'Combining Rust and TypeScript with a parallelized architecture to bring you the ultimate developer experience',
} as const;

export const ZH_CN: Record<keyof typeof EN_US, string> = {
  toolStackTitle: '工具栈',
  toolStackDesc: '围绕 Rspack 打造的高性能工具栈，助力现代 Web 开发',
  benchmarkTitle: '构建极快',
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
