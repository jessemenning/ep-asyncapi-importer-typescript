import { CliLogger, ECliStatusCodes } from '../CliLogger';
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

    const stateResponse: StatesResponse = await StatesService.listStates();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, details: {
      stateResponse: stateResponse,
    }}));

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

}

export default new CliEPStatesService();

