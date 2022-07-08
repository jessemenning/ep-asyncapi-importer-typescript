import CliConfig from "../CliConfig";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig } from "../services/CliTask";
import { ApplicationDomain, ApplicationDomainResponse, ApplicationDomainsResponse, ApplicationDomainsService } from "../_generated/@solace-iot-team/ep-openapi-node";

export interface ICliApplicationDomainConfig extends ICliTaskConfig {
}
export interface ICliApplicationDomainTask_Keys extends ICliTaskKeys {
  applicationDomainName: string;
}
export interface ICliApplicationDomainsResponse extends ICliGetFuncReturn {
  applicationDomain: ApplicationDomain | undefined;
}

export class CliApplicationDomainTask extends CliTask {

  private readonly EmptyResponse: ICliApplicationDomainsResponse = {
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

  protected async getFunc(cliTaskKeys: ICliApplicationDomainTask_Keys): Promise<ICliApplicationDomainsResponse> {
    const funcName = 'getFunc';
    const logName = `${this.constructor.name}.${funcName}()`;

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

    if(applicationDomainsResponse.data === undefined || applicationDomainsResponse.data.length === 0) return this.EmptyResponse;

    const cliApplicationDomainsResponse: ICliApplicationDomainsResponse = {
      applicationDomain: applicationDomainsResponse.data[0],
      documentExists: true
    };
    return cliApplicationDomainsResponse;
  };

  protected async createFunc(): Promise<void> {
    const funcName = 'createFunc';
    const logName = `${this.constructor.name}.${funcName}()`;

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

  }


}
