<template>
  <button id="button" type="button">A</button>
</template>

<script>
export default {};
</script>

<style>
#button {
  color: red;
  background-color: green;
}
</style>

<style lang="less">
body {
  // this case is to test if loaders run twice
  // if the next line is transformed twice, less will throw.
  padding: -webkit-calc(~'16px + env(safe-area-inset-bottom)');
}
</style>
