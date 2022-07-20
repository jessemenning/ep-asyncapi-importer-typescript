import { CliEPApiContentError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { 
  SchemasResponse,
  SchemasService,
  SchemaObject
} from '../_generated/@solace-iot-team/sep-openapi-node';

class CliEPSchemasService {

  public getByName = async({ schemaName, applicationDomainId }:{
    applicationDomainId: string;
    schemaName: string;
  }): Promise<SchemaObject | undefined> => {
    const funcName = 'getByName';
    const logName = `${CliEPSchemasService.name}.${funcName}()`;

    const schemasResponse: SchemasResponse = await SchemasService.getSchemas({
      applicationDomainId: applicationDomainId,
      name: schemaName
    })

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      schemasResponse: schemasResponse
    }}));

    if(schemasResponse.data === undefined || schemasResponse.data.length === 0) return undefined;
    if(schemasResponse.data.length > 1) throw new CliEPApiContentError(logName, 'schemasResponse.data.length > 1', {
      schemasResponse: schemasResponse
    });
    return schemasResponse.data[0];
  }

}

export default new CliEPSchemasService();

