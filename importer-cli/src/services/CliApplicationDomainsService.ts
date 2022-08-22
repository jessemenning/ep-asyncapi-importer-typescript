import {
  EpSdkApplicationDomainsService,
} from "@solace-labs/ep-sdk";
import { ApplicationDomain } from '@solace-labs/ep-openapi-node';


class CliApplicationDomainsService {

  public absent_ApplicationDomains = async({ applicationDomainNameList }:{
    applicationDomainNameList: Array<string>;
  }): Promise<void> => {
    const funcName = 'absent_ApplicationDomains';
    const logName = `${CliApplicationDomainsService.name}.${funcName}()`;
  
    for(const applicationDomainName of applicationDomainNameList) {
      try {
        const applicationDomain: ApplicationDomain = await EpSdkApplicationDomainsService.deleteByName( { 
          applicationDomainName: applicationDomainName
        });
        // CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, message: 'application domain deleted', details: {
        //   importerMode: CliConfig.getCliAppConfig().importerMode,
        //   applicationDomain: applicationDomain
        // }}));
      } catch(e) {
        // may already have been deleted, do nothing
      }
    }
  }

}

export default new CliApplicationDomainsService();

