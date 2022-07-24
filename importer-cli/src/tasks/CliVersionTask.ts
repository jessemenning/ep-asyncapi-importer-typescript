
import { CliTask, ECliTaskAction, ICliTaskActionLog, ICliTaskConfig, ICliTaskIsUpdateRequiredReturn } from './CliTask';

export interface ICliVersionTask_ActionLog extends ICliTaskActionLog {  
}
export interface ICliVersionTask_IsUpdateRequiredReturn extends ICliTaskIsUpdateRequiredReturn {
}

export abstract class CliVersionTask extends CliTask {

  constructor(taskConfig: ICliTaskConfig) {
    super(taskConfig);
  }

  protected create_CreateFuncActionLog(): ICliTaskActionLog {
    return {
      ...super.create_CreateFuncActionLog(),
      action: ECliTaskAction.CREATE_FIRST_VERSION,
    };
  }

  protected create_UpdateFuncActionLog({ cliTaskIsUpdateRequiredReturn }:{
    cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn;
  }): ICliTaskActionLog {
    return {
      ...super.create_UpdateFuncActionLog({ cliTaskIsUpdateRequiredReturn: cliTaskIsUpdateRequiredReturn }),
      action: ECliTaskAction.CREATE_NEW_VERSION,
    };
  }

}
