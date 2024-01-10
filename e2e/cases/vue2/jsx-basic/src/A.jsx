import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Test',

  data() {
    return {
      count: 0,
    };
  },

  render() {
    return (
      <button id="button1" type="button" onClick={() => this.count++}>
        A: {this.count}
      </button>
    );
  },
});
