/** Babel Error */
export interface Error {
  code: string;
  reasonCode: string;
  message: string;
  name: string;
  stack: string;
  pos?: number;
  loc?: {
    line: number;
    column: number;
  };
}
