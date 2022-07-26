import _ from "lodash";

import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn, ICliTaskIsUpdateRequiredReturn } from "./CliTask";
import { 
  Enum, 
  EnumResponse, 
  EnumsResponse, 
  EnumsService, 
  // Event as EPEvent
} from '@solace-iot-team/ep-sdk/sep-openapi-node';
import CliEPEnumsService from "../services/CliEPEnumsService";

type TCliEnumTask_Settings = Partial<Pick<Enum, "shared">>;
type TCliEnumTask_CompareObject = TCliEnumTask_Settings;

export interface ICliEnumTask_Config extends ICliTaskConfig {
  enumName: string;
  applicationDomainId: string;
  enumObjectSettings: Required<TCliEnumTask_Settings>;
}
export interface ICliEnumTask_Keys extends ICliTaskKeys {
  enumName: string;
  applicationDomainId: string;
}
export interface ICliEnumTask_GetFuncReturn extends ICliGetFuncReturn {
  enumObject: Enum | undefined;
}
export interface ICliEnumTask_CreateFuncReturn extends ICliCreateFuncReturn {
  enumObject: Enum;
}
export interface ICliEnumTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  enumObject: Enum;
}
export interface ICliEnumTask_ExecuteReturn extends ICliTaskExecuteReturn {
  enumObject: Enum;
}

export class CliEnumTask extends CliTask {

  private readonly Empty_ICliEnumTask_GetFuncReturn: ICliEnumTask_GetFuncReturn = {
    apiObject: undefined,
    documentExists: false  ,
    enumObject: undefined,
  };
  private readonly Default_TCliEnumTask_Settings: TCliEnumTask_Settings = {
    shared: true,
  }
  private getCliTaskConfig(): ICliEnumTask_Config { return this.cliTaskConfig as ICliEnumTask_Config; }
  private createObjectSettings(): Partial<Enum> {
    return {
      ...this.Default_TCliEnumTask_Settings,
      ...this.getCliTaskConfig().enumObjectSettings,
    };
  }

  constructor(taskConfig: ICliEnumTask_Config) {
    super(taskConfig);
  }

  protected getTaskKeys(): ICliEnumTask_Keys {
    return {
      enumName: this.getCliTaskConfig().enumName,
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
    };
  }

  protected async getFunc(cliTaskKeys: ICliEnumTask_Keys): Promise<ICliEnumTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliEnumTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      cliTaskConfig: this.getCliTaskConfig(),
      cliTaskKeys: cliTaskKeys,
    }}));

    const enumObject: Enum | undefined = await CliEPEnumsService.getByName({ 
      enumName: cliTaskKeys.enumName,
      applicationDomainId: cliTaskKeys.applicationDomainId
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      cliTaskConfig: this.getCliTaskConfig(),
      cliTaskKeys: cliTaskKeys,
      enumObject: enumObject ? enumObject : 'undefined'
    }}));

    if(enumObject === undefined) return this.Empty_ICliEnumTask_GetFuncReturn;

    const cliEnumTask_GetFuncReturn: ICliEnumTask_GetFuncReturn = {
      apiObject: enumObject,
      enumObject: enumObject,
      documentExists: true,
    }
    return cliEnumTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliEnumTask_GetFuncReturn; 
  }): ICliTaskIsUpdateRequiredReturn {
    const funcName = 'isUpdateRequired';
    const logName = `${CliEnumTask.name}.${funcName}()`;
    if(cliGetFuncReturn.enumObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.enumObject === undefined');

    const existingObject: Enum = cliGetFuncReturn.enumObject;
    const existingCompareObject: TCliEnumTask_CompareObject = {
      shared: existingObject.shared,
    }
    const requestedCompareObject: TCliEnumTask_CompareObject = this.createObjectSettings();

    const cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn = this.create_ICliTaskIsUpdateRequiredReturn({
      existingObject: existingCompareObject,
      requestedObject: requestedCompareObject
    });
    // DEBUG
    // if(cliTaskIsUpdateRequiredReturn.isUpdateRequired) throw new Error(`${logName}: check updates requiired`);
    return cliTaskIsUpdateRequiredReturn;

    // OLD: delete me
    // isUpdateRequired = !_.isEqual(existingCompareObject, requestedCompareObject);
    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
    //   existingCompareObject: existingCompareObject,
    //   requestedCompareObject: requestedCompareObject,
    //   isUpdateRequired: isUpdateRequired
    // }}));
    // return isUpdateRequired;
  }

  protected async createFunc(): Promise<ICliEnumTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliEnumTask.name}.${funcName}()`;

    const create: Enum = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().enumName,
    };

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      document: create
    }}));

    const enumResponse: EnumResponse = await EnumsService.createEnum({
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      enumResponse: enumResponse
    }}));

    if(enumResponse.data === undefined) throw new CliEPApiContentError(logName, 'enumResponse.data === undefined', {
      enumResponse: enumResponse
    });

    const created: Enum = enumResponse.data;
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      created: created
    }}));
    return {
       enumObject: created,
       apiObject: created,
    };
  }

  protected async updateFunc(cliGetFuncReturn: ICliEnumTask_GetFuncReturn): Promise<ICliEnumTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliEnumTask.name}.${funcName}()`;
    if(cliGetFuncReturn.enumObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.enumObject === undefined');

    const update: Enum = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().enumName,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      document: update
    }}));
    if(cliGetFuncReturn.enumObject.id === undefined) throw new CliEPApiContentError(logName, 'cliGetFuncReturn.enumObject.id === undefined', {
      enumObject: cliGetFuncReturn.enumObject
    });
    const enumResponse: EnumResponse = await EnumsService.updateEnum({
      id: cliGetFuncReturn.enumObject.id,
      requestBody: update
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      enumResponse: enumResponse
    }}));
    if(enumResponse.data === undefined) throw new CliEPApiContentError(logName, 'enumResponse.data === undefined', {
      enumResponse: enumResponse
    });
    const cliEnumTask_UpdateFuncReturn: ICliEnumTask_UpdateFuncReturn = {
      apiObject: enumResponse.data,
      enumObject: enumResponse.data,
    };
    return cliEnumTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliEnumTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliEnumTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliEnumTask_ExecuteReturn: ICliEnumTask_ExecuteReturn = {
      ...cliTaskExecuteReturn,
      apiObject: undefined,
      enumObject: cliTaskExecuteReturn.apiObject
    };
    return cliEnumTask_ExecuteReturn;
  }

}
