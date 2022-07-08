import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliGetFuncReturn, ICliTaskConfig } from "../services/CliTask";
import { ApplicationDomain, ApplicationDomainResponse, ApplicationDomainsResponse, ApplicationDomainsService } from "../_generated/@solace-iot-team/ep-openapi-node";

export interface ICliApplicationDomainConfig extends ICliTaskConfig {
}
export interface ICliApplicationDomainsResponse extends ICliGetFuncReturn {
  applicationDomain: ApplicationDomain | undefined;
}

export class CliApplicationDomainsTask extends CliTask {

  private readonly EmptyResponse: ICliApplicationDomainsResponse = {
    applicationDomain: undefined,
    documentExists: false  
  };
  private readonly DefaultApplicationDomainParams: Partial<ApplicationDomain> = {
    topicDomainEnforcementEnabled: true,
    uniqueTopicAddressEnforcementEnabled: true,
  }

  constructor(taskConfig: ICliApplicationDomainConfig) {
    super(taskConfig);
  }

  protected async getFunc(): Promise<ICliApplicationDomainsResponse> {
    const funcName = 'getFunc';
    const logName = `${this.constructor.name}.${funcName}()`;

    const applicationDomainName = this.get_CliAsyncApiDocument().getApplicationDomainName();

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
      ...this.DefaultApplicationDomainParams,
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
