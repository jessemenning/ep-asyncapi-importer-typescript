import { 
  eventApiVersion as EventApiVersion 
} from '@solace-labs/ep-openapi-node';
import { 
  EEpSdkTask_Action,
  IEpSdkApplicationDomainTask_ExecuteReturn,
  IEpSdkEnumTask_ExecuteReturn,
  IEpSdkEnumVersionTask_ExecuteReturn, 
  IEpSdkEpEventVersionTask_ExecuteReturn, 
  IEpSdkEventApiVersionTask_ExecuteReturn, 
  IEpSdkSchemaVersionTask_ExecuteReturn, 
  IEpSdkTask_ExecuteReturn 
} from "@solace-labs/ep-sdk";
import { CliError } from "./CliError";
import { CliLogger, ECliSummaryStatusCodes } from "./CliLogger";
import { ECliRunContext_RunMode } from "./CliRunContext";

export enum ECliChannelOperationType {
  PUBLISH = "publish",
  SUBSCRIBE = "subscribe"
}
export enum ECliRunSummary_Type {
  RunError = "RunError",
  ValidatingApi = "ValidatingApi",
  StartRun = "StartRun",
  ApiFile = "ApiFile",
  Api = "Api",
  ApiChannel = "ApiChannel",
  ApiChannelOperation = "ApiChannelOperation",
  ApplicationDomain = "ApplicationDomain",
  Enum = "Enum",
  VersionObject = "VersionObject",
  VersionObjectCheck = "VersionObjectCheck",
  VersionObjectWarning = "VersionObjectWarning",
}

// taskTransactionId: string;
export interface ICliRunError {
  type: ECliRunSummary_Type.RunError;
  runMode?: ECliRunContext_RunMode;
  cliError: CliError;
}
export interface ICliRunSummary_Base {
  type: ECliRunSummary_Type;
  runMode?: ECliRunContext_RunMode;
}
interface ICliRunSummary_ValidatingApi extends ICliRunSummary_Base {
  type: ECliRunSummary_Type.ValidatingApi;
  apiFile: string;
}
interface ICliRunSummary_StartRun extends ICliRunSummary_Base {
  type: ECliRunSummary_Type.StartRun;
}
interface ICliRunSummary_ApiFile extends ICliRunSummary_Base {
  type: ECliRunSummary_Type.ApiFile;
  apiFile: string;
}
interface ICliRunSummary_Api extends ICliRunSummary_Base {
  type: ECliRunSummary_Type.Api;
  apiName: string;
  apiVersion: string;
  applicationDomainName: string;
}
interface ICliRunSummary_ApiChannel extends ICliRunSummary_Base {
  type: ECliRunSummary_Type.ApiChannel;
  channelTopic: string;
}
interface ICliRunSummary_ApiChannel_Operation extends ICliRunSummary_Base {
  type: ECliRunSummary_Type.ApiChannelOperation;
  operationType: ECliChannelOperationType;
}
interface ICliRunSummary_Task extends ICliRunSummary_Base {
  applicationDomainName?: string;
  action: string;
}
interface ICliRunSummary_Task_ApplicationDomain extends ICliRunSummary_Task {
  type: ECliRunSummary_Type.ApplicationDomain;
}
interface ICliRunSummary_Task_Enum extends ICliRunSummary_Task {
  type: ECliRunSummary_Type.Enum,
  name: string;
}
interface ICliRunSummary_Task_VersionObject extends ICliRunSummary_Task {
  type: ECliRunSummary_Type.VersionObject;
  displayName?: string;
  version?: string;
  state?: string;
  epObjectType: string;
}
interface ICliRunSummary_Task_VersionObject_Check extends ICliRunSummary_Task, Omit<ICliRunSummary_Task_VersionObject, "type"> {
  type: ECliRunSummary_Type.VersionObjectCheck;
  exactTargetVersion: string;
}
interface ICliRunSummary_Task_VersionObject_Warning extends ICliRunSummary_Task, Omit<ICliRunSummary_Task_VersionObject, "type"> {
  type: ECliRunSummary_Type.VersionObjectWarning;
  existingVersion: string;
  existingVersionState: string;
  targetVersion: string;
  targetVersionState: string;
  createdVersion: string;
  createdVersionState: string;
}

export class CliRunSummary {

  private summaryLogList: Array<ICliRunSummary_Base> = [];
  private applicationDomainName: string;
  private runMode: ECliRunContext_RunMode;

  public getSummaryLogList(): Array<ICliRunSummary_Base> { return this.summaryLogList; }
  
  private log = (code: ECliSummaryStatusCodes, cliRunSummary_Base: ICliRunSummary_Base, consoleOutput: string) => {
    this.summaryLogList.push(cliRunSummary_Base);
    CliLogger.summary({
      cliRunSummary_Base: cliRunSummary_Base,
      consoleOutput: consoleOutput,
      code: code,
    })
  }

  private addRun = (cliRunSummary_Base: ICliRunSummary_Base): ICliRunSummary_Base => {
    return {
      ...cliRunSummary_Base,
      runMode: this.runMode,
    };
  }

  private addTaskElements = (cliRunSummary_Task: ICliRunSummary_Task): ICliRunSummary_Task => {
    return {
      ...cliRunSummary_Task,
      ...this.addRun(cliRunSummary_Task),
      applicationDomainName: this.applicationDomainName,
    }
  }

  public runError = ({ cliRunError }:{
    cliRunError: ICliRunError;
  }): void => {
    const consoleOutput = `
Run Error: ------------------------
  See log file for more details.

${cliRunError.cliError}
    `;
    this.log(ECliSummaryStatusCodes.RUN_ERROR, cliRunError, consoleOutput);
  }

  public startRun = ({ cliRunSummary_StartRun }:{
    cliRunSummary_StartRun: Required<ICliRunSummary_StartRun>;
  }): void => {
    this.runMode = cliRunSummary_StartRun.runMode;
    const consoleOutput = `
Start Run: ${cliRunSummary_StartRun.runMode} ------------------------
    `;
    this.log(ECliSummaryStatusCodes.START_RUN, cliRunSummary_StartRun, consoleOutput);
  }

  public validatingApi = ({ cliRunSummary_ValidatingApi }:{
    cliRunSummary_ValidatingApi: ICliRunSummary_ValidatingApi;
  }): void => {
    const consoleOutput = `
  Validating Api: ${cliRunSummary_ValidatingApi.apiFile}
    `;
    this.log(ECliSummaryStatusCodes.VALIDATING_API, cliRunSummary_ValidatingApi, consoleOutput);
  }

  public processingApiFile = ({ cliRunSummary_ApiFile }: {
    cliRunSummary_ApiFile: ICliRunSummary_ApiFile;
  }): void => {
    const consoleOutput = `
  Processing File: ${cliRunSummary_ApiFile.apiFile}
    `;
    this.log(ECliSummaryStatusCodes.PROCESSING_API_FILE, this.addRun(cliRunSummary_ApiFile), consoleOutput);
  }

  public processingApi = ({ cliRunSummary_Api }: {
    cliRunSummary_Api: ICliRunSummary_Api;
  }): void => {
    const consoleOutput = `
    Processing Api: ${cliRunSummary_Api.apiName}@${cliRunSummary_Api.apiVersion}
      Application Domain: ${cliRunSummary_Api.applicationDomainName}
    `;
    this.log(ECliSummaryStatusCodes.PROCESSING_API, this.addRun(cliRunSummary_Api), consoleOutput);
  }
  public processingApiChannel = ({ cliRunSummary_ApiChannel }: {
    cliRunSummary_ApiChannel: ICliRunSummary_ApiChannel;
  }): void => {
    const consoleOutput = `
      Processing Api Channel: ${cliRunSummary_ApiChannel.channelTopic}
    `;
    this.log(ECliSummaryStatusCodes.PROCESSING_API_CHANNEL, this.addRun(cliRunSummary_ApiChannel), consoleOutput);
  }
  public processingApiChannelOperation = ({ cliRunSummary_ApiChannel_Operation }: {
    cliRunSummary_ApiChannel_Operation: ICliRunSummary_ApiChannel_Operation;
  }): void => {
    const consoleOutput = `
        Processing Api Channel Operation: ${cliRunSummary_ApiChannel_Operation.operationType}
    `;
    this.log(ECliSummaryStatusCodes.PROCESSING_API_CHANNEL_OPERATION, this.addRun(cliRunSummary_ApiChannel_Operation), consoleOutput);
  }
  public processedApplicationDomain = ({ epSdkApplicationDomainTask_ExecuteReturn }:{
    epSdkApplicationDomainTask_ExecuteReturn: IEpSdkApplicationDomainTask_ExecuteReturn
  }): void => {
    this.applicationDomainName = epSdkApplicationDomainTask_ExecuteReturn.epObject.name;
    const consoleOutput = `
      ${epSdkApplicationDomainTask_ExecuteReturn.epObject.type}:
        ${this.applicationDomainName} (${epSdkApplicationDomainTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action})
    `;
    const cliRunSummary_Task_ApplicationDomain: Required<Omit<ICliRunSummary_Task_ApplicationDomain, "runMode">> = {
      type: ECliRunSummary_Type.ApplicationDomain,
      applicationDomainName: this.applicationDomainName,
      action: epSdkApplicationDomainTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action,
    }
    this.log(ECliSummaryStatusCodes.PROCESSED_APPLICATION_DOMAIN, this.addTaskElements(cliRunSummary_Task_ApplicationDomain), consoleOutput);
  }

  public processedEnum = ({ epSdkEnumTask_ExecuteReturn }:{
    epSdkEnumTask_ExecuteReturn: IEpSdkEnumTask_ExecuteReturn
  }): void => {
    const consoleOutput = `
        ${epSdkEnumTask_ExecuteReturn.epObject.type}:
          ${epSdkEnumTask_ExecuteReturn.epObject.name} (${epSdkEnumTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action})
    `;
    const cliRunSummary_Task_Enum: ICliRunSummary_Task_Enum = {
      type: ECliRunSummary_Type.Enum,
      name: epSdkEnumTask_ExecuteReturn.epObject.name ? epSdkEnumTask_ExecuteReturn.epObject.name : 'undefined',
      action: epSdkEnumTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action,
    }
    this.log(ECliSummaryStatusCodes.PROCESSED_ENUM, this.addTaskElements(cliRunSummary_Task_Enum), consoleOutput);
  }

  private processedVersionObject = (code: ECliSummaryStatusCodes, epSdkTask_ExecuteReturn: IEpSdkTask_ExecuteReturn): void => {
    const cliRunSummary_Task_VersionObject: ICliRunSummary_Task_VersionObject = {
      type: ECliRunSummary_Type.VersionObject,
      action: epSdkTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action,
      epObjectType: epSdkTask_ExecuteReturn.epSdkTask_TransactionLogData.epObjectKeys.epObjectType,
      displayName: epSdkTask_ExecuteReturn.epObject.displayName,
      version: epSdkTask_ExecuteReturn.epObject.version,
      state: epSdkTask_ExecuteReturn.epObject.stateId
    };
    // const consoleOutput = `
    //   Application Domain: ${this.applicationDomainName}
    //     ${cliRunSummary_Task_VersionObject.epObjectType}:
    //       ${cliRunSummary_Task_VersionObject.displayName}@${cliRunSummary_Task_VersionObject.version}, state=${cliRunSummary_Task_VersionObject.state} (${cliRunSummary_Task_VersionObject.action})
    // `;
    const consoleOutput = `
        ${cliRunSummary_Task_VersionObject.epObjectType}:
          ${cliRunSummary_Task_VersionObject.displayName}@${cliRunSummary_Task_VersionObject.version}, state=${cliRunSummary_Task_VersionObject.state} (${cliRunSummary_Task_VersionObject.action})
    `;
    this.log(code, this.addTaskElements(cliRunSummary_Task_VersionObject), consoleOutput);
  }

  public processedEnumVersion = ({ epSdkEnumVersionTask_ExecuteReturn }:{
    epSdkEnumVersionTask_ExecuteReturn: IEpSdkEnumVersionTask_ExecuteReturn;
  }): void => {
    this.processedVersionObject(ECliSummaryStatusCodes.PROCESSED_ENUM_VERSION, epSdkEnumVersionTask_ExecuteReturn);
  }

  public processedSchemaVersion = ({ epSdkSchemaVersionTask_ExecuteReturn }: {
    epSdkSchemaVersionTask_ExecuteReturn: IEpSdkSchemaVersionTask_ExecuteReturn;
  }): void => {
    this.processedVersionObject(ECliSummaryStatusCodes.PROCESSED_SCHEMA_VERSION, epSdkSchemaVersionTask_ExecuteReturn);
  }

  public processedEventVersion = ({ epSdkEpEventVersionTask_ExecuteReturn }:{
    epSdkEpEventVersionTask_ExecuteReturn: IEpSdkEpEventVersionTask_ExecuteReturn;
  }): void => {
    this.processedVersionObject(ECliSummaryStatusCodes.PROCESSED_EVENT_VERSION, epSdkEpEventVersionTask_ExecuteReturn);
  }

  public processedEventApiVersion = ({ epSdkEventApiVersionTask_ExecuteReturn }:{
    epSdkEventApiVersionTask_ExecuteReturn: IEpSdkEventApiVersionTask_ExecuteReturn;
  }): void => {
    this.processedVersionObject(ECliSummaryStatusCodes.PROCESSED_EVENT_API_VERSION, epSdkEventApiVersionTask_ExecuteReturn);
  }

  public processedEventApiVersionWithWarning = ({ targetEventApiVersion, targetEventApiState, epSdkEventApiVersionTask_ExecuteReturn, latestExistingEventApiVersionObjectBefore }: { 
    targetEventApiVersion: string;
    targetEventApiState: string;
    epSdkEventApiVersionTask_ExecuteReturn: IEpSdkEventApiVersionTask_ExecuteReturn;
    latestExistingEventApiVersionObjectBefore: EventApiVersion;
  }): void => {
    const cliRunSummary_Task_VersionObject_Warning: ICliRunSummary_Task_VersionObject_Warning = {
      type: ECliRunSummary_Type.VersionObjectWarning,
      action: epSdkEventApiVersionTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action,
      epObjectType: epSdkEventApiVersionTask_ExecuteReturn.epSdkTask_TransactionLogData.epObjectKeys.epObjectType,
      displayName: epSdkEventApiVersionTask_ExecuteReturn.epObject.displayName,
      existingVersion: latestExistingEventApiVersionObjectBefore.version ? latestExistingEventApiVersionObjectBefore.version : 'undefined',
      existingVersionState: latestExistingEventApiVersionObjectBefore.stateId ? latestExistingEventApiVersionObjectBefore.stateId : 'undefined',
      targetVersion: targetEventApiVersion,
      targetVersionState: targetEventApiState,
      createdVersion: epSdkEventApiVersionTask_ExecuteReturn.epObject.version ? epSdkEventApiVersionTask_ExecuteReturn.epObject.version : 'undefined',
      createdVersionState: epSdkEventApiVersionTask_ExecuteReturn.epObject.stateId ? epSdkEventApiVersionTask_ExecuteReturn.epObject.stateId : 'undefined', 
    };
    let consoleOutput: string;
    if(cliRunSummary_Task_VersionObject_Warning.action === EEpSdkTask_Action.NO_ACTION) {
      consoleOutput = `
      Run Warning for ${cliRunSummary_Task_VersionObject_Warning.epObjectType}:
        Warning:  Inconsistent Event Api Versions
        Name:     ${cliRunSummary_Task_VersionObject_Warning.displayName}
        Action:   ${cliRunSummary_Task_VersionObject_Warning.action}
        Existing Version: ${cliRunSummary_Task_VersionObject_Warning.existingVersion}
        Existing State:   ${cliRunSummary_Task_VersionObject_Warning.existingVersionState}
        Target Version:   ${cliRunSummary_Task_VersionObject_Warning.targetVersion}
        Target State:     ${cliRunSummary_Task_VersionObject_Warning.targetVersionState}
      `;
    } else {
      consoleOutput = `
      Run Warning for ${cliRunSummary_Task_VersionObject_Warning.epObjectType}:
        Warning:  Inconsistent Event Api Versions
        Name:     ${cliRunSummary_Task_VersionObject_Warning.displayName}
        Action:   ${cliRunSummary_Task_VersionObject_Warning.action}
        Existing Version: ${cliRunSummary_Task_VersionObject_Warning.existingVersion}
        Existing State:   ${cliRunSummary_Task_VersionObject_Warning.existingVersionState}
        Target Version:   ${cliRunSummary_Task_VersionObject_Warning.targetVersion}
        Target State:     ${cliRunSummary_Task_VersionObject_Warning.targetVersionState}
        Created Version:  ${cliRunSummary_Task_VersionObject_Warning.createdVersion}
        Created State:    ${cliRunSummary_Task_VersionObject_Warning.createdVersionState}
      `;
    }
    this.log(ECliSummaryStatusCodes.PROCESSING_START_EVENT_API_VERSION, this.addTaskElements(cliRunSummary_Task_VersionObject_Warning), consoleOutput);
    this.processedVersionObject(ECliSummaryStatusCodes.PROCESSED_EVENT_API_VERSION, epSdkEventApiVersionTask_ExecuteReturn);
  }

  public processingStartEventApiVersion = ({ exactTargetVersion, epSdkEventApiVersionTask_ExecuteReturn_Check, latestExistingEventApiVersionObjectBefore }:{
    exactTargetVersion: string;
    epSdkEventApiVersionTask_ExecuteReturn_Check: IEpSdkEventApiVersionTask_ExecuteReturn;
    latestExistingEventApiVersionObjectBefore?: EventApiVersion;
  }): void => {
    const cliRunSummary_Task_VersionObject_Check: ICliRunSummary_Task_VersionObject_Check = {
      type: ECliRunSummary_Type.VersionObjectCheck,
      exactTargetVersion: exactTargetVersion,
      action: epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action,
      epObjectType: epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epObjectKeys.epObjectType,
      displayName: epSdkEventApiVersionTask_ExecuteReturn_Check.epObject.displayName,
      version: latestExistingEventApiVersionObjectBefore?.version,
      state: latestExistingEventApiVersionObjectBefore?.stateId
    };
    const existingVersionOutput = latestExistingEventApiVersionObjectBefore ? `${cliRunSummary_Task_VersionObject_Check.version} (state: ${cliRunSummary_Task_VersionObject_Check.state})` : 'None.';
    let consoleOutput = `
      Run Check for ${cliRunSummary_Task_VersionObject_Check.epObjectType}:
        Name:     ${cliRunSummary_Task_VersionObject_Check.displayName}
        Action:   ${cliRunSummary_Task_VersionObject_Check.action}
        Exsiting Version: ${existingVersionOutput}
        Target Version:   ${cliRunSummary_Task_VersionObject_Check.exactTargetVersion}`;
    if(cliRunSummary_Task_VersionObject_Check.action !== EEpSdkTask_Action.NO_ACTION) {
      consoleOutput += `
        Updates Required: See epSdkTask_IsUpdateRequiredFuncReturn in details.
      `;
    } else {
      consoleOutput += `
      `;
    }
    this.log(ECliSummaryStatusCodes.PROCESSING_START_EVENT_API_VERSION, this.addTaskElements(cliRunSummary_Task_VersionObject_Check), consoleOutput);
  }

}

export default new CliRunSummary();