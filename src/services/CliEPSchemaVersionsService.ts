import { CliEPApiError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { SchemasService, SchemaVersion, SchemaVersionResponse, StatesResponse, StatesService } from '../_generated/@solace-iot-team/sep-openapi-node';


/**
 * EP Asset States.
 * Hard-coded, needs to check at initialize.
 */
class CliEPSchemaVersionsService {

  public getSchemaVersions = async({ schemaId }:{
    schemaId: string;
  }): Promise<Array<SchemaVersion>> => {
    const funcName = 'getSchemaVersions';
    const logName = `${CliEPSchemaVersionsService.name}.${funcName}()`;

    const schemaVersionResponse: SchemaVersionResponse = await SchemasService.listVersions({
      schemaId: schemaId
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      schemaVersionResponse: schemaVersionResponse
    }}));

    // TODO: EP API is wrong, data is actually an Array<SchemaVersion>
    const data: Array<SchemaVersion> | undefined = schemaVersionResponse.data as Array<SchemaVersion> | undefined;
    if(data === undefined) return [];
    return data;
  }

  public getLastestSchemaVersion = async({ schemaId }:{
    schemaId: string;
  }): Promise<string> => {
    const funcName = 'getLastestSchemaVersion';
    const logName = `${CliEPSchemaVersionsService.name}.${funcName}()`;

    const schemaVersionList: Array<SchemaVersion> = await this.getSchemaVersions({ schemaId: schemaId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      schemaVersionList: schemaVersionList
    }}));

    let latest: string = '0.0.0';
    for(const schemaVersion of schemaVersionList) {
      if(schemaVersion.version === undefined) throw new CliEPApiError(logName, 'schemaVersion.version === undefined', {
        schemaVersion: schemaVersion
      });
      const newVersion: string = schemaVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latest,
      })) {
        latest = newVersion;
      }
    }
    return latest;
  }

  public getSchemaVersion = async({ schemaId, schemaVersionString }:{
    schemaId: string;
    schemaVersionString: string;
  }): Promise<SchemaVersion | undefined> => {
    const funcName = 'getSchemaVersion';
    const logName = `${CliEPSchemaVersionsService.name}.${funcName}()`;

    const schemaVersionList: Array<SchemaVersion> = await this.getSchemaVersions({ schemaId: schemaId });
    const found: SchemaVersion | undefined = schemaVersionList.find( (schemaVersion: SchemaVersion ) => {
      if(schemaVersion.version === undefined) throw new CliEPApiError(logName, 'schemaVersion.version === undefined', {
        schemaVersion: schemaVersion
      });
      return schemaVersion.version === schemaVersionString;
    });
    return found;
  }
}

export default new CliEPSchemaVersionsService();

