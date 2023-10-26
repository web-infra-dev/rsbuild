import { Document } from './document';

const store = new Map<string, Document>();

/** Create Document */
export function getDocument(content: string) {
  if (store.has(content)) {
    return store.get(content)!;
  }

  const doc = new Document(content);
  store.set(content, doc);
  return doc;
}

export function clearDocument() {
  store.clear();
}
