import { defineComponent, ref } from 'vue';

const Default = defineComponent(() => {
  const count = ref(3);
  const inc = () => count.value++;

  return () => (
    <button class="default-tsx" onClick={inc} type="button">
      default tsx {count.value}
    </button>
  );
});

export default Default;
