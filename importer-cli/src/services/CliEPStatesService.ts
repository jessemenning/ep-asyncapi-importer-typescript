import { ECliAssetImportTargetLifecycleState, TAssetImportTargetLifecycleState } from '../CliConfig';
import { CliError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { CliUtils } from '../CliUtils';
import {
  StatesResponse, 
  StatesService 
} from '@solace-iot-team/ep-openapi-node';
import EpSdkStatesService from "@solace-iot-team/ep-sdk/services/EpSdkStatesService";

/**
 * EP Asset States.
 * Hard-coded, needs to check at initialize.
 */
class CliEPStatesService {

  public initialize = async(): Promise<void> => {
    const funcName = 'initialize';
    const logName = `${CliEPStatesService.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING }));

    const stateResponse: StatesResponse = await StatesService.getStates();

    // stateResponse.
    // const stateDTOList: Array<StateDTO> = await StatesService.listStates()

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZED, details: {
      stateResponse: stateResponse,
    }}));

  }

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

