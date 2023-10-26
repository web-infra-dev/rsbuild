export interface ProcessData {
  /**
   * process id
   */
  pid: number;
  /**
   * parent process id
   */
  ppid: number | null;
}
