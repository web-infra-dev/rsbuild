export default {
  fetch() {
    return new Response('hello worker');
  },
};

export class Counter {
  count = 0;
}
