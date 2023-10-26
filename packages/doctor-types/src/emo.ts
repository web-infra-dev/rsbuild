export type WorkspaceCheckDataType = {
  message: string;
  type: 'issues' | 'message' | 'code';
  title: string;
  severity?: EmoCheckSeverity;
  result?:
    | {
        package: string;
        data: Record<string, string | string[]>[];
        tag?: string;
      }
    | { path: string; line?: number; column?: number }[]
    | Record<string, { version: string; pkgname: string }>;
  issues?: string[];
};

export type EmoCheckData = {
  projectInfo: Record<string, string | Object>;
  workspaceRes: Record<string, WorkspaceCheckDataType[]>;
};

export enum EmoCheckSeverity {
  Error,
  Warn,
  Info,
}
