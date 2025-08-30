// Generic constraint examples for testing
export interface Identifiable {
  id: string;
}

export interface Person {
  id: string;
  name: string;
  age: number;
}

export interface Product {
  id: string;
  title: string;
  price: number;
}

// Generic function with extends constraint
export function getById<T extends Identifiable>(
  items: T[],
  id: string,
): T | undefined {
  return items.find((item) => item.id === id);
}

// Generic function with keyof constraint
export function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic class with constraint
export class Collection<T extends Identifiable> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  findById(id: string): T | undefined {
    return this.items.find((item) => item.id === id);
  }

  getAll(): T[] {
    return [...this.items];
  }

  getIds(): string[] {
    return this.items.map((item) => item.id);
  }
}

// Utility type with constraints
export type PickRequired<T, K extends keyof T> = Required<Pick<T, K>>;

// More complex constraint
export function updateEntity<T extends Identifiable>(
  entity: T,
  updates: Partial<Omit<T, 'id'>>,
): T {
  return { ...entity, ...updates };
}
