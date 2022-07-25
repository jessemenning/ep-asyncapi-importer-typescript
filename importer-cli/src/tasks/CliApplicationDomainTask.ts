import CliConfig from "../CliConfig";
import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn, ICliTaskIsUpdateRequiredReturn, ICliTaskDeepCompareResult } from "./CliTask";
import { ApplicationDomain, ApplicationDomainResponse, ApplicationDomainsResponse, ApplicationDomainsService } from "../_generated/@solace-iot-team/sep-openapi-node";
import _ from "lodash";
import CliEPApplicationDomainsService from "../services/CliEPApplicationDomainsService";

type TCliApplicationDomainTask_Settings = Partial<Pick<ApplicationDomain, "topicDomainEnforcementEnabled" | "uniqueTopicAddressEnforcementEnabled" | "description">>;
type TCliApplicationDomainTask_CompareObject = TCliApplicationDomainTask_Settings;
export interface ICliApplicationDomainTask_Config extends ICliTaskConfig {
  applicationDomainName: string;
  applicationDomainSettings: TCliApplicationDomainTask_Settings;
}
export interface ICliApplicationDomainTask_Keys extends ICliTaskKeys {
  applicationDomainName: string;
}
export interface ICliApplicationDomainTask_GetFuncReturn extends ICliGetFuncReturn {
  applicationDomainObject: ApplicationDomain | undefined;
}
export interface ICliApplicationDomainTask_CreateFuncReturn extends ICliCreateFuncReturn {
  applicationDomainObject: ApplicationDomain;
}
export interface ICliApplicationDomainTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  applicationDomainObject: ApplicationDomain;
}
export interface ICliApplicationDomainTask_ExecuteReturn extends ICliTaskExecuteReturn {
  applicationDomainObject: ApplicationDomain;
}


export class CliApplicationDomainTask extends CliTask {

  private readonly Empty_ICliApplicationDomainTask_GetFuncReturn: ICliApplicationDomainTask_GetFuncReturn = {
    apiObject: undefined,
    applicationDomainObject: undefined,
    documentExists: false  
  };
  private readonly Default_TCliApplicationDomainTask_Settings: TCliApplicationDomainTask_Settings = {
    topicDomainEnforcementEnabled: false,
    uniqueTopicAddressEnforcementEnabled: true,
    description: `Created by ${CliConfig.getAppDisplayName()}.`,
  }
  private getCliTaskConfig(): ICliApplicationDomainTask_Config { return this.cliTaskConfig as ICliApplicationDomainTask_Config; }
  private createApplicationDomainSettings(): Partial<ApplicationDomain> {
    return {
      ...this.Default_TCliApplicationDomainTask_Settings,
      ...this.getCliTaskConfig().applicationDomainSettings,
    }
  }

  constructor(taskConfig: ICliApplicationDomainTask_Config) {
    super(taskConfig);
  }

  protected getTaskKeys(): ICliApplicationDomainTask_Keys {
    return {
      applicationDomainName: this.getCliTaskConfig().applicationDomainName
    }
  }

  protected async getFunc(cliTaskKeys: ICliApplicationDomainTask_Keys): Promise<ICliApplicationDomainTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliApplicationDomainTask.name}.${funcName}()`;

    const applicationDomainName = cliTaskKeys.applicationDomainName;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      cliTaskKeys: cliTaskKeys
    }}));

    const applicationDomain: ApplicationDomain | undefined = await CliEPApplicationDomainsService.getByName({ applicationDomainName: applicationDomainName });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      cliTaskKeys: cliTaskKeys,
      applicationDomain: applicationDomain ? applicationDomain : 'undefined'
    }}));

    if(applicationDomain === undefined) return this.Empty_ICliApplicationDomainTask_GetFuncReturn;

    const cliApplicationDomainTask_GetFuncReturn: ICliApplicationDomainTask_GetFuncReturn = {
      apiObject: applicationDomain,
      applicationDomainObject: applicationDomain,
      documentExists: true
    };
    return cliApplicationDomainTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliApplicationDomainTask_GetFuncReturn; 
  }): ICliTaskIsUpdateRequiredReturn {
    const funcName = 'isUpdateRequired';
    const logName = `${CliApplicationDomainTask.name}.${funcName}()`;
    if(cliGetFuncReturn.applicationDomainObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.applicationDomainObject === undefined');
    let isUpdateRequired: boolean = false;

    const existingObject: ApplicationDomain = cliGetFuncReturn.applicationDomainObject;
    const existingCompareObject: TCliApplicationDomainTask_CompareObject = {
      description: existingObject.description,
      topicDomainEnforcementEnabled: existingObject.topicDomainEnforcementEnabled,
      uniqueTopicAddressEnforcementEnabled: existingObject.uniqueTopicAddressEnforcementEnabled,
    }
    const requestedCompareObject: TCliApplicationDomainTask_CompareObject = this.createApplicationDomainSettings();

    const cliTaskDeepCompareResult: ICliTaskDeepCompareResult = this.deepCompareObjects({ existingObject: existingCompareObject, requestedObject: requestedCompareObject });

    const cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn = {
      isUpdateRequired: !cliTaskDeepCompareResult.isEqual,
      existingCompareObject: this.prepareCompareObject4Output(existingCompareObject),
      requestedCompareObject: this.prepareCompareObject4Output(requestedCompareObject),
      difference: cliTaskDeepCompareResult.difference
    }
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      ...cliTaskIsUpdateRequiredReturn
    }}));
    // DEBUG:
    // if(!cliTaskDeepCompareResult.isEqual) throw new Error(`${logName}: check updates requiired`);
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

  protected async createFunc(): Promise<ICliApplicationDomainTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliApplicationDomainTask.name}.${funcName}()`;

    const create: ApplicationDomain = {
      ...this.createApplicationDomainSettings(),
      name: this.getCliTaskConfig().applicationDomainName,
    }

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      document: create
    }}));

    const applicationDomainResponse: ApplicationDomainResponse = await ApplicationDomainsService.createApplicationDomain({
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      applicationDomainResponse: applicationDomainResponse
    }}));

    if(applicationDomainResponse.data === undefined) throw new CliEPApiContentError(logName, 'applicationDomainResponse.data === undefined', {
      applicationDomainResponse: applicationDomainResponse
    });
    return {
      applicationDomainObject: applicationDomainResponse.data,
      apiObject: applicationDomainResponse.data,
    };
  }

  protected async updateFunc(cliGetFuncReturn: ICliApplicationDomainTask_GetFuncReturn): Promise<ICliApplicationDomainTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliApplicationDomainTask.name}.${funcName}()`;
    if(cliGetFuncReturn.applicationDomainObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.applicationDomainObject === undefined');
    
    const update: ApplicationDomain = {
      ...this.createApplicationDomainSettings(),
      name: this.getCliTaskConfig().applicationDomainName,
    }
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      document: update
    }}));

    if(cliGetFuncReturn.applicationDomainObject.id === undefined) throw new CliEPApiContentError(logName, 'cliGetFuncReturn.applicationDomainObject.id === undefined', {
      applicationDomainObject: cliGetFuncReturn.applicationDomainObject
    });
    const applicationDomainResponse: ApplicationDomainResponse = await ApplicationDomainsService.updateApplicationDomain({
      id: cliGetFuncReturn.applicationDomainObject.id,
      requestBody: update
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      applicationDomainResponse: applicationDomainResponse
    }}));

    if(applicationDomainResponse.data === undefined) throw new CliEPApiContentError(logName, 'applicationDomainResponse.data === undefined', {
      applicationDomainResponse: applicationDomainResponse
    });
    const cliApplicationDomainTask_UpdateFuncReturn: ICliApplicationDomainTask_UpdateFuncReturn = {
      apiObject: applicationDomainResponse.data,
      applicationDomainObject: applicationDomainResponse.data,
    };
    return cliApplicationDomainTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliApplicationDomainTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliApplicationDomainTask.name}.${funcName}()`;
    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');
    const cliApplicationDomainTask_ExecuteReturn: ICliApplicationDomainTask_ExecuteReturn = {
      ...cliTaskExecuteReturn,
      applicationDomainObject: cliTaskExecuteReturn.apiObject,
      apiObject: undefined
    };
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: {
      cliApplicationDomainTask_ExecuteReturn: cliApplicationDomainTask_ExecuteReturn,
    }}));
    return cliApplicationDomainTask_ExecuteReturn;
  }


}
