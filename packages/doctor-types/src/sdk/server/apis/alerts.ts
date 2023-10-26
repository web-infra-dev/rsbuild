import { API } from './index';
import { OverlayRuleStoreData, RuleStoreDataItem } from '../../../rule';
import { DependencyData, ModuleData, ModuleSource } from '../../module';
import { PackageBasicData } from '../../package';

export interface AlertsAPIResponse {
  /**
   * get the details of the alerts which type is "package-relation"
   */
  [API.GetPackageRelationAlertDetails]: {
    group: string | void;
    module: ModuleData;
    dependency: DependencyData;
    relativePath: string;
    moduleCode: ModuleSource;
  }[];
  /**
   * get the alerts list which use to display in overlay at the client page
   */
  [API.GetOverlayAlerts]: OverlayRuleStoreData[];
}

export interface AlertsAPIResquestBody {
  [API.GetPackageRelationAlertDetails]: {
    id: RuleStoreDataItem['id'];
    target: PackageBasicData;
  };
}
