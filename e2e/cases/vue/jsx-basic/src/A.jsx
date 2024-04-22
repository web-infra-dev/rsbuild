import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'Test',

  setup() {
    const count = ref(0);
    return () => (
      <button id="button1" type="button" onClick={() => count.value++}>
        A: {count.value}
      </button>
    );
  },
});
