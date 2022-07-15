
import { AbstractMethodError, EPApiResponseApiError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { CliUtils } from '../CliUtils';
import { ApiError } from '../_generated/@solace-iot-team/sep-openapi-node';

export enum ECliTaskState {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT"
}
export interface ICliTaskConfig {
  cliTaskState: ECliTaskState;
}
export interface ICliTaskKeys {}
export interface ICliGetFuncReturn {
  documentExists: boolean;
  apiObject: any;
}
export interface ICliCreateFuncReturn {
  apiObject: any;
}
export interface ICliUpdateFuncReturn {
  apiObject: any;
}
export interface ICliTaskExecuteReturn {
  cliTaskState: ECliTaskState;
  apiObject: any;
}
export interface ICliTaskDeepCompareResult {
  isEqual: boolean;
  difference: any;
}

export abstract class CliTask {
  protected cliTaskConfig: ICliTaskConfig;

  private createCleanCompareObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (_k, v) => {
      if(v === null) return undefined;
      return v;
    }));
  }
  protected prepareCompareObject4Output(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (_k,v) => {
      if(v === undefined) return 'undefined';
      return v;
    }));
  }
  protected deepCompareObjects({ existingObject, requestedObject }:{
    existingObject: any;
    requestedObject: any;
  }): ICliTaskDeepCompareResult {
    const cleanExistingObject = this.createCleanCompareObject(existingObject);
    const cleanRequestedObject = this.createCleanCompareObject(requestedObject);
    const isEqual = CliUtils.isEqualDeep(cleanExistingObject, cleanRequestedObject);
    let deepDiffResult: any = undefined;
    if(!isEqual) {
      deepDiffResult = CliUtils.deepDiff(cleanExistingObject, cleanRequestedObject);
    }
    return {
      isEqual: isEqual,
      difference: deepDiffResult
    };
  }

  constructor(taskConfig: ICliTaskConfig) {
    this.cliTaskConfig = taskConfig;
  }

  // protected get_CliAsyncApiDocument(): CliAsyncApiDocument { return this.cliTaskConfig.cliAsyncApiDocument; }

  protected abstract getTaskKeys(): ICliTaskKeys;

  protected async getFunc(cliTaskKeys: ICliTaskKeys): Promise<ICliGetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliTask.name}.${funcName}()`;
    cliTaskKeys;
    throw new AbstractMethodError(logName, CliTask.name, funcName);
  };

  protected async createFunc(): Promise<ICliCreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliTask.name}.${funcName}()`;
    throw new AbstractMethodError(logName, CliTask.name, funcName);
  }

  protected async updateFunc(cliGetFuncReturn: ICliGetFuncReturn): Promise<ICliUpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliTask.name}.${funcName}()`;
    cliGetFuncReturn;
    throw new AbstractMethodError(logName, CliTask.name, funcName);
  }

  protected abstract isUpdateRequired({ cliGetFuncReturn }:{
    cliGetFuncReturn: ICliGetFuncReturn
  }): boolean;

  private async executePresent(cliGetFuncReturn: ICliGetFuncReturn): Promise<ICliTaskExecuteReturn> {
    if(!cliGetFuncReturn.documentExists) {
      const createFuncReturn: ICliCreateFuncReturn = await this.createFunc();
      return {
        cliTaskState: ECliTaskState.PRESENT,
        apiObject: createFuncReturn.apiObject,
      };
    } else {
      // check if update required
      const isUpdateRequired: boolean = this.isUpdateRequired({
        cliGetFuncReturn: cliGetFuncReturn,
      });
      if(isUpdateRequired) {
        const updateFuncReturn: ICliUpdateFuncReturn = await this.updateFunc(cliGetFuncReturn);
        return {
          cliTaskState: ECliTaskState.PRESENT,
          apiObject: updateFuncReturn.apiObject,  
        }
      }
    }
    return {
      cliTaskState: ECliTaskState.PRESENT,
      apiObject: cliGetFuncReturn.apiObject,
    };
  }

  protected async initializeTask(): Promise<void> {
    // do nothing, override in derived class
  }

  protected async execute(): Promise<ICliTaskExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliTask.name}.${funcName}()`;

    try {
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK, details: "starting ..." }));

      const xvoid: void = await this.initializeTask();
      // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK, details: {
      //   asyncApiDocument: this.cliTaskConfig.cliAsyncApiDocument.getLogInfo()
      // }}));

      const cliGetFuncReturn: ICliGetFuncReturn = await this.getFunc(this.getTaskKeys());
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
        cliGetFuncReturn: cliGetFuncReturn
      }}));

      let taskExecuteReturn: ICliTaskExecuteReturn = {
        cliTaskState: this.cliTaskConfig.cliTaskState,
        apiObject: cliGetFuncReturn.apiObject,
      }
      switch(this.cliTaskConfig.cliTaskState) {
        case ECliTaskState.PRESENT:
          taskExecuteReturn = await this.executePresent(cliGetFuncReturn);
          break;
        case ECliTaskState.ABSENT:
          throw new Error(`${logName}: implement absent`)
          break;
        default:
          CliUtils.assertNever(logName, this.cliTaskConfig.cliTaskState);
      }

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: "done." }));
      return taskExecuteReturn;
    } catch(e: any) {
      if(e instanceof ApiError) {
        throw new EPApiResponseApiError(e, logName, e.message);
      }
      throw e;
    }

  }


}
