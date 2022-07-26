import { CliEPApiContentError, CliEPServiceError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { 
  ApplicationDomain,
  ApplicationDomainResponse,
  ApplicationDomainsResponse,
  ApplicationDomainsService,
} from '@solace-iot-team/ep-sdk/sep-openapi-node';

class CliEPApplicationDomainsService {

  public getByName = async({ applicationDomainName }:{
    applicationDomainName: string;
  }): Promise<ApplicationDomain | undefined> => {
    const funcName = 'getByName';
    const logName = `${CliEPApplicationDomainsService.name}.${funcName}()`;

    const applicationDomainsResponse: ApplicationDomainsResponse = await ApplicationDomainsService.getApplicationDomains({
      name: applicationDomainName
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      applicationDomainsResponse: applicationDomainsResponse
    }}));
    if(applicationDomainsResponse.data === undefined || applicationDomainsResponse.data.length === 0) return undefined;
    if(applicationDomainsResponse.data.length > 1) throw new CliEPApiContentError(logName, 'applicationDomainsResponse.data.length > 1', {
      applicationDomainsResponse: applicationDomainsResponse
    });
    const applicationDomain: ApplicationDomain = applicationDomainsResponse.data[0];
    return applicationDomain;  
  }

  public getById = async({ applicationDomainId }:{
    applicationDomainId: string;
  }): Promise<ApplicationDomain> => {
    const funcName = 'getById';
    const logName = `${CliEPApplicationDomainsService.name}.${funcName}()`;

    const applicationDomainResponse: ApplicationDomainResponse = await ApplicationDomainsService.getApplicationDomain({ 
      id: applicationDomainId,
    });
    if(applicationDomainResponse.data === undefined) {
      throw new CliEPServiceError(logName, "applicationDomainResponse.data === undefined", {});
    }
    const applicationDomain: ApplicationDomain = applicationDomainResponse.data;
    return applicationDomain;  
  }

  public deleteById = async({ applicationDomainId }:{
    applicationDomainId: string;
  }): Promise<ApplicationDomain> => {
    const funcName = 'deleteById';
    const logName = `${CliEPApplicationDomainsService.name}.${funcName}()`;

    const applicationDomain: ApplicationDomain = await this.getById({ applicationDomainId: applicationDomainId });

    const xvoid: void = await ApplicationDomainsService.deleteApplicationDomain({ 
      id: applicationDomainId,
    });

    return applicationDomain;

  }

  public deleteByName = async({ applicationDomainName }: {
    applicationDomainName: string;
  }): Promise<ApplicationDomain> => {
    const funcName = 'deleteByName';
    const logName = `${CliEPApplicationDomainsService.name}.${funcName}()`;
    
    const applicationDomain: ApplicationDomain | undefined = await this.getByName({ applicationDomainName: applicationDomainName });
    if(applicationDomain === undefined) throw new CliEPServiceError(logName, "applicationDomain === undefined", {});
    if(applicationDomain.id === undefined) throw new CliEPApiContentError(logName, 'applicationDomain.id === undefined', {
      applicationDomain: applicationDomain,
    });
    const applicationDomainDeleted: ApplicationDomain = await this.deleteById({ applicationDomainId: applicationDomain.id });
    return applicationDomainDeleted;
  }

}

export default new CliEPApplicationDomainsService();

