<template>
  <h2>Ts Import</h2>
  <p class="ts-import">{{ foo }}</p>

  <Bar />
</template>

<script setup lang="tsx">
import { foo } from './TsImportFile';

const Bar = () => (
  <div class="bar">
    <p>Bar</p>
  </div>
);
</script>
