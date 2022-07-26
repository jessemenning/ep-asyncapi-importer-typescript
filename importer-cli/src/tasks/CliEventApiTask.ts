import _ from "lodash";

import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { 
  CliTask, 
  ICliTaskKeys, 
  ICliGetFuncReturn, 
  ICliTaskConfig, 
  ICliCreateFuncReturn, 
  ICliTaskExecuteReturn, 
  ICliUpdateFuncReturn, 
  ICliTaskIsUpdateRequiredReturn
} from "./CliTask";
import { 
  EventApi,
  EventApiResponse,
  EventApIsService, 
} from '@solace-iot-team/ep-sdk/sep-openapi-node';
import CliEPEventApisService from "../services/CliEPEventApisService";

type TCliEventApiTask_Settings = Partial<Pick<EventApi, "shared">>;
type TCliEventApiTask_CompareObject = TCliEventApiTask_Settings;

export interface ICliEventApiTask_Config extends ICliTaskConfig {
  eventApiName: string;
  applicationDomainId: string;
  eventApiObjectSettings: Required<TCliEventApiTask_Settings>;
}
export interface ICliEventApiTask_Keys extends ICliTaskKeys {
  eventApiName: string;
  applicationDomainId: string;
}
export interface ICliEventApiTask_GetFuncReturn extends ICliGetFuncReturn {
  eventApiObject: EventApi | undefined;
}
export interface ICliEventApiTask_CreateFuncReturn extends ICliCreateFuncReturn {
  eventApiObject: EventApi;
}
export interface ICliEventApiTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  eventApiObject: EventApi;
}
export interface ICliEventApiTask_ExecuteReturn extends ICliTaskExecuteReturn {
  eventApiObject: EventApi;
}

export class CliEventApiTask extends CliTask {

  private readonly Empty_ICliEventApiTask_GetFuncReturn: ICliEventApiTask_GetFuncReturn = {
    apiObject: undefined,
    documentExists: false  ,
    eventApiObject: undefined,
  };
  private readonly Default_TCliEventApiTask_Settings: TCliEventApiTask_Settings = {
    shared: true,
  }
  private getCliTaskConfig(): ICliEventApiTask_Config { return this.cliTaskConfig as ICliEventApiTask_Config; }
  private createObjectSettings(): Partial<EventApi> {
    return {
      ...this.Default_TCliEventApiTask_Settings,
      ...this.getCliTaskConfig().eventApiObjectSettings,
    };
  }

  constructor(taskConfig: ICliEventApiTask_Config) {
    super(taskConfig);
  }

  protected getTaskKeys(): ICliEventApiTask_Keys {
    return {
      eventApiName: this.getCliTaskConfig().eventApiName,
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
    };
  }

  protected async getFunc(cliTaskKeys: ICliEventApiTask_Keys): Promise<ICliEventApiTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliEventApiTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      cliTaskKeys: cliTaskKeys
    }}));

    const eventApiObject: EventApi | undefined = await CliEPEventApisService.getByName({
      applicationDomainId: cliTaskKeys.applicationDomainId,
      eventApiName: cliTaskKeys.eventApiName
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      eventApiObject: eventApiObject
    }}));

    if(eventApiObject === undefined) return this.Empty_ICliEventApiTask_GetFuncReturn;

    const cliEventApiTask_GetFuncReturn: ICliEventApiTask_GetFuncReturn = {
      apiObject: eventApiObject,
      eventApiObject: eventApiObject,
      documentExists: true,
    }
    return cliEventApiTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliEventApiTask_GetFuncReturn; 
  }): ICliTaskIsUpdateRequiredReturn {
    const funcName = 'isUpdateRequired';
    const logName = `${CliEventApiTask.name}.${funcName}()`;
    if(cliGetFuncReturn.eventApiObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.eventApiObject === undefined');

    const existingObject: EventApi = cliGetFuncReturn.eventApiObject;
    const existingCompareObject: TCliEventApiTask_CompareObject = {
      shared: existingObject.shared,
    }
    const requestedCompareObject: TCliEventApiTask_CompareObject = this.createObjectSettings();

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

  protected async createFunc(): Promise<ICliEventApiTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliEventApiTask.name}.${funcName}()`;

    const create: EventApi = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().eventApiName,
    };

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      document: create
    }}));

    const eventApiResponse: EventApiResponse = await EventApIsService.createEventApi({
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      eventApiResponse: eventApiResponse
    }}));

    if(eventApiResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventApiResponse.data === undefined', {
      eventApiResponse: eventApiResponse
    });

    const created: EventApi = eventApiResponse.data;
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      created: created
    }}));
    return {
       eventApiObject: created,
       apiObject: created,
    };
  }

  protected async updateFunc(cliGetFuncReturn: ICliEventApiTask_GetFuncReturn): Promise<ICliEventApiTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliEventApiTask.name}.${funcName}()`;
    if(cliGetFuncReturn.eventApiObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.eventApiObject === undefined');

    const update: EventApi = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().eventApiName,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      document: update
    }}));
    if(cliGetFuncReturn.eventApiObject.id === undefined) throw new CliEPApiContentError(logName, 'cliGetFuncReturn.eventApiObject.id === undefined', {
      eventApiObject: cliGetFuncReturn.eventApiObject
    });
    const eventApiResponse: EventApiResponse = await EventApIsService.updateEventApi({
      id: cliGetFuncReturn.eventApiObject.id,
      requestBody: update
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      eventApiResponse: eventApiResponse
    }}));
    if(eventApiResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventApiResponse.data === undefined', {
      eventApiResponse: eventApiResponse
    });
    const cliEventApiTask_UpdateFuncReturn: ICliEventApiTask_UpdateFuncReturn = {
      apiObject: eventApiResponse.data,
      eventApiObject: eventApiResponse.data,
    };
    return cliEventApiTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliEventApiTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliEventApiTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliEventApiTask_ExecuteReturn: ICliEventApiTask_ExecuteReturn = {
      ...cliTaskExecuteReturn,
      apiObject: undefined,
      eventApiObject: cliTaskExecuteReturn.apiObject
    };
    return cliEventApiTask_ExecuteReturn;
  }

}
