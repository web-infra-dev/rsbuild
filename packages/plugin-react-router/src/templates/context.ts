import { createContext } from 'react';
import type { Context } from 'react';

export interface Assets {
  scriptTags: string[];
  styleTags: string[];
}

export const AssetsContext: Context<Assets> = createContext<Assets>({
  scriptTags: [],
  styleTags: [],
});
