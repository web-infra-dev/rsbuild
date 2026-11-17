import { createRoot } from 'react-dom/client';
import { CompiledCounter } from './features/CompiledCounter';
import { ExcludedCounter } from './features/ExcludedCounter.legacy';
import { LegacyCounter } from './legacy/LegacyCounter';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <>
      <CompiledCounter />
      <ExcludedCounter />
      <LegacyCounter />
    </>,
  );
}
