
import { CliTask, ECliTaskAction, ICliTaskActionLog, ICliTaskConfig } from './CliTask';

export abstract class CliVersionTask extends CliTask {

  constructor(taskConfig: ICliTaskConfig) {
    super(taskConfig);
  }

  protected create_CreateFuncActionLog(): ICliTaskActionLog {
    return {
      action: ECliTaskAction.CREATE_FIRST_VERSION,
      info: "TBD"
    };
  }

  protected create_UpdateFuncActionLog(): ICliTaskActionLog {
    return {
      action: ECliTaskAction.CREATE_NEW_VERSION,
      info: "TBD"
    };
  }

}
