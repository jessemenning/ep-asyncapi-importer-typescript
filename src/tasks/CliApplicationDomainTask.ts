import CliConfig from "../CliConfig";
import { CliEPApiError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn } from "./CliTask";
import { ApplicationDomain, ApplicationDomainResponse, ApplicationDomainsResponse, ApplicationDomainsService } from "../_generated/@solace-iot-team/sep-openapi-node";
import isEqual from "lodash.isequal";

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
      params: {
        name: applicationDomainName
      }
    }}));

    const applicationDomainsResponse: ApplicationDomainsResponse = await ApplicationDomainsService.list9({
      name: applicationDomainName
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      applicationDomainsResponse: applicationDomainsResponse
    }}));

    if(applicationDomainsResponse.data === undefined || applicationDomainsResponse.data.length === 0) return this.Empty_ICliApplicationDomainTask_GetFuncReturn;

    const cliApplicationDomainTask_GetFuncReturn: ICliApplicationDomainTask_GetFuncReturn = {
      apiObject: applicationDomainsResponse.data[0],
      applicationDomainObject: applicationDomainsResponse.data[0],
      documentExists: true
    };
    return cliApplicationDomainTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliApplicationDomainTask_GetFuncReturn; 
  }): boolean {
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
    isUpdateRequired = !isEqual(existingCompareObject, requestedCompareObject);
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      existingCompareObject: existingCompareObject,
      requestedCompareObject: requestedCompareObject,
      isUpdateRequired: isUpdateRequired
    }}));
    return isUpdateRequired;
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

    const applicationDomainResponse: ApplicationDomainResponse = await ApplicationDomainsService.create9({
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      applicationDomainResponse: applicationDomainResponse
    }}));

    if(applicationDomainResponse.data === undefined) throw new CliEPApiError(logName, 'applicationDomainResponse.data === undefined', {
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

    if(cliGetFuncReturn.applicationDomainObject.id === undefined) throw new CliEPApiError(logName, 'cliGetFuncReturn.applicationDomainObject.id === undefined', {
      applicationDomainObject: cliGetFuncReturn.applicationDomainObject
    });
    const applicationDomainResponse: ApplicationDomainResponse = await ApplicationDomainsService.update8({
      id: cliGetFuncReturn.applicationDomainObject.id,
      requestBody: update
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      applicationDomainResponse: applicationDomainResponse
    }}));

    if(applicationDomainResponse.data === undefined) throw new CliEPApiError(logName, 'applicationDomainResponse.data === undefined', {
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
      cliTaskState: cliTaskExecuteReturn.cliTaskState,
      applicationDomainObject: cliTaskExecuteReturn.apiObject,
      apiObject: undefined
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: {
      cliApplicationDomainTask_ExecuteReturn: cliApplicationDomainTask_ExecuteReturn,
    }}));
    return cliApplicationDomainTask_ExecuteReturn;
  }


}
