import { CliEPApiContentError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { 
  EnumsService, 
  EnumVersion, 
  EnumVersionsResponse, 
} from '../_generated/@solace-iot-team/sep-openapi-node';


class CliEPEnumVersionsService {

  public getEnumVersions = async({ enumId }:{
    enumId: string;
  }): Promise<Array<EnumVersion>> => {
    const funcName = 'getEnumVersions';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    const enumVersionsResponse: EnumVersionsResponse = await EnumsService.listEnumVersions({
      enumId: enumId
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      enumVersionsResponse: enumVersionsResponse
    }}));
    if(enumVersionsResponse.data === undefined || enumVersionsResponse.data.length === 0) return [];
    return enumVersionsResponse.data;
  }

  public getLastestEnumVersionString = async({ enumId }:{
    enumId: string;
  }): Promise<string | undefined> => {
    const funcName = 'getLastestEnumVersionString';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    const enumVersionList: Array<EnumVersion> = await this.getEnumVersions({ enumId: enumId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      enumVersionList: enumVersionList
    }}));
    if(enumVersionList.length === 0) return undefined;

    let latest: string = '0.0.0';
    for(const enumVersion of enumVersionList) {
      if(enumVersion.version === undefined) throw new CliEPApiContentError(logName, 'enumVersion.version === undefined', {
        enumVersion: enumVersion
      });
      const newVersion: string = enumVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latest,
      })) {
        latest = newVersion;
      }
    }
    return latest;
  }

  public getEnumVersion = async({ enumId, enumVersionString }:{
    enumId: string;
    enumVersionString: string;
  }): Promise<EnumVersion | undefined> => {
    const funcName = 'getEnumVersion';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    const enumVersionList: Array<EnumVersion> = await this.getEnumVersions({ enumId: enumId });
    const found: EnumVersion | undefined = enumVersionList.find( (enumVersion: EnumVersion ) => {
      if(enumVersion.version === undefined) throw new CliEPApiContentError(logName, 'enumVersion.version === undefined', {
        enumVersion: enumVersion
      });
      return enumVersion.version === enumVersionString;
    });
    return found;
  }
}

export default new CliEPEnumVersionsService();

