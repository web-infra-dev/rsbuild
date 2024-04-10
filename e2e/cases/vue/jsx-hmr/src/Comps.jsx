import { defineComponent, ref } from 'vue';

export const Named = defineComponent(() => {
  const count = ref(0);
  const inc = () => count.value++;

  return () => (
    <button class="named" onClick={inc} type="button">
      named {count.value}
    </button>
  );
});

const NamedSpec = defineComponent(() => {
  const count = ref(1);
  const inc = () => count.value++;

  return () => (
    <button class="named-specifier" onClick={inc} type="button">
      named specifier {count.value}
    </button>
  );
});
export { NamedSpec };

export default defineComponent(() => {
  const count = ref(2);
  const inc = () => count.value++;

  return () => (
    <button class="default" onClick={inc} type="button">
      default {count.value}
    </button>
  );
});
