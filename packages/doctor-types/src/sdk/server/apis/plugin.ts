import { API } from './index';
import { PluginHookData } from '../../plugin';

export interface PluginAPIResponse {
  [API.GetPluginSummary]: {
    hooks: string[];
    tapNames: string[];
  };

  [API.GetPluginData]: {
    hook: string;
    tapName: string;
    data: Pick<PluginHookData, 'startAt' | 'endAt' | 'type' | 'costs'>[];
  }[];
}

export interface PluginAPIResquestBody {
  [API.GetPluginData]: {
    hooks?: string[];
    tapNames?: string[];
  };
}
