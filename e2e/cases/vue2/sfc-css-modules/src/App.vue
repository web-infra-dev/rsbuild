<template>
  <div>
    <p id="test1" :class="{ [$style.red]: isRed }">Red</p>
    <p id="test2" :class="[$style.red, $style.blue]">Blue</p>
    <p id="test3" :class="style.green">Green</p>
  </div>
</template>

<script>
import style from './style.module.css';

export default {
  data() {
    return {
      style,
      isRed: true,
    };
  },
};
</script>

<style module>
.red {
  color: red;
}
.blue {
  color: blue;
}
</style>
