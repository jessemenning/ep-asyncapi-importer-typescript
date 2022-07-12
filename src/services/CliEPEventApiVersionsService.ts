import { Validator, ValidatorResult } from 'jsonschema';
import CliConfig from '../CliConfig';

import { AsyncApiSpecEPValidationError, CliEPApiError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { CliAsyncApiDocument } from '../documents/CliAsyncApiDocument';
import { 
  $eventApiVersion, 
  EventApIsService, 
  eventApiVersion as EventApiVersion, 
  EventApiVersionsResponse
} from '../_generated/@solace-iot-team/sep-openapi-node';
import CliAsyncApiDocumentsService from './CliAsyncApiDocumentsService';


class CliEPEventApiVersionsService {

  public validateTitle = ({ title }: {
    title: string;
  }): void => {
    const funcName = 'validateTitle';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;
    const schema = $eventApiVersion.properties.displayName;

    const v: Validator = new Validator();
    const validateResult: ValidatorResult = v.validate(title, schema);
    if(!validateResult.valid) throw new AsyncApiSpecEPValidationError(logName, undefined, validateResult.errors, {
      title: title
    });

  }

  public getVersions = async({ eventApiId }:{
    eventApiId: string;
  }): Promise<Array<EventApiVersion>> => {
    const funcName = 'getVersions';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    // TODO: BUG_IN_EP_API
    // id is not actually required, waiting for fix

    // trick API into not having the id
    const BUG_IN_EP_API_trickParams: any = {
      eventApiId: eventApiId
    };

    const eventApiVersionsResponse: EventApiVersionsResponse = await EventApIsService.list5({
      ...BUG_IN_EP_API_trickParams
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventApiVersionsResponse: eventApiVersionsResponse
    }}));
    if(eventApiVersionsResponse.data === undefined || eventApiVersionsResponse.data.length === 0) return [];
    return eventApiVersionsResponse.data;
  }

  public getLastestVersionString = async({ eventApiId }:{
    eventApiId: string;
  }): Promise<string | undefined> => {
    const funcName = 'getLastestVersionString';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    const eventApiVersionList: Array<EventApiVersion> = await this.getVersions({ eventApiId: eventApiId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventApiVersionList: eventApiVersionList
    }}));
    if(eventApiVersionList.length === 0) return undefined;

    let latest: string = '0.0.0';
    for(const eventApiVersion of eventApiVersionList) {
      if(eventApiVersion.version === undefined) throw new CliEPApiError(logName, 'eventApiVersion.version === undefined', {
        eventApiVersion: eventApiVersion
      });
      const newVersion: string = eventApiVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latest,
      })) {
        latest = newVersion;
      }
    }
    return latest;
  }

  public getLastestVersion = async({ eventApiId }:{
    eventApiId: string;
  }): Promise<EventApiVersion | undefined> => {
    const funcName = 'getLastestVersion';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    const eventApiVersionList: Array<EventApiVersion> = await this.getVersions({ eventApiId: eventApiId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventApiVersionList: eventApiVersionList
    }}));
    if(eventApiVersionList.length === 0) return undefined;

    let latestEventApiVersion: EventApiVersion | undefined = undefined;
    let latestVersion: string = '0.0.0';
    for(const eventApiVersion of eventApiVersionList) {
      if(eventApiVersion.version === undefined) throw new CliEPApiError(logName, 'eventApiVersion.version === undefined', {
        eventApiVersion: eventApiVersion
      });

      const newVersion: string = eventApiVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latestVersion,
      })) {
        latestVersion = newVersion;
        latestEventApiVersion = eventApiVersion;
      }
    }
    return latestEventApiVersion;
  }

  public getVersion = async({ eventApiId, versionString }:{
    eventApiId: string;
    versionString: string;
  }): Promise<EventApiVersion | undefined> => {
    const funcName = 'getVersion';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    const eventApiVersionList: Array<EventApiVersion> = await this.getVersions({ eventApiId: eventApiId });
    const found: EventApiVersion | undefined = eventApiVersionList.find( (eventApiVersion: EventApiVersion ) => {
      if(eventApiVersion.version === undefined) throw new CliEPApiError(logName, 'eventApiVersion.version === undefined', {
        eventApiVersion: eventApiVersion
      });
      return eventApiVersion.version === versionString;
    });
    return found;
  }

  public getAsyncApiDocument = async({ eventApiId, eventApiVersionId }:{
    eventApiId: string;
    eventApiVersionId: string;
  }): Promise<CliAsyncApiDocument> => {
    // const funcName = 'getAsyncApiDocument';
    // const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    const anySpec: any = await EventApIsService.generateAsyncApi({
      eventApiId: eventApiId,
      id: eventApiVersionId,
      format: 'json',
      version: '2.4.0'
    });

    const cliAsyncApiDocument: CliAsyncApiDocument = await CliAsyncApiDocumentsService.createFromAny({ 
      anySpec: anySpec,
      appConfig: CliConfig.getCliAppConfig()
    });

    return cliAsyncApiDocument;

  }
}

export default new CliEPEventApiVersionsService();

