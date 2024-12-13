import { createContext } from 'react';

export interface Assets {
  scriptTags: string[];
  styleTags: string[];
}

export const AssetsContext = createContext<Assets>({
  scriptTags: [],
  styleTags: [],
});
