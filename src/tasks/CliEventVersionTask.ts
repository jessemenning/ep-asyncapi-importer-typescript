import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn, ICliTaskDeepCompareResult } from "./CliTask";
import { 
  Address, 
  AddressLevel, 
  EnumVersion, 
  EventsService, 
  EventVersion, 
  EventVersionResponse, 
  VersionedObjectStateChangeRequest 
} from "../_generated/@solace-iot-team/sep-openapi-node";
import CliConfig from "../CliConfig";
import CliSemVerUtils from "../CliSemVerUtils";
import CliEPEventVersionsService from "../services/CliEPEventVersionsService";
import CliEPEnumVersionsService from "../services/CliEPEnumVersionsService";

type TCliEventVersionTask_Settings = Required<Pick<EventVersion, "description" | "displayName" | "stateId" | "schemaVersionId">>;
type TCliEventVersionTask_CompareObject = Partial<TCliEventVersionTask_Settings> & Pick<EventVersion, "deliveryDescriptor">;

export interface ICliEventVersionTask_Config extends ICliTaskConfig {
  eventId: string;
  channelTopic: string;
  baseVersionString: string;
  applicationDomainId: string;
  eventVersionSettings: TCliEventVersionTask_Settings;
}
export interface ICliEventVersionTask_Keys extends ICliTaskKeys {
  eventId: string;
  applicationDomainId: string;
}
export interface ICliEventVersionTask_GetFuncReturn extends ICliGetFuncReturn {
  eventVersionObject: EventVersion | undefined;
}
export interface ICliEventVersionTask_CreateFuncReturn extends ICliCreateFuncReturn {
  eventVersionObject: EventVersion;
}
export interface ICliEventVersionTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  eventVersionObject: EventVersion;
}
export interface ICliEventVersionTask_ExecuteReturn extends ICliTaskExecuteReturn {
  eventVersionObject: EventVersion;
}

export class CliEventVersionTask extends CliTask {
  private newVersionString: string;
  private topicAddressLevelList: Array<AddressLevel> = [];

  private readonly Empty_ICliEventVersionTask_GetFuncReturn: ICliEventVersionTask_GetFuncReturn = {
    documentExists: false,
    apiObject: undefined,
    eventVersionObject: undefined,
  };

  private readonly Default_TCliEventVersionTask_Settings: Partial<TCliEventVersionTask_Settings> = {
  }

  private getCliTaskConfig(): ICliEventVersionTask_Config { return this.cliTaskConfig as ICliEventVersionTask_Config; }

  private initializeTopicAddressLevels = async({ channelTopic }:{
    channelTopic: string;
  }): Promise<Array<AddressLevel>> => {
    const funcName = 'initializeTopicAddressLevels';
    const logName = `${CliEventVersionTask.name}.${funcName}()`;

    const addressLevels: Array<AddressLevel> = [];
    
    const topicLevelList: Array<string> = channelTopic.split("/");
    for(let topicLevel of topicLevelList) {
      let type = AddressLevel.addressLevelType.LITERAL;
      let enumVersionId: string | undefined = undefined;
      if(topicLevel.includes("{")) {
        topicLevel = topicLevel.replace('}', '').replace('{', '');
        type = AddressLevel.addressLevelType.VARIABLE;
        // get the enumVersionId if it exists
        const enumVersion: EnumVersion | undefined = await CliEPEnumVersionsService.getLastestEnumVersionByName({ 
          enumName: topicLevel, 
          applicationDomainId: this.getCliTaskConfig().applicationDomainId        
        });
        if(enumVersion !== undefined) enumVersionId = enumVersion.id;
      }
      addressLevels.push({
        name: topicLevel,
        addressLevelType: type,
        enumVersionId: enumVersionId
      });
    }
    return addressLevels;
  }
  
  private createObjectSettings(): Partial<EventVersion> {
    return {
      ...this.Default_TCliEventVersionTask_Settings,
      ...this.getCliTaskConfig().eventVersionSettings,
      deliveryDescriptor: {
        brokerType: "solace",
        address: {
          addressLevels: this.topicAddressLevelList,
          addressType: Address.addressType.TOPIC,
        }
      }
    };
  }

  protected async initializeTask(): Promise<void> {
    this.topicAddressLevelList = await this.initializeTopicAddressLevels({ channelTopic: this.getCliTaskConfig().channelTopic });
  }

  constructor(taskConfig: ICliEventVersionTask_Config) {
    super(taskConfig);
    this.newVersionString = taskConfig.baseVersionString;
  }

  protected getTaskKeys(): ICliEventVersionTask_Keys {
    return {
      eventId: this.getCliTaskConfig().eventId,
      applicationDomainId: this.getCliTaskConfig().applicationDomainId
    };
  }

  /**
   * Get the latest event version.
   */
  protected async getFunc(cliTaskKeys: ICliEventVersionTask_Keys): Promise<ICliEventVersionTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliEventVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      params: cliTaskKeys,
    }}));

    const eventVersion: EventVersion | undefined = await CliEPEventVersionsService.getLastestVersion({
      eventId: cliTaskKeys.eventId,
      applicationDomainId: cliTaskKeys.applicationDomainId,
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      eventVersion: eventVersion ? eventVersion : 'undefined'
    }}));
    if(eventVersion === undefined) throw new CliError(logName, 'eventVersion === undefined');

    const cliEventVersionTask_GetFuncReturn: ICliEventVersionTask_GetFuncReturn = {
      apiObject: eventVersion,
      eventVersionObject: eventVersion,
      documentExists: true,
    }
    return cliEventVersionTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliEventVersionTask_GetFuncReturn; 
  }): boolean {
    const funcName = 'isUpdateRequired';
    const logName = `${CliEventVersionTask.name}.${funcName}()`;
    if(cliGetFuncReturn.eventVersionObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.eventVersionObject === undefined');

    const existingObject: EventVersion = cliGetFuncReturn.eventVersionObject;

    const existingCompareObject: TCliEventVersionTask_CompareObject = {
      description: existingObject.description,
      displayName: existingObject.displayName,
      stateId: existingObject.stateId,
      schemaVersionId: existingObject.schemaVersionId,
      deliveryDescriptor: existingObject.deliveryDescriptor,
    };
    const requestedCompareObject: TCliEventVersionTask_CompareObject = this.createObjectSettings();

    const cliTaskDeepCompareResult: ICliTaskDeepCompareResult = this.deepCompareObjects({ existingObject: existingCompareObject, requestedObject: requestedCompareObject });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      existingCompareObject: this.prepareCompareObject4Output(existingCompareObject),
      requestedCompareObject: this.prepareCompareObject4Output(requestedCompareObject),
      isUpdateRequired: !cliTaskDeepCompareResult.isEqual,
      difference: cliTaskDeepCompareResult.difference
    }}));
    // if(!cliTaskDeepCompareResult.isEqual) throw new Error(`${logName}: check updates requiired`);
    return !cliTaskDeepCompareResult.isEqual;
  }

  private async createEventVersion({ eventId, eventVersion, code, targetLifecycleStateId }:{
    eventId: string;
    eventVersion: EventVersion;
    code: ECliStatusCodes;
    targetLifecycleStateId: string;
  }): Promise<EventVersion> {
    const funcName = 'createEventVersion';
    const logName = `${CliEventVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      document: eventVersion
    }}));

    const eventVersionResponse: EventVersionResponse = await EventsService.create2({
      eventId: eventId,
      requestBody: eventVersion
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      eventVersionResponse: eventVersionResponse
    }}));

    if(eventVersionResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventVersionResponse.data === undefined', {
      eventVersionResponse: eventVersionResponse
    });
    const createdEventVersion: EventVersion = eventVersionResponse.data;

    if(createdEventVersion.id === undefined || createdEventVersion.stateId === undefined) throw new CliEPApiContentError(logName, 'createdEventVersion.id === undefined || createdSchemaVersion.stateId === undefined', {
      createdEventVersion: createdEventVersion
    });
    // check the target lifecycle state
    if(createdEventVersion.stateId !== targetLifecycleStateId) {
      const versionedObjectStateChangeRequest: VersionedObjectStateChangeRequest = await EventsService.updateState({
        eventId: eventId,
        id: createdEventVersion.id,
        requestBody: {
          stateId: targetLifecycleStateId
        }
      });
      const updatedEventVersion: EventVersion | undefined = await CliEPEventVersionsService.getEventVersion({
        eventId: eventId,
        eventVersionString: this.newVersionString
      });
      if(updatedEventVersion === undefined) throw new CliEPApiContentError(logName, 'updatedEventVersion === undefined', {
        updatedEventVersion: updatedEventVersion
      });
      return updatedEventVersion;
    }
    return createdEventVersion;
  }
  /**
   * Create a new EventVersion
   */
  protected async createFunc(): Promise<ICliEventVersionTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliEventVersionTask.name}.${funcName}()`;

    const eventId: string = this.getCliTaskConfig().eventId;
    
    const create: EventVersion = {
      ...this.createObjectSettings(),
      eventId: eventId,
      version: this.newVersionString,
    };
    const eventVersion: EventVersion = await this.createEventVersion({
      eventId: eventId,
      eventVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_CREATE,
      targetLifecycleStateId: this.getCliTaskConfig().eventVersionSettings.stateId,
    });
    return {
      eventVersionObject: eventVersion,
      apiObject: eventVersion
    };
  }

  /**
   * Creates a new EventVersion with bumped version number.
   */
  protected async updateFunc(cliGetFuncReturn: ICliEventVersionTask_GetFuncReturn): Promise<ICliEventVersionTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliEventVersionTask.name}.${funcName}()`;

    cliGetFuncReturn;
    const eventId: string = this.getCliTaskConfig().eventId;

    const latestEventVersionString: string | undefined = await CliEPEventVersionsService.getLastestEventVersionString({ eventId: this.getCliTaskConfig().eventId });
    if(latestEventVersionString === undefined) throw new CliError(logName, 'latestEventVersionString === undefined');
    // bump version according to strategy
    const newEventVersionString = CliSemVerUtils.createNextVersion({
      versionString: latestEventVersionString,
      strategy: CliConfig.getCliAppConfig().assetImportTargetLifecycleState.versionStrategy,
    });

    const create: EventVersion = {
      ...this.createObjectSettings(),
      eventId: eventId,
      version: newEventVersionString,
    };
    const eventVersion: EventVersion = await this.createEventVersion({
      eventId: eventId,
      eventVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_UPDATE,
      targetLifecycleStateId: this.getCliTaskConfig().eventVersionSettings.stateId
    });

    const cliEventVersionTask_UpdateFuncReturn: ICliEventVersionTask_UpdateFuncReturn = {
      apiObject: eventVersion,
      eventVersionObject: eventVersion,
    };
    return cliEventVersionTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliEventVersionTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliEventVersionTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliEventVersionTask_ExecuteReturn: ICliEventVersionTask_ExecuteReturn = {
      ...cliTaskExecuteReturn,
      apiObject: undefined,
      eventVersionObject: cliTaskExecuteReturn.apiObject,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: {
      cliEventVersionTask_ExecuteReturn: cliEventVersionTask_ExecuteReturn,
    }}));
    return cliEventVersionTask_ExecuteReturn;
  }

}
