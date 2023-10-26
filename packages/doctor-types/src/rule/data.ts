import type { WorkspaceCheckDataType } from '../emo';
import type { RuleMessage, RuleMessageCodeEnumerated } from './code';
import type { SourceRange } from '../sdk';
import type { PackageBasicData } from '../sdk/package';

export interface BaseRuleStoreData
  extends Pick<RuleMessage, 'code' | 'category'> {
  /**
   * unique of error
   */
  id: number | string;
  /**
   * title of alerts
   */
  title: string;
  /**
   * description of alerts
   */
  description?: string;
  /**
   * level of error
   */
  level: 'warn' | 'error';
  /**
   * rule doc link
   */
  link?: string;
}

export interface LinkRuleStoreData extends BaseRuleStoreData {
  type: 'link';
}

export interface DependencyWithPackageData {
  /**
   * use to group files, such as different version of duplicate packages.
   * @example
   * [
   *   { group: "lodash@1.0.1", ... },
   *   { group: "lodash@1.0.1", ... },
   *   { group: "lodash@2.0.0", ... },
   * ]
   */
  group?: string;
  /**
   * module dependency id
   */
  dependencyId: number;
}

export interface PackageRelationData {
  /** Target package data */
  target: PackageBasicData;
  /** Target package size */
  targetSize: { sourceSize: number; parsedSize: number };
  /** package dependency chain */
  dependencies: DependencyWithPackageData[];
}

/**
 * Generally serves to view package relationship detection rules.
 */
export interface PackageRelationDiffRuleStoreData extends BaseRuleStoreData {
  type: 'package-relation';
  packages: PackageRelationData[];
}

/**
 * General service to view file relationship detection rules.
 */
export interface FileRelationRuleStoreData extends BaseRuleStoreData {
  type: 'file-relation';
  /** Target file */
  target: string;
  /** Dependency chain */
  dependencies: number[];
}

/**
 * the rule which code view only
 */
export interface CodeViewRuleStoreData extends BaseRuleStoreData {
  type: 'code-view';
  file: {
    /**
     * file path
     */
    path: string;
    /**
     * the code content
     */
    content: string;
    /**
     * fix highlight range in source
     */
    ranges?: SourceRange[];
  };
}

/**
 * the rule which need to change the file code.
 */
export interface CodeChangeRuleStoreData extends BaseRuleStoreData {
  type: 'code-change';
  file: {
    /**
     * file path
     */
    path: string;
    /**
     * the actual file content
     */
    actual: string;
    /**
     * the expected file content
     */
    expected: string;
    /**
     * fix code line in source
     */
    line?: number;
    /**
     * whether this case is fixed
     *   - @default `false`
     */
    isFixed?: boolean;
  };
}

export interface EMORuleStoreData extends BaseRuleStoreData {
  type: 'emo';
  emoCheckData: WorkspaceCheckDataType;
}

export interface OverlayRuleStoreData extends BaseRuleStoreData {
  code: RuleMessageCodeEnumerated.Overlay;
  stack?: string;
}

export type RuleStoreDataItem =
  | LinkRuleStoreData
  | FileRelationRuleStoreData
  | CodeChangeRuleStoreData
  | PackageRelationDiffRuleStoreData
  | CodeViewRuleStoreData
  | EMORuleStoreData;

export type RuleStoreData = RuleStoreDataItem[];
