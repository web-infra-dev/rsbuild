import { API } from './index';
import { PathResolverData } from '../../resolver';

export interface ResolverAPIResponse {
  [API.GetResolverFileTree]: Array<Pick<PathResolverData, 'issuerPath'>>;
  [API.GetResolverFileDetails]: {
    filepath: string;
    before: string;
    after: string;
    resolvers: (PathResolverData & { costs: number })[];
  };
}

export interface ResolverAPIResquestBody {
  [API.GetResolverFileDetails]: { filepath: string };
}
