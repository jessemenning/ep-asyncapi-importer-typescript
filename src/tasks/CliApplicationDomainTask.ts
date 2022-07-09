import CliConfig from "../CliConfig";
import { CliEPApiError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn } from "../services/CliTask";
import { ApplicationDomain, ApplicationDomainResponse, ApplicationDomainsResponse, ApplicationDomainsService } from "../_generated/@solace-iot-team/sep-openapi-node";

export interface ICliApplicationDomainConfig extends ICliTaskConfig {
}
export interface ICliApplicationDomainTask_Keys extends ICliTaskKeys {
  applicationDomainName: string;
}
export interface ICliApplicationDomain_GetFuncReturn extends ICliGetFuncReturn {
  applicationDomain: ApplicationDomain | undefined;
}
export interface ICliApplicationDomain_CreateFuncReturn extends ICliCreateFuncReturn {
  applicationDomain: ApplicationDomain;
}
export interface ICliApplicationDomain_TaskExecuteReturn extends ICliTaskExecuteReturn {
  applicationDomain: ApplicationDomain;
}


export class CliApplicationDomainTask extends CliTask {

  private readonly Empty_ICliApplicationDomain_GetFuncReturn: ICliApplicationDomain_GetFuncReturn = {
    apiObject: undefined,
    applicationDomain: undefined,
    documentExists: false  
  };
  private readonly DefaultApplicationDomainParams: Partial<ApplicationDomain> = {
    topicDomainEnforcementEnabled: false,
    uniqueTopicAddressEnforcementEnabled: true,
  }
  private getApplicationDomainParams(): Partial<ApplicationDomain> {
    return {
      ...this.DefaultApplicationDomainParams,
      description: `Created by ${CliConfig.getAppDisplayName()}.`
    }
  }

  constructor(taskConfig: ICliApplicationDomainConfig) {
    super(taskConfig);
  }

  protected getTaskKeys(): ICliApplicationDomainTask_Keys {
    return {
      applicationDomainName: this.get_CliAsyncApiDocument().getApplicationDomainName()
    }
  }

  protected async getFunc(cliTaskKeys: ICliApplicationDomainTask_Keys): Promise<ICliApplicationDomain_GetFuncReturn> {
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

    if(applicationDomainsResponse.data === undefined || applicationDomainsResponse.data.length === 0) return this.Empty_ICliApplicationDomain_GetFuncReturn;

    const cliApplicationDomain_GetFuncReturn: ICliApplicationDomain_GetFuncReturn = {
      apiObject: applicationDomainsResponse.data[0],
      applicationDomain: applicationDomainsResponse.data[0],
      documentExists: true
    };
    return cliApplicationDomain_GetFuncReturn;
  };

  protected async createFunc(): Promise<ICliApplicationDomain_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliApplicationDomainTask.name}.${funcName}()`;

    const applicationDomainName = this.get_CliAsyncApiDocument().getApplicationDomainName();

    const create: ApplicationDomain = {
      ...this.getApplicationDomainParams(),
      name: applicationDomainName
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
      applicationDomain: applicationDomainResponse.data
    };

  }

  public async execute(): Promise<ICliApplicationDomain_TaskExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliApplicationDomainTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');
    const cliApplicationDomainTaskExecuteReturn: ICliApplicationDomain_TaskExecuteReturn = {
      cliTaskState: cliTaskExecuteReturn.cliTaskState,
      applicationDomain: cliTaskExecuteReturn.apiObject,
      apiObject: undefined
    };
    return cliApplicationDomainTaskExecuteReturn;
  }


}
