import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn, ICliTaskDeepCompareResult } from "./CliTask";
import { 
  VersionedObjectStateChangeRequest,
  eventApiVersion as EventApiVersion,
  EventApiVersionResponse,
  EventApIsService, 
} from "../_generated/@solace-iot-team/sep-openapi-node";
import CliConfig from "../CliConfig";
import CliSemVerUtils from "../CliSemVerUtils";
import CliEPEventApiVersionsService from "../services/CliEPEventApiVersionsService";
import { CliVersionTask } from "./CliVersionTask";


type TCliEventApiVersionTask_Settings = Required<Pick<EventApiVersion, "description" | "displayName" | "stateId" | "producedEventVersionIds" | "consumedEventVersionIds" >>;
type TCliEventApiVersionTask_CompareObject = Partial<TCliEventApiVersionTask_Settings>;

export interface ICliEventApiVersionTask_Config extends ICliTaskConfig {
  applicationDomainId: string;
  eventApiId: string;
  baseVersionString: string;
  eventApiVersionSettings: TCliEventApiVersionTask_Settings;
}
export interface ICliEventApiVersionTask_Keys extends ICliTaskKeys {
  eventApiId: string;
  applicationDomainId: string;
}
export interface ICliEventApiVersionTask_GetFuncReturn extends ICliGetFuncReturn {
  eventApiVersionObject: EventApiVersion | undefined;
}
export interface ICliEventApiVersionTask_CreateFuncReturn extends ICliCreateFuncReturn {
  eventApiVersionObject: EventApiVersion;
}
export interface ICliEventApiVersionTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  eventApiVersionObject: EventApiVersion;
}
export interface ICliEventApiVersionTask_ExecuteReturn extends ICliTaskExecuteReturn {
  eventApiVersionObject: EventApiVersion;
}

export class CliEventApiVersionTask extends CliVersionTask {
  private newVersionString: string;

  private readonly Empty_ICliEventApiVersionTask_GetFuncReturn: ICliEventApiVersionTask_GetFuncReturn = {
    documentExists: false,
    apiObject: undefined,
    eventApiVersionObject: undefined,
  };

  private readonly Default_TCliEventApiVersionTask_Settings: Partial<TCliEventApiVersionTask_Settings> = {
  }

  private getCliTaskConfig(): ICliEventApiVersionTask_Config { return this.cliTaskConfig as ICliEventApiVersionTask_Config; }
  
  private createObjectSettings(): Partial<EventApiVersion> {
    // arrays must be sorted
    const s = this.getCliTaskConfig().eventApiVersionSettings;
    const p: Array<string> = s.producedEventVersionIds as unknown as Array<string>;
    const c: Array<string> = s.consumedEventVersionIds as unknown as Array<string>;
    p.sort();
    c.sort();

    return {
      ...this.Default_TCliEventApiVersionTask_Settings,
      ...this.getCliTaskConfig().eventApiVersionSettings,
      producedEventVersionIds: p as unknown as EventApiVersion.producedEventVersionIds,
      consumedEventVersionIds: c as unknown as EventApiVersion.consumedEventVersionIds,
    };
  }

  // protected async initializeTask(): Promise<void> {
  //   this.topicAddressLevelList = await this.initializeTopicAddressLevels({ channelTopic: this.getCliTaskConfig().channelTopic });
  // }

  constructor(taskConfig: ICliEventApiVersionTask_Config) {
    super(taskConfig);
    this.newVersionString = taskConfig.baseVersionString;
  }

  protected getTaskKeys(): ICliEventApiVersionTask_Keys {
    return {
      eventApiId: this.getCliTaskConfig().eventApiId,
      applicationDomainId: this.getCliTaskConfig().applicationDomainId
    };
  }

  protected async getFunc(cliTaskKeys: ICliEventApiVersionTask_Keys): Promise<ICliEventApiVersionTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliEventApiVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      params: cliTaskKeys,
    }}));

    const eventApiVersion: EventApiVersion | undefined = await CliEPEventApiVersionsService.getLastestVersionById({
      eventApiId: cliTaskKeys.eventApiId,
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      eventApiVersion: eventApiVersion ? eventApiVersion : 'undefined'
    }}));
    if(eventApiVersion === undefined) return this.Empty_ICliEventApiVersionTask_GetFuncReturn;

    const cliEventApiVersionTask_GetFuncReturn: ICliEventApiVersionTask_GetFuncReturn = {
      apiObject: eventApiVersion,
      eventApiVersionObject: eventApiVersion,
      documentExists: true,
    }
    return cliEventApiVersionTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliEventApiVersionTask_GetFuncReturn; 
  }): boolean {
    const funcName = 'isUpdateRequired';
    const logName = `${CliEventApiVersionTask.name}.${funcName}()`;
    if(cliGetFuncReturn.eventApiVersionObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.eventApiVersionObject === undefined');

    const existingObject: EventApiVersion = cliGetFuncReturn.eventApiVersionObject;

    // arrays must be sorted
    const s = existingObject;
    const p: Array<string> = s.producedEventVersionIds as unknown as Array<string>;
    const c: Array<string> = s.consumedEventVersionIds as unknown as Array<string>;
    p.sort();
    c.sort();
    
    const existingCompareObject: TCliEventApiVersionTask_CompareObject = {
      description: existingObject.description,
      displayName: existingObject.displayName,
      stateId: existingObject.stateId,
      producedEventVersionIds: p as unknown as EventApiVersion.producedEventVersionIds,
      consumedEventVersionIds: c as unknown as EventApiVersion.consumedEventVersionIds,
    };
    const requestedCompareObject: TCliEventApiVersionTask_CompareObject = this.createObjectSettings();

    const cliTaskDeepCompareResult: ICliTaskDeepCompareResult = this.deepCompareObjects({ existingObject: existingCompareObject, requestedObject: requestedCompareObject });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      existingCompareObject: this.prepareCompareObject4Output(existingCompareObject),
      requestedCompareObject: this.prepareCompareObject4Output(requestedCompareObject),
      isUpdateRequired: !cliTaskDeepCompareResult.isEqual,
      difference: cliTaskDeepCompareResult.difference
    }}));
    if(!cliTaskDeepCompareResult.isEqual) throw new Error(`${logName}: check updates requiired`);
    return !cliTaskDeepCompareResult.isEqual;
  }

  private async createEventApiVersion({ applicationDomainId, eventApiId, eventApiVersion, code, targetLifecycleStateId }:{
    applicationDomainId: string;
    eventApiId: string;
    eventApiVersion: EventApiVersion;
    code: ECliStatusCodes;
    targetLifecycleStateId: string;
  }): Promise<EventApiVersion> {
    const funcName = 'createEventApiVersion';
    const logName = `${CliEventApiVersionTask.name}.${funcName}()`;

    applicationDomainId;
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      document: eventApiVersion
    }}));

    const eventApiVersionResponse: EventApiVersionResponse = await EventApIsService.createEventApiVersionForEventApi({
      eventApiId: eventApiId,
      requestBody: eventApiVersion
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      eventApiVersionResponse: eventApiVersionResponse
    }}));

    if(eventApiVersionResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventApiVersionResponse.data === undefined', {
      eventApiVersionResponse: eventApiVersionResponse
    });
    const createdEventApiVersion: EventApiVersion = eventApiVersionResponse.data;

    if(createdEventApiVersion.id === undefined || createdEventApiVersion.stateId === undefined) throw new CliEPApiContentError(logName, 'createdEventApiVersion.id === undefined || createdSchemaVersion.stateId === undefined', {
      createdEventApiVersion: createdEventApiVersion
    });
    // check the target lifecycle state
    if(createdEventApiVersion.stateId !== targetLifecycleStateId) {
      const versionedObjectStateChangeRequest: VersionedObjectStateChangeRequest = await EventApIsService.updateEventApiVersionStateForEventApi({
        eventApiId: eventApiId,
        id: createdEventApiVersion.id,
        requestBody: {
          stateId: targetLifecycleStateId
        }
      });
      const updatedEventApiVersion: EventApiVersion | undefined = await CliEPEventApiVersionsService.getVersionByVersion({
        eventApiId: eventApiId,
        versionString: this.newVersionString
      });
      if(updatedEventApiVersion === undefined) throw new CliEPApiContentError(logName, 'updatedEventApiVersion === undefined', {
        updatedEventApiVersion: updatedEventApiVersion
      });
      return updatedEventApiVersion;
    }
    return createdEventApiVersion;
  }
  /**
   * Create a new EventApiVersion
   */
  protected async createFunc(): Promise<ICliEventApiVersionTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliEventApiVersionTask.name}.${funcName}()`;

    const eventApiId: string = this.getCliTaskConfig().eventApiId;
    
    const create: EventApiVersion = {
      ...this.createObjectSettings(),
      eventApiId: eventApiId,
      version: this.newVersionString,
    };
    const eventApiVersion: EventApiVersion = await this.createEventApiVersion({
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      eventApiId: eventApiId,
      eventApiVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_CREATE,
      targetLifecycleStateId: this.getCliTaskConfig().eventApiVersionSettings.stateId,
    });
    return {
      eventApiVersionObject: eventApiVersion,
      apiObject: eventApiVersion
    };
  }

  /**
   * Creates a new EventVersion with bumped version number.
   */
  protected async updateFunc(cliGetFuncReturn: ICliEventApiVersionTask_GetFuncReturn): Promise<ICliEventApiVersionTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliEventApiVersionTask.name}.${funcName}()`;

    cliGetFuncReturn;
    const eventApiId: string = this.getCliTaskConfig().eventApiId;

    const latestEventVersionString: string | undefined = await CliEPEventApiVersionsService.getLastestVersionString({ eventApiId: this.getCliTaskConfig().eventApiId });
    if(latestEventVersionString === undefined) throw new CliError(logName, 'latestEventVersionString === undefined');
    // bump version according to strategy
    const newEventVersionString = CliSemVerUtils.createNextVersion({
      versionString: latestEventVersionString,
      strategy: CliConfig.getCliAppConfig().assetImportTargetLifecycleState.versionStrategy,
    });

    const create: EventApiVersion = {
      ...this.createObjectSettings(),
      eventApiId: eventApiId,
      version: newEventVersionString,
    };
    const eventApiVersion: EventApiVersion = await this.createEventApiVersion({
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      eventApiId: eventApiId,
      eventApiVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_UPDATE,
      targetLifecycleStateId: this.getCliTaskConfig().eventApiVersionSettings.stateId
    });

    const cliEventApiVersionTask_UpdateFuncReturn: ICliEventApiVersionTask_UpdateFuncReturn = {
      apiObject: eventApiVersion,
      eventApiVersionObject: eventApiVersion,
    };
    return cliEventApiVersionTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliEventApiVersionTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliEventApiVersionTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliEventApiVersionTask_ExecuteReturn: ICliEventApiVersionTask_ExecuteReturn = {
      ...cliTaskExecuteReturn,
      apiObject: undefined,
      eventApiVersionObject: cliTaskExecuteReturn.apiObject,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: {
      cliEventApiVersionTask_ExecuteReturn: cliEventApiVersionTask_ExecuteReturn,
    }}));
    return cliEventApiVersionTask_ExecuteReturn;
  }

}
