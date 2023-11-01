import { SDK } from '@rsbuild/doctor-types';

export interface DataWithUrl {
  name: string;
  files:
    | {
        path: string;
        basename: string;
        content: Buffer;
      }[]
    | string;
}

export interface DoctorSDKOptions {
  name: string;
  root: string;
}

/**
 * sdk options for builder.
 */
export interface DoctorBuilderSDK extends DoctorSDKOptions {
  type?: SDK.ToDataType;
  /**
   * port for client server
   */
  port?: number;
  noServer?: boolean;
  config?: SDK.SDKOptionsType;
}

export interface DoctorWebpackSDKOptions extends DoctorBuilderSDK {}

export interface DoctorEMOSDKOptions extends DoctorSDKOptions {}
