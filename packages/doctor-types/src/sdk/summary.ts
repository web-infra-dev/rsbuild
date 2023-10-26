interface SummaryCostsData {
  /**
   * such as 'bootstrap' / 'compile' / 'minify' or else.
   */
  name: string;
  /**
   * the start timestamp of the data.
   */
  startAt: number;
  costs: number;
}

export interface SummaryData {
  /**
   * costs of different data.
   */
  costs: SummaryCostsData[];
}
