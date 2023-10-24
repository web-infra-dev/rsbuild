const add = (a: number, b: number) => a + b;

// this is a type error
const res = add(1, '2');

console.log('res', res);
