<template>
  <div>
    <h1>Rsbuild + Vue</h1>

    <div class="card">
      <button type="button" @click="count++">count is {{ count }}</button>
      <p>
        Edit
        <code>App.vue</code> to test HMR
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  data() {
    return { count: 0 };
  },
});
</script>

<style scoped>
.card {
  padding: 2em;
}
</style>
