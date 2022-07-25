
import { CliAbstractMethodError, CliError, EPApiResponseApiError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { CliUtils, IDeepCompareResult, TDeepDiffFromTo } from '../CliUtils';
import { ApiError } from '../_generated/@solace-iot-team/sep-openapi-node';

export enum ECliTaskState {
  PRESENT = "PRESENT",
  ABSENT = "ABSENT"
}
export enum  ECliTaskAction {
  CREATE = "CREATE",
  CREATE_FIRST_VERSION = "CREATE_FIRST_VERSION",
  CREATE_NEW_VERSION = "CREATE_NEW_VERSION",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  NOTHING_TO_DO = "NOTHING_TO_DO"
}
export interface ICliTaskConfig {
  cliTaskState: ECliTaskState;
  checkmode?: boolean;
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
export interface ICliTaskActionLog {
  action: ECliTaskAction,
  details: any;
}
export interface ICliTaskExecuteReturn {
  cliTaskState: ECliTaskState;
  checkmode: boolean;
  actionLog: ICliTaskActionLog;
  apiObject: any;
}
export interface ICliTaskDeepCompareResult extends IDeepCompareResult  {  
}

export interface ICliTaskIsUpdateRequiredReturn {
  isUpdateRequired: boolean;
  existingCompareObject: any;
  requestedCompareObject: any;
  difference: Record<string, TDeepDiffFromTo> | undefined;
}

export abstract class CliTask {
  protected cliTaskConfig: ICliTaskConfig;

  protected isCheckmode(): boolean {
    if(this.cliTaskConfig.checkmode === undefined) return false;
    return this.cliTaskConfig.checkmode;
  }
  // private createCleanCompareObject(obj: any): any {
  //   return JSON.parse(JSON.stringify(obj, (_k, v) => {
  //     if(v === null) return undefined;
  //     return v;
  //   }));
  // }
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
    return CliUtils.deepCompareObjects({
      existingObject: existingObject,
      requestedObject: requestedObject
    })
    // const cleanExistingObject = this.createCleanCompareObject(existingObject);
    // const cleanRequestedObject = this.createCleanCompareObject(requestedObject);
    // const isEqual = CliUtils.isEqualDeep(cleanExistingObject, cleanRequestedObject);
    // let deepDiffResult: Record<string, TDeepDiffFromTo> | undefined = undefined;
    // if(!isEqual) {
    //   deepDiffResult = CliUtils.deepDiff(cleanExistingObject, cleanRequestedObject);
    // }
    // return {
    //   isEqual: isEqual,
    //   difference: deepDiffResult
    // };
  }

  protected create_ICliTaskIsUpdateRequiredReturn({ existingObject, requestedObject }:{
    existingObject: any;
    requestedObject: any;
  }): ICliTaskIsUpdateRequiredReturn {
    const funcName = 'create_ICliTaskIsUpdateRequiredReturn';
    const logName = `${CliTask.name}.${funcName}()`;

    const cliTaskDeepCompareResult: ICliTaskDeepCompareResult = this.deepCompareObjects({ existingObject: existingObject, requestedObject: requestedObject });
    const cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn = {
      isUpdateRequired: !cliTaskDeepCompareResult.isEqual,
      existingCompareObject: this.prepareCompareObject4Output(existingObject),
      requestedCompareObject: this.prepareCompareObject4Output(requestedObject),
      difference: cliTaskDeepCompareResult.difference
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      ...cliTaskIsUpdateRequiredReturn
    }}));

    return cliTaskIsUpdateRequiredReturn;
  }

  constructor(taskConfig: ICliTaskConfig) {
    this.cliTaskConfig = taskConfig;
    if(taskConfig.checkmode === undefined) this.cliTaskConfig.checkmode = false;
  }

  protected abstract getTaskKeys(): ICliTaskKeys;

  protected async getFunc(cliTaskKeys: ICliTaskKeys): Promise<ICliGetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliTask.name}.${funcName}()`;
    cliTaskKeys;
    throw new CliAbstractMethodError(logName, CliTask.name, funcName);
  };

  protected async createFunc(): Promise<ICliCreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliTask.name}.${funcName}()`;
    throw new CliAbstractMethodError(logName, CliTask.name, funcName);
  }

  protected async updateFunc(cliGetFuncReturn: ICliGetFuncReturn): Promise<ICliUpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliTask.name}.${funcName}()`;
    cliGetFuncReturn;
    throw new CliAbstractMethodError(logName, CliTask.name, funcName);
  }

  protected abstract isUpdateRequired({ cliGetFuncReturn }:{
    cliGetFuncReturn: ICliGetFuncReturn
  }): ICliTaskIsUpdateRequiredReturn;

  private async createFuncWrapper(): Promise<ICliCreateFuncReturn> {
    if(!this.isCheckmode()) return await this.createFunc();
    return {
      apiObject: {},
    };
  }

  private async updateFuncWrapper(cliGetFuncReturn: ICliGetFuncReturn): Promise<ICliUpdateFuncReturn> {
    if(!this.isCheckmode()) return await this.updateFunc(cliGetFuncReturn);
    return {
      apiObject: {},
    }
  }

  protected create_CreateFuncActionLog(): ICliTaskActionLog {
    return {
      action: ECliTaskAction.CREATE,
      details: undefined
    };
  }

  protected create_UpdateFuncActionLog({ cliTaskIsUpdateRequiredReturn }:{
    cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn;
  }): ICliTaskActionLog {
    return {
      action: ECliTaskAction.UPDATE,
      details: cliTaskIsUpdateRequiredReturn
    };
  }

  protected create_NothingToDoActionLog(): ICliTaskActionLog {
    return {
      action: ECliTaskAction.NOTHING_TO_DO,
      details: undefined
    };
  }

  private async executePresent(cliGetFuncReturn: ICliGetFuncReturn): Promise<ICliTaskExecuteReturn> {
    const funcName = 'executePresent';
    const logName = `${CliTask.name}.${funcName}()`;

    if(!cliGetFuncReturn.documentExists) {
      const createFuncReturn: ICliCreateFuncReturn = await this.createFuncWrapper();
      return {
        cliTaskState: ECliTaskState.PRESENT,
        checkmode: this.isCheckmode(),
        actionLog: this.create_CreateFuncActionLog(),
        apiObject: createFuncReturn.apiObject,
      };
    } else {
      // check if update required
      const cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn = this.isUpdateRequired({
        cliGetFuncReturn: cliGetFuncReturn,
      });
      if(cliTaskIsUpdateRequiredReturn.isUpdateRequired) {
        const updateFuncReturn: ICliUpdateFuncReturn = await this.updateFuncWrapper(cliGetFuncReturn);
        return {
          cliTaskState: ECliTaskState.PRESENT,
          checkmode: this.isCheckmode(),
          actionLog: this.create_UpdateFuncActionLog({ cliTaskIsUpdateRequiredReturn: cliTaskIsUpdateRequiredReturn }),
          apiObject: updateFuncReturn.apiObject,  
        }
      }
    }
    // nothing to do
    return {
      cliTaskState: ECliTaskState.PRESENT,
      checkmode: this.isCheckmode(),
      actionLog: this.create_NothingToDoActionLog(),
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

      // let taskExecuteReturn: ICliTaskExecuteReturn = {
      //   cliTaskState: this.cliTaskConfig.cliTaskState,
      //   checkmode: this.isCheckmode(),
      //   apiObject: cliGetFuncReturn.apiObject,
      // }
      let taskExecuteReturn: ICliTaskExecuteReturn | undefined;
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
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: "done." }));
      if(taskExecuteReturn === undefined) throw new CliError(logName, 'taskExecuteReturn === undefined');
      return taskExecuteReturn;
    } catch(e: any) {
      if(e instanceof ApiError) {
        throw new EPApiResponseApiError(e, logName, e.message);
      }
      throw e;
    }

  }


}
