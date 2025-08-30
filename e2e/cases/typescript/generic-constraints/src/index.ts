import {
  Collection,
  getById,
  getProperty,
  type Person,
  type Product,
  updateEntity,
} from './utils';

declare global {
  interface Window {
    testResults: {
      getByIdResult: string;
      getPropertyResult: string;
      collectionResult: {
        findResult: string;
        allIds: string[];
      };
      updateResult: string;
    };
  }
}

// Test data
const people: Person[] = [
  { id: '1', name: 'Alice', age: 25 },
  { id: '2', name: 'Bob', age: 30 },
];

const products: Product[] = [
  { id: 'p1', title: 'Laptop', price: 999 },
  { id: 'p2', title: 'Mouse', price: 29 },
];

// Test generic function with extends constraint
const foundPerson = getById(people, '2');
const foundProduct = getById(products, 'p1');

// Test generic function with keyof constraint
const personName = getProperty(people[0], 'name');
const productPrice = getProperty(products[0], 'price');

// Test generic class with constraint
const personCollection = new Collection<Person>();
personCollection.add({ id: '3', name: 'Charlie', age: 35 });
personCollection.add({ id: '4', name: 'Diana', age: 28 });
const foundInCollection = personCollection.findById('4');

// Test utility type and complex constraint
const originalPerson: Person = { id: '5', name: 'Eve', age: 32 };
const updatedPerson = updateEntity(originalPerson, { age: 33 });

// Store results on window for testing
window.testResults = {
  getByIdResult: `${foundPerson?.name}-${foundProduct?.title}`,
  getPropertyResult: `${personName}-${productPrice}`,
  collectionResult: {
    findResult: foundInCollection?.name || 'not found',
    allIds: personCollection.getIds(),
  },
  updateResult: `${updatedPerson.name}-${updatedPerson.age}`,
};
