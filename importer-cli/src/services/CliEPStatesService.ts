import { ECliAssetImportTargetLifecycleState, TAssetImportTargetLifecycleState } from '../CliConfig';
import { CliError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { CliUtils } from '../CliUtils';
import { StatesResponse, StatesService } from '../_generated/@solace-iot-team/sep-openapi-node';


/**
 * EP Asset States.
 * Hard-coded, needs to check at initialize.
 */
class CliEPStatesService {

  private readonly _draftId: string = "1";
  private readonly _releasedId: string = "2";
  private readonly _deprecatedId: string = "3";
  private readonly _retiredId: string = "4";

  public initialize = async(): Promise<void> => {
    const funcName = 'initialize';
    const logName = `${CliEPStatesService.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING }));

    const stateResponse: StatesResponse = await StatesService.listStates();

    // stateResponse.
    // const stateDTOList: Array<StateDTO> = await StatesService.listStates()

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZED, details: {
      stateResponse: stateResponse,
    }}));

  }

  public get draftId() {
    return this._draftId;
  }

  public get releasedId() {
    return this._releasedId;
  }

  public get deprecatedId() {
    return this._deprecatedId;
  }

  public get retiredId() {
    return this._retiredId;
  }

  public getTargetLifecycleState({ assetImportTargetLifecycleState }:{
    assetImportTargetLifecycleState: TAssetImportTargetLifecycleState;
  }): string {
    const funcName = 'getTargetLifecycleState';
    const logName = `${CliEPStatesService.name}.${funcName}()`;

    const type: ECliAssetImportTargetLifecycleState = assetImportTargetLifecycleState.type;
    switch(type) {
      case ECliAssetImportTargetLifecycleState.DRAFT:
        return this.draftId;
      case ECliAssetImportTargetLifecycleState.RELEASED:
        return this.releasedId;
      default:
        CliUtils.assertNever(logName, type);
    }
    throw new CliError(logName, "should never get here");
  }
}

export default new CliEPStatesService();

