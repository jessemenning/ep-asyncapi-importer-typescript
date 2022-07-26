import { CliError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { 
  Enum,
  EnumsResponse,
  EnumsService,
} from '@solace-iot-team/ep-sdk/sep-openapi-node';

class CliEPEnumsService {

  public getByName = async({ enumName, applicationDomainId }:{
    enumName: string;
    applicationDomainId: string;
  }): Promise<Enum | undefined> => {
    const funcName = 'getByName';
    const logName = `${CliEPEnumsService.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      enumName: enumName,
      applicationDomainId: applicationDomainId
    }}));

    const enumsResponse: EnumsResponse = await EnumsService.getEnums({
      applicationDomainId: applicationDomainId,
      names: [enumName]
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      enumsResponse: enumsResponse
    }}));

    if(enumsResponse.data === undefined || enumsResponse.data.length === 0) return undefined;
    if(enumsResponse.data.length > 1) throw new CliError(logName, 'enumsResponse.data.length > 1');
    return enumsResponse.data[0];

  }

}

export default new CliEPEnumsService();

