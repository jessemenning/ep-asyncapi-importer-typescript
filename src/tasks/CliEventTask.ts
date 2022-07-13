import _ from "lodash";

import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn } from "./CliTask";
import { Event as EPEvent, EventResponse, EventsResponse, EventsService} from "../_generated/@solace-iot-team/sep-openapi-node";

// export enum EPSchemaType {
//   JSON_SCHEMA = "jsonSchema"
// }
// enum EPContentType {
//   APPLICATION_JSON = "json"
// }
type TCliEventTask_Settings = Partial<Pick<EPEvent, "shared">>;
type TCliEventTask_CompareObject = TCliEventTask_Settings;

export interface ICliEventTask_Config extends ICliTaskConfig {
  eventName: string;
  applicationDomainId: string;
  eventObjectSettings: Required<TCliEventTask_Settings>;
}
export interface ICliEventTask_Keys extends ICliTaskKeys {
  eventName: string;
  applicationDomainId: string;
}
export interface ICliEventTask_GetFuncReturn extends ICliGetFuncReturn {
  eventObject: EPEvent | undefined;
}
export interface ICliEventTask_CreateFuncReturn extends ICliCreateFuncReturn {
  eventObject: EPEvent;
}
export interface ICliEventTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  eventObject: EPEvent;
}
export interface ICliEventTask_ExecuteReturn extends ICliTaskExecuteReturn {
  eventObject: EPEvent;
}

export class CliEventTask extends CliTask {

  private readonly Empty_ICliEventTask_GetFuncReturn: ICliEventTask_GetFuncReturn = {
    apiObject: undefined,
    documentExists: false  ,
    eventObject: undefined,
  };
  private readonly Default_TCliEventTask_Settings: TCliEventTask_Settings = {
    shared: true,
  }
  private getCliTaskConfig(): ICliEventTask_Config { return this.cliTaskConfig as ICliEventTask_Config; }
  private createObjectSettings(): Partial<EPEvent> {
    return {
      ...this.Default_TCliEventTask_Settings,
      ...this.getCliTaskConfig().eventObjectSettings,
    };
  }

  constructor(taskConfig: ICliEventTask_Config) {
    super(taskConfig);
  }

  protected getTaskKeys(): ICliEventTask_Keys {
    return {
      eventName: this.getCliTaskConfig().eventName,
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
    };
  }

  protected async getFunc(cliTaskKeys: ICliEventTask_Keys): Promise<ICliEventTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliEventTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      params: {
        eventName: cliTaskKeys.eventName
      }
    }}));

    const eventsResponse: EventsResponse = await EventsService.list1({
      name: cliTaskKeys.eventName,
      applicationDomainId: cliTaskKeys.applicationDomainId,
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      eventsResponse: eventsResponse
    }}));

    if(eventsResponse.data === undefined || eventsResponse.data.length === 0) return this.Empty_ICliEventTask_GetFuncReturn;
    if(eventsResponse.data.length > 1) throw new CliError(logName, 'eventsResponse.data.length > 1');

    const cliEventTask_GetFuncReturn: ICliEventTask_GetFuncReturn = {
      apiObject: eventsResponse.data[0],
      eventObject: eventsResponse.data[0],
      documentExists: true,
    }
    return cliEventTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliEventTask_GetFuncReturn; 
  }): boolean {
    const funcName = 'isUpdateRequired';
    const logName = `${CliEventTask.name}.${funcName}()`;
    if(cliGetFuncReturn.eventObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.schemaObject === undefined');
    let isUpdateRequired: boolean = false;

    const existingObject: EPEvent = cliGetFuncReturn.eventObject;
    const existingCompareObject: TCliEventTask_CompareObject = {
      shared: existingObject.shared,
    }
    const requestedCompareObject: TCliEventTask_CompareObject = this.createObjectSettings();
    isUpdateRequired = !_.isEqual(existingCompareObject, requestedCompareObject);
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      existingCompareObject: existingCompareObject,
      requestedCompareObject: requestedCompareObject,
      isUpdateRequired: isUpdateRequired
    }}));
    return isUpdateRequired;
  }

  protected async createFunc(): Promise<ICliEventTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliEventTask.name}.${funcName}()`;

    const create: EPEvent = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().eventName,
    };

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      document: create
    }}));

    const eventResponse: EventResponse = await EventsService.create1({
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      eventResponse: eventResponse
    }}));

    if(eventResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventResponse.data === undefined', {
      eventResponse: eventResponse
    });

    const created: EPEvent = eventResponse.data;
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      created: created
    }}));
    return {
       eventObject: created,
       apiObject: created,
    };
  }

  protected async updateFunc(cliGetFuncReturn: ICliEventTask_GetFuncReturn): Promise<ICliEventTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliEventTask.name}.${funcName}()`;
    if(cliGetFuncReturn.eventObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.eventObject === undefined');

    const update: EPEvent = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().eventName,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      document: update
    }}));
    if(cliGetFuncReturn.eventObject.id === undefined) throw new CliEPApiContentError(logName, 'cliGetFuncReturn.eventObject.id === undefined', {
      eventObject: cliGetFuncReturn.eventObject
    });
    const eventResponse: EventResponse = await EventsService.update({
      id: cliGetFuncReturn.eventObject.id,
      requestBody: update
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      eventResponse: eventResponse
    }}));
    if(eventResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventResponse.data === undefined', {
      eventResponse: eventResponse
    });
    const cliEventTask_UpdateFuncReturn: ICliEventTask_UpdateFuncReturn = {
      apiObject: eventResponse.data,
      eventObject: eventResponse.data,
    };
    return cliEventTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliEventTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliEventTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliEventTask_ExecuteReturn: ICliEventTask_ExecuteReturn = {
      cliTaskState: cliTaskExecuteReturn.cliTaskState,
      apiObject: undefined,
      eventObject: cliTaskExecuteReturn.apiObject
    };
    return cliEventTask_ExecuteReturn;
  }

}
