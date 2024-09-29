<template>
  <div class="content" @click="color = !color">
    <h1>Rsbuild with Vue</h1>
    <p>Start building amazing things with Rsbuild.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const color = ref(true)
</script>

<style scoped>
content h1 {
  font-size: 3.6rem;
  font-weight: 700;
  /* ok */
  color: v-bind("color ? 'red': 'green'");
  /* no ok */
  color: v-bind('color ? "red": "green"');
}
</style>