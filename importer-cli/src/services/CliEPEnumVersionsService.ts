import { CliEPApiContentError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { 
  Enum,
  EnumsService, 
  EnumVersion, 
  EnumVersionsResponse, 
} from '@solace-iot-team/ep-sdk/sep-openapi-node';
import CliEPEnumsService from './CliEPEnumsService';


class CliEPEnumVersionsService {

  private getLatestVersionFromList = ({ enumVersionList }:{
    enumVersionList: Array<EnumVersion>;
  }): EnumVersion | undefined => {
    const funcName = 'getLatestVersionFromList';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    let latestEnumVersion: EnumVersion | undefined = undefined;
    let latestVersion: string = '0.0.0';
    for(const enumVersion of enumVersionList) {
      if(enumVersion.version === undefined) throw new CliEPApiContentError(logName, 'enumVersion.version === undefined', {
        enumVersion: enumVersion
      });
      const newVersion: string = enumVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latestVersion,
      })) {
        latestVersion = newVersion;
        latestEnumVersion = enumVersion;
      }
    }
    return latestEnumVersion;
  }

  public getVersionByVersion = async({ enumId, enumVersionString }:{
    enumId: string;
    enumVersionString: string;
  }): Promise<EnumVersion | undefined> => {
    const funcName = 'getVersionByVersion';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    const enumVersionsResponse: EnumVersionsResponse = await EnumsService.getEnumVersionsForEnum({
      enumId: enumId,
      versions: [enumVersionString]
    });
    if(enumVersionsResponse.data === undefined || enumVersionsResponse.data.length === 0) return undefined;
    if(enumVersionsResponse.data.length > 1) throw new CliEPApiContentError(logName, 'enumVersionsResponse.data.length > 1', {
      enumVersionsResponse: enumVersionsResponse
    });
    return enumVersionsResponse.data[0];
  }

  public getVersionsById = async({ enumId }:{
    enumId: string;
  }): Promise<Array<EnumVersion>> => {
    const funcName = 'getVersionsById';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    // wrong call
    // const enumVersionsResponse: EnumVersionsResponse = await EnumsService.getEnumVersions({
    //   ids: [enumId]
    // });
    const enumVersionsResponse: EnumVersionsResponse = await EnumsService.getEnumVersionsForEnum({
      enumId: enumId,      
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      enumVersionsResponse: enumVersionsResponse
    }}));
    if(enumVersionsResponse.data === undefined || enumVersionsResponse.data.length === 0) return [];
    return enumVersionsResponse.data;
  }

  public getLastestVersionString = async({ enumId }:{
    enumId: string;
  }): Promise<string | undefined> => {
    const funcName = 'getLastestVersionString';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    const enumVersionList: Array<EnumVersion> = await this.getVersionsById({ enumId: enumId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      enumVersionList: enumVersionList
    }}));
    const latestEnumVersion: EnumVersion | undefined = this.getLatestVersionFromList({ enumVersionList: enumVersionList });
    if(latestEnumVersion === undefined) return undefined;
    if(latestEnumVersion.version === undefined) throw new CliEPApiContentError(logName, 'latestEnumVersion.version === undefined', {
      latestEnumVersion: latestEnumVersion
    });
    return latestEnumVersion.version;
  }

  public getVersionsByName = async({ enumName, applicationDomainId }:{
    applicationDomainId: string;
    enumName: string;
  }): Promise<Array<EnumVersion>> => {
    const funcName = 'getVersionsByName';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    const enumObject: Enum | undefined = await CliEPEnumsService.getByName({
      applicationDomainId: applicationDomainId,
      enumName: enumName
    });
    if(enumObject === undefined) return [];
    if(enumObject.id === undefined) throw new CliEPApiContentError(logName, 'enumObject.id === undefined', {
      enumObject: enumObject
    });
    const enumVersionList: Array<EnumVersion> = await this.getVersionsById({ enumId: enumObject.id });
    return enumVersionList;
  }

  public getLatestVersionById = async({ enumId, applicationDomainId }: {
    applicationDomainId: string;
    enumId: string;
  }): Promise<EnumVersion | undefined> => {
    const funcName = 'getLatestVersionById';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    applicationDomainId;
    const enumVersionList: Array<EnumVersion> = await this.getVersionsById({ 
      enumId: enumId,
    });

    const latestEnumVersion: EnumVersion | undefined = this.getLatestVersionFromList({ enumVersionList: enumVersionList });
    return latestEnumVersion;
  }

  public getLastestVersionByName = async({ applicationDomainId, enumName }:{
    applicationDomainId: string;
    enumName: string;
  }): Promise<EnumVersion | undefined> => {
    const funcName = 'getLastestVersionByName';
    const logName = `${CliEPEnumVersionsService.name}.${funcName}()`;

    const enumVersionList: Array<EnumVersion> = await this.getVersionsByName({ 
      enumName: enumName, 
      applicationDomainId: applicationDomainId 
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      enumVersionList: enumVersionList
    }}));

    const latestEnumVersion: EnumVersion | undefined = this.getLatestVersionFromList({ enumVersionList: enumVersionList });
    return latestEnumVersion;

  }
}

export default new CliEPEnumVersionsService();

