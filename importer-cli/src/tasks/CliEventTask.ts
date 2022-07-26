import _ from "lodash";

import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn, ICliTaskIsUpdateRequiredReturn } from "./CliTask";
import { 
  Event as EPEvent, 
  EventResponse, 
  EventsService
} from '@solace-iot-team/ep-sdk/sep-openapi-node';
import CliEPEventsService from "../services/CliEPEventsService";

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

    const epEventObject: EPEvent | undefined = await CliEPEventsService.getByName({
      eventName: cliTaskKeys.eventName,
      applicationDomainId: cliTaskKeys.applicationDomainId,
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      epEventObject: epEventObject
    }}));

    if(epEventObject === undefined) return this.Empty_ICliEventTask_GetFuncReturn;

    const cliEventTask_GetFuncReturn: ICliEventTask_GetFuncReturn = {
      apiObject: epEventObject,
      eventObject: epEventObject,
      documentExists: true,
    }
    return cliEventTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliEventTask_GetFuncReturn; 
  }): ICliTaskIsUpdateRequiredReturn {
    const funcName = 'isUpdateRequired';
    const logName = `${CliEventTask.name}.${funcName}()`;
    if(cliGetFuncReturn.eventObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.schemaObject === undefined');

    const existingObject: EPEvent = cliGetFuncReturn.eventObject;
    const existingCompareObject: TCliEventTask_CompareObject = {
      shared: existingObject.shared,
    }
    const requestedCompareObject: TCliEventTask_CompareObject = this.createObjectSettings();

    const cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn = this.create_ICliTaskIsUpdateRequiredReturn({
      existingObject: existingCompareObject,
      requestedObject: requestedCompareObject
    });
    // DEBUG
    // if(cliTaskIsUpdateRequiredReturn.isUpdateRequired) throw new Error(`${logName}: check updates requiired`);
    return cliTaskIsUpdateRequiredReturn;

    // OLD delete me
    // isUpdateRequired = !_.isEqual(existingCompareObject, requestedCompareObject);
    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
    //   existingCompareObject: existingCompareObject,
    //   requestedCompareObject: requestedCompareObject,
    //   isUpdateRequired: isUpdateRequired
    // }}));
    // return isUpdateRequired;
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

    const eventResponse: EventResponse = await EventsService.createEvent({
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
    const eventResponse: EventResponse = await EventsService.updateEvent({
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
      ...cliTaskExecuteReturn,
      apiObject: undefined,
      eventObject: cliTaskExecuteReturn.apiObject
    };
    return cliEventTask_ExecuteReturn;
  }

}
