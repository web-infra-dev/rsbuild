<template>
  <button id="button" type="button">A</button>
  <p id="scoped-text">Scoped</p>
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

<style scoped>
#scoped-text {
  color: rgb(0, 128, 0);
}
</style>
