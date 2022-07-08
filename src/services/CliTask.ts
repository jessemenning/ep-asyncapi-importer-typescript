
import { AbstractMethodError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { CliUtils } from '../CliUtils';
import { CliAsyncApiDocument } from './CliAsyncApiDocument';

export enum ECliTaskState {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT"
}
export interface ICliTaskConfig {
  cliAsyncApiDocument: CliAsyncApiDocument;
  cliTaskState: ECliTaskState;
}
export interface ICliTaskKeys {}
export interface ICliGetFuncReturn {
  documentExists: boolean;
}

export abstract class CliTask {
  private cliTaskConfig: ICliTaskConfig;

  constructor(taskConfig: ICliTaskConfig) {
    this.cliTaskConfig = taskConfig;
  }

  protected get_CliAsyncApiDocument(): CliAsyncApiDocument { return this.cliTaskConfig.cliAsyncApiDocument; }

  protected get_CliTaskConfig(): ICliTaskConfig { return this.cliTaskConfig; }

  protected abstract getTaskKeys(): ICliTaskKeys;

  protected async getFunc(cliTaskKeys: ICliTaskKeys): Promise<ICliGetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${this.constructor.name}.${funcName}()`;
    cliTaskKeys;
    throw new AbstractMethodError(logName, CliTask.name, funcName);
  };

  protected async createFunc(): Promise<void> {
    const funcName = 'createFunc';
    const logName = `${this.constructor.name}.${funcName}()`;
    throw new AbstractMethodError(logName, CliTask.name, funcName);
  }

  private async executePresent(cliGetFuncReturn: ICliGetFuncReturn): Promise<void> {
    if(!cliGetFuncReturn.documentExists) await this.createFunc();
  }

  public async execute(): Promise<void> { 
    const funcName = 'execute';
    const logName = `${this.constructor.name}.${funcName}()`;

    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK, details: "starting ..." }));

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK, details: {
      asyncApiDocument: this.cliTaskConfig.cliAsyncApiDocument.getLogInfo()
    }}));

    const cliGetFuncReturn: ICliGetFuncReturn = await this.getFunc(this.getTaskKeys());
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      cliGetFuncReturn: cliGetFuncReturn
    }}));

    switch(this.cliTaskConfig.cliTaskState) {
      case ECliTaskState.PRESENT:
        await this.executePresent(cliGetFuncReturn);
        break;
      case ECliTaskState.ABSENT:
        throw new Error(`${logName}: implement absent`)
        break;
      default:
        CliUtils.assertNever(logName, this.cliTaskConfig.cliTaskState);
    }

    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: "done." }));

  }


}
