import {
  DoctorManifestClientRoutes,
  DoctorManifestData,
} from '../../../manifest';
import { API, APIExtends } from './index';

export interface ProjectAPIResponse {
  [API.Env]: {
    ip: string;
    port: number;
  };
  [API.GetProjectInfo]: Pick<
    DoctorManifestData,
    'hash' | 'root' | 'pid' | 'summary' | 'configs' | 'envinfo' | 'errors'
  >;
  [API.GetClientRoutes]: DoctorManifestClientRoutes[];
  [APIExtends.GetCompileProgess]: {
    percentage: number;
    message: string;
  };
}

export interface ProjectAPIResquestBody {}
