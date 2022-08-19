import { ECliAssetImportTargetLifecycleState, TAssetImportTargetLifecycleState } from '../CliConfig';
import { CliError } from '../CliError';
import { CliUtils } from '../CliUtils';
import {
  EpSdkStatesService 
} from "@solace-labs/ep-sdk";

class CliEPStatesService {

  public getTargetLifecycleState({ assetImportTargetLifecycleState }:{
    assetImportTargetLifecycleState: TAssetImportTargetLifecycleState;
  }): string {
    const funcName = 'getTargetLifecycleState';
    const logName = `${CliEPStatesService.name}.${funcName}()`;

    const type: ECliAssetImportTargetLifecycleState = assetImportTargetLifecycleState.type;
    switch(type) {
      case ECliAssetImportTargetLifecycleState.DRAFT:
        return EpSdkStatesService.draftId;
      case ECliAssetImportTargetLifecycleState.RELEASED:
        return EpSdkStatesService.releasedId;
      default:
        CliUtils.assertNever(logName, type);
    }
    throw new CliError(logName, "should never get here");
  }
}

export default new CliEPStatesService();

