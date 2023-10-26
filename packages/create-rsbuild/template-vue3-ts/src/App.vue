<script setup>
import { ref } from 'vue';

defineProps({
  msg: {
    type: String,
  },
});

const count = ref(0);
</script>

<template>
  <h1>Rsbuild + Vue</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>

<style scoped>
.card {
  padding: 2em;
}
</style>
