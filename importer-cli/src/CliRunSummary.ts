import { 
  ApplicationVersion,
  eventApiVersion as EventApiVersion 
} from '@solace-labs/ep-openapi-node';
import { 
  EEpSdkTask_Action,
  EEpSdkTask_EpObjectType,
  IEpSdkApplicationDomainTask_ExecuteReturn,
  IEpSdkApplicationVersionTask_ExecuteReturn,
  IEpSdkEnumTask_ExecuteReturn,
  IEpSdkEnumVersionTask_ExecuteReturn, 
  IEpSdkEpEventVersionTask_ExecuteReturn, 
  IEpSdkEventApiVersionTask_ExecuteReturn, 
  IEpSdkSchemaVersionTask_ExecuteReturn, 
  IEpSdkTask_ExecuteReturn 
} from "@solace-labs/ep-sdk";
import { CliError, CliUsageError } from "./CliError";
import { ECliImporterManagerMode, ICliImporterManagerOptions } from './CliImporterManager';
import { CliLogger, ECliStatusCodes, ECliSummaryStatusCodes } from "./CliLogger";
import { ECliRunContext_RunMode } from "./CliRunContext";
import { CliUtils } from './CliUtils';

export enum ECliChannelOperationType {
  PUBLISH = "publish",
  SUBSCRIBE = "subscribe"
}
export enum ECliRunSummary_Type {
  RunError = "RunError",
  ValidatingApi = "ValidatingApi",
  StartRun = "StartRun",
  ApiFile = "ApiFile",
  ApiFileApplication = "ApiFileApplication",
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
  // timestamp: number; // would have to create new set of interfaces: xxx_Create which omit timestamp
}
export interface ICliRunSummary_LogBase extends ICliRunSummary_Base {
  timestamp: number;
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
interface ICliRunSummary_ApiFileApplication extends ICliRunSummary_Base {
  type: ECliRunSummary_Type.ApiFileApplication;
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
  action: EEpSdkTask_Action;
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
  epObjectType: EEpSdkTask_EpObjectType;
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
export interface ICliImportSummary {
  processedApplicationDomains: number;
  createdApplicationDomains: number;
  processedApis: number;
  createdEventApiVersions: number;
  processedChannels: number;
  createdEventVersions: number;
  createdSchemaVersions: number;
  createdEnumVersions: number;
  warnings: Array<ICliRunSummary_Task_VersionObject_Warning>;
}

export class CliRunSummary {

  private summaryLogList: Array<ICliRunSummary_LogBase> = [];
  private applicationDomainName: string;
  private runMode: ECliRunContext_RunMode;

  public getSummaryLogList(): Array<ICliRunSummary_LogBase> { return this.summaryLogList; }
  
  private log = (code: ECliSummaryStatusCodes, cliRunSummary_Base: ICliRunSummary_Base, consoleOutput: string, consoleOutputOnly: boolean = false) => {
    const cliRunSummary_LogBase: ICliRunSummary_LogBase = {
      ...cliRunSummary_Base,
      timestamp: Date.now()
    }
    this.summaryLogList.push(cliRunSummary_LogBase);
    CliLogger.summary({
      cliRunSummary_LogBase: cliRunSummary_LogBase,
      consoleOutput: consoleOutput,
      code: code,
      useCliLogger: !consoleOutputOnly
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
    if(cliRunError.cliError instanceof CliUsageError) {
      const consoleOutput = `

  Usage Error: ------------------------  

  ${cliRunError.cliError.message}
  ${JSON.stringify(cliRunError.cliError.details, null, 2)}
      `;
      this.log(ECliSummaryStatusCodes.USAGE_ERROR, cliRunError, consoleOutput, true);  
    } else {
      const consoleOutput = `
  Run Error: ------------------------
    See log file for more details.
  
  ${cliRunError.cliError}
      `;
      this.log(ECliSummaryStatusCodes.RUN_ERROR, cliRunError, consoleOutput);  
    }
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

  public processingApiFileApplication = ({ cliRunSummary_ApiFileApplication }: {
    cliRunSummary_ApiFileApplication: ICliRunSummary_ApiFileApplication;
  }): void => {
    const consoleOutput = `
  Processing File: ${cliRunSummary_ApiFileApplication.apiFile}
    `;
    this.log(ECliSummaryStatusCodes.PROCESSING_API_FILE_APPLICATION, this.addRun(cliRunSummary_ApiFileApplication), consoleOutput);
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

  public processingStartApplicationVersion = ({ exactTargetVersion, epSdkApplicationVersionTask_ExecuteReturn_Check, latestExistingApplicationVersionObjectBefore }:{
    exactTargetVersion: string;
    epSdkApplicationVersionTask_ExecuteReturn_Check: IEpSdkApplicationVersionTask_ExecuteReturn;
    latestExistingApplicationVersionObjectBefore?: EventApiVersion;
  }): void => {
    const cliRunSummary_Task_VersionObject_Check: ICliRunSummary_Task_VersionObject_Check = {
      type: ECliRunSummary_Type.VersionObjectCheck,
      exactTargetVersion: exactTargetVersion,
      action: epSdkApplicationVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action,
      epObjectType: epSdkApplicationVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epObjectKeys.epObjectType,
      displayName: epSdkApplicationVersionTask_ExecuteReturn_Check.epObject.displayName,
      version: latestExistingApplicationVersionObjectBefore?.version,
      state: latestExistingApplicationVersionObjectBefore?.stateId
    };
    const existingVersionOutput = latestExistingApplicationVersionObjectBefore ? `${cliRunSummary_Task_VersionObject_Check.version} (state: ${cliRunSummary_Task_VersionObject_Check.state})` : 'None.';
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
    this.log(ECliSummaryStatusCodes.PROCESSING_START_APPLICATION_VERSION, this.addTaskElements(cliRunSummary_Task_VersionObject_Check), consoleOutput);
  }

  public processedApplicationVersionWithWarning = ({ targetApplicationState, targetApplicationVersion, epSdkApplicationVersionTask_ExecuteReturn, latestExistingApplicationVersionObjectBefore }: { 
    targetApplicationVersion: string;
    targetApplicationState: string;
    epSdkApplicationVersionTask_ExecuteReturn: IEpSdkApplicationVersionTask_ExecuteReturn;
    latestExistingApplicationVersionObjectBefore: ApplicationVersion;
  }): void => {
    const cliRunSummary_Task_VersionObject_Warning: ICliRunSummary_Task_VersionObject_Warning = {
      type: ECliRunSummary_Type.VersionObjectWarning,
      action: epSdkApplicationVersionTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action,
      epObjectType: epSdkApplicationVersionTask_ExecuteReturn.epSdkTask_TransactionLogData.epObjectKeys.epObjectType,
      displayName: epSdkApplicationVersionTask_ExecuteReturn.epObject.displayName,
      existingVersion: latestExistingApplicationVersionObjectBefore.version ? latestExistingApplicationVersionObjectBefore.version : 'undefined',
      existingVersionState: latestExistingApplicationVersionObjectBefore.stateId ? latestExistingApplicationVersionObjectBefore.stateId : 'undefined',
      targetVersion: targetApplicationVersion,
      targetVersionState: targetApplicationState,
      createdVersion: epSdkApplicationVersionTask_ExecuteReturn.epObject.version ? epSdkApplicationVersionTask_ExecuteReturn.epObject.version : 'undefined',
      createdVersionState: epSdkApplicationVersionTask_ExecuteReturn.epObject.stateId ? epSdkApplicationVersionTask_ExecuteReturn.epObject.stateId : 'undefined', 
    };
    let consoleOutput: string;
    if(cliRunSummary_Task_VersionObject_Warning.action === EEpSdkTask_Action.NO_ACTION) {
      consoleOutput = `
      Run Warning for ${cliRunSummary_Task_VersionObject_Warning.epObjectType}:
        Warning:  Inconsistent Application Versions
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
        Warning:  Inconsistent Application Versions
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
    this.processedVersionObject(ECliSummaryStatusCodes.PROCESSED_APPLICATION_VERSION, epSdkApplicationVersionTask_ExecuteReturn);
  }

  public processedApplicationVersion = ({ epSdkApplicationVersionTask_ExecuteReturn }:{
    epSdkApplicationVersionTask_ExecuteReturn: IEpSdkApplicationVersionTask_ExecuteReturn;
  }): void => {
    this.processedVersionObject(ECliSummaryStatusCodes.PROCESSED_APPLICATION_VERSION, epSdkApplicationVersionTask_ExecuteReturn);
  }

  public createImportSummary = (cliImporterManagerMode: ECliImporterManagerMode): ICliImportSummary => {
    const funcName = 'createImportSummary';
    const logName = `${CliRunSummary.name}.${funcName}()`;

    const cliRunSummary_LogBase_List: Array<ICliRunSummary_LogBase> = this.getSummaryLogList();
    let cliRunSummary_LogBase_Filtered_List: Array<ICliRunSummary_LogBase> = [];

    switch(cliImporterManagerMode) {
      case ECliImporterManagerMode.TEST_MODE:
      case ECliImporterManagerMode.TEST_MODE_KEEP:
        cliRunSummary_LogBase_Filtered_List = cliRunSummary_LogBase_List.filter( (cliRunSummary_LogBase: ICliRunSummary_LogBase) => {
          return cliRunSummary_LogBase.runMode === ECliRunContext_RunMode.TEST_PASS_1;
        });
        break;
      case ECliImporterManagerMode.RELEASE_MODE:
        cliRunSummary_LogBase_Filtered_List = cliRunSummary_LogBase_List.filter( (cliRunSummary_LogBase: ICliRunSummary_LogBase) => {
          return cliRunSummary_LogBase.runMode === ECliRunContext_RunMode.RELEASE;
        });
        break;
      default: 
        CliUtils.assertNever(logName, cliImporterManagerMode);
    }

    // // DEBUG
    // console.log(`${JSON.stringify(cliRunSummary_LogBase_Filtered_List, null, 2)}`);
    // // END DEBUG

    // const processedApiFiles = cliRunSummary_LogBase_Filtered_List.reduce( (count, item) => count + Number(item.type === ECliRunSummary_Type.ApiFile), 0);
    const processedApis = cliRunSummary_LogBase_Filtered_List.reduce( (count, item) => count + Number(item.type === ECliRunSummary_Type.Api), 0);
    const processedChannels = cliRunSummary_LogBase_Filtered_List.reduce( (count, item) => count + Number(item.type === ECliRunSummary_Type.ApiChannel), 0);

    const cliRunSummary_ApplicationDomain_List: Array<ICliRunSummary_Task_ApplicationDomain> = cliRunSummary_LogBase_Filtered_List.filter( (cliRunSummary_LogBase: ICliRunSummary_LogBase) => {
      return cliRunSummary_LogBase.type === ECliRunSummary_Type.ApplicationDomain;
    }) as unknown as Array<ICliRunSummary_Task_ApplicationDomain>;
    const processedApplicationDomains = cliRunSummary_ApplicationDomain_List.length;
    const createdApplicationDomains = cliRunSummary_ApplicationDomain_List.reduce( (count, item) => count + Number(item.type === ECliRunSummary_Type.ApplicationDomain && item.action !== EEpSdkTask_Action.NO_ACTION), 0);


    const cliRunSummary_CreatedVersionObject_List: Array<ICliRunSummary_Task_VersionObject> = cliRunSummary_LogBase_Filtered_List.filter( (cliRunSummary_LogBase: ICliRunSummary_LogBase) => {
      if(cliRunSummary_LogBase.type === ECliRunSummary_Type.VersionObject) {
        const cliRunSummary_Task_VersionObject: ICliRunSummary_Task_VersionObject = cliRunSummary_LogBase as unknown as ICliRunSummary_Task_VersionObject;
        if(cliRunSummary_Task_VersionObject.action === EEpSdkTask_Action.CREATE_FIRST_VERSION || cliRunSummary_Task_VersionObject.action === EEpSdkTask_Action.CREATE_NEW_VERSION) return true;
        return false;
      }
      return false;
    }) as unknown as Array<ICliRunSummary_Task_VersionObject>;

    // // DEBUG
    // console.log(`${JSON.stringify(cliRunSummary_CreatedVersionObject_List, null, 2)}`);
    // CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_API, details: {
    //   runMode: this.runMode,
    //   cliRunSummary_CreatedVersionObject_List: cliRunSummary_CreatedVersionObject_List
    // }}));
    // // END DEBUG

    const cliRunSummary_CreatedVersionObjectWarning_List: Array<ICliRunSummary_Task_VersionObject_Warning> = cliRunSummary_LogBase_Filtered_List.filter( (cliRunSummary_LogBase: ICliRunSummary_LogBase) => {
       return cliRunSummary_LogBase.type === ECliRunSummary_Type.VersionObjectWarning;
    }) as unknown as Array<ICliRunSummary_Task_VersionObject_Warning>;

    // // DEBUG
    // console.log(`${JSON.stringify(cliRunSummary_CreatedVersionObject_List, null, 2)}`);
    // CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_API, details: {
    //   runMode: this.runMode,
    //   cliRunSummary_CreatedVersionObjectWarning_List: cliRunSummary_CreatedVersionObjectWarning_List
    // }}));
    // // END DEBUG

    const createdEventApiVersions = cliRunSummary_CreatedVersionObject_List.reduce( (count, item) => count + Number(item.epObjectType === EEpSdkTask_EpObjectType.EVENT_API_VERSION), 0);
    const createdEventVersions = cliRunSummary_CreatedVersionObject_List.reduce( (count, item) => count + Number(item.epObjectType === EEpSdkTask_EpObjectType.EVENT_VERSION), 0);
    const createdSchemaVersions = cliRunSummary_CreatedVersionObject_List.reduce( (count, item) => count + Number(item.epObjectType === EEpSdkTask_EpObjectType.SCHEMA_VERSION), 0);
    const createdEnumVersions = cliRunSummary_CreatedVersionObject_List.reduce( (count, item) => count + Number(item.epObjectType === EEpSdkTask_EpObjectType.ENUM_VERSION), 0);

    return {
      processedApplicationDomains: processedApplicationDomains,
      createdApplicationDomains: createdApplicationDomains,
      processedApis: processedApis,
      createdEventApiVersions: createdEventApiVersions,
      processedChannels: processedChannels,
      createdEventVersions: createdEventVersions,
      createdSchemaVersions: createdSchemaVersions,
      createdEnumVersions: createdEnumVersions,
      warnings: cliRunSummary_CreatedVersionObjectWarning_List,
    };
  }

  public processedImport = (logName: string, cliImporterManagerOptions: ICliImporterManagerOptions) => {

    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_API, details: {
      cliImporterManagerMode: cliImporterManagerOptions.cliImporterManagerMode,
      runMode: this.runMode,
      summaryLogList: this.getSummaryLogList()
    }}));

    const cliImportSummary: ICliImportSummary = this.createImportSummary(cliImporterManagerOptions.cliImporterManagerMode);

    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_API, details: {
      cliImporterManagerMode: cliImporterManagerOptions.cliImporterManagerMode,
      runMode: this.runMode,
      cliImportSummary: cliImportSummary
    }}));

    const consoleOutput = `
------------------------------------------------------------------------------------------------    
Import Summary for mode: ${cliImporterManagerOptions.cliImporterManagerMode}

  Processed Application Domains: ${cliImportSummary.processedApplicationDomains}
    Created Application Domains:  ${cliImportSummary.createdApplicationDomains}
  Processed Apis: ${cliImportSummary.processedApis}
    Created Event Apis Versions:  ${cliImportSummary.createdEventApiVersions}
  Processed Channels: ${cliImportSummary.processedChannels}
    Created Event Versions:       ${cliImportSummary.createdEventVersions}
    Created Schema Versions:      ${cliImportSummary.createdSchemaVersions}
    Created Enum Versions:        ${cliImportSummary.createdEnumVersions}
  
  Warnings: ${cliImportSummary.warnings.length}
    
${cliImportSummary.warnings.length > 0 ? JSON.stringify(cliImportSummary.warnings, null, 2) : ''}

------------------------------------------------------------------------------------------------    
    `;
    console.log(consoleOutput);
  }

}

export default new CliRunSummary();