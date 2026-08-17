// This is a type error
let num: number;
num = '2'; // rslint-disable-line prefer-const -- intentional type-error fixture

console.log(num);
