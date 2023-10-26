<template>
  <div>
    <h1>Rsbuild + Vue</h1>

    <div class="card">
      <button type="button" @click="count++">count is {{ count }}</button>
      <p>
        Edit
        <code>components/HelloWorld.vue</code> to test HMR
      </p>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    msg: {
      type: String,
    },
  },
  data() {
    return { count: 0 };
  },
};
</script>

<style scoped>
.card {
  padding: 2em;
}
</style>
