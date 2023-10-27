/**
 * Location
 * - line starting point is 1
 * - column starting point is 0
 */
export interface Position {
  line: number;
  column: number;
}

/** Location range */
export interface Range {
  start: Position;
  end: Position;
}

/** Offset range */
export interface OffsetRange {
  start: number;
  end: number;
}

/** Text repair data */
export interface DocumentEditData {
  /** Modify the starting position of string in the original text */
  start: number | Position;
  /** Modify string in the key position of the original text */
  end: number | Position;
  /**
   * Replaced new text
   * - If empty, delete the original text
   */
  newText?: string;
}
