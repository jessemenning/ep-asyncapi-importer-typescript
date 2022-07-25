import { Validator, ValidatorResult } from 'jsonschema';
import CliConfig from '../CliConfig';

import { CliAsyncApiSpecEPValidationError, CliEPApiContentError, CliImporterError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { CliAsyncApiDocument, CliChannelDocumentMap } from '../documents/CliAsyncApiDocument';
import { CliChannelPublishOperation, CliChannelSubscribeOperation } from '../documents/CliChannelDocument';
import { CliMessageDocument } from '../documents/CliMessageDocument';
import { 
  $eventApiVersion, 
  EventApIsService, 
  eventApiVersion as EventApiVersion, 
  EventApiVersionResponse, 
  EventApiVersionsResponse,
  EventVersion,
} from '../_generated/@solace-iot-team/sep-openapi-node';
import CliAsyncApiDocumentsService from './CliAsyncApiDocumentsService';
import CliEPEventVersionsService from './CliEPEventVersionsService';


class CliEPEventApiVersionsService {

  public validateTitle = ({ title }: {
    title: string;
  }): void => {
    const funcName = 'validateTitle';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;
    const schema = $eventApiVersion.properties.displayName;

    const v: Validator = new Validator();
    const validateResult: ValidatorResult = v.validate(title, schema);
    if(!validateResult.valid) throw new CliAsyncApiSpecEPValidationError(logName, undefined, validateResult.errors, {
      title: title
    });
  }

  private getLatestVersionFromList = ({ eventApiVersionList }:{
    eventApiVersionList: Array<EventApiVersion>;
  }): EventApiVersion | undefined => {
    const funcName = 'getLatestVersionFromList';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    let latestVersion: EventApiVersion | undefined = undefined;
    let latestVersionString: string = '0.0.0';
    for(const eventApiVersion of eventApiVersionList) {
      if(eventApiVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventApiVersion.version === undefined', {
        eventApiVersion: eventApiVersion
      });
      const newVersion: string = eventApiVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latestVersionString,
      })) {
        latestVersionString = newVersion;
        latestVersion = eventApiVersion;
      }
    }
    return latestVersion;
  }

  public getVersions = async({ eventApiId }:{
    eventApiId: string;
  }): Promise<Array<EventApiVersion>> => {
    const funcName = 'getVersions';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    // trick (api kaputt)
    const params: any = {
      eventApiId: eventApiId
    }
    const eventApiVersionsResponse: EventApiVersionsResponse = await EventApIsService.getEventApiVersionsForEventApi({
      ...params
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventApiVersionsResponse: eventApiVersionsResponse,
      params: params
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
    const latestEventApiVersion: EventApiVersion | undefined = this.getLatestVersionFromList({ eventApiVersionList: eventApiVersionList });
    if(latestEventApiVersion === undefined) return undefined;
    if(latestEventApiVersion.version === undefined) throw new CliEPApiContentError(logName, 'latestEventApiVersion.version === undefined', {
      latestEventApiVersion: latestEventApiVersion
    });
    return latestEventApiVersion.version;
  }

  public getLastestVersionById = async({ eventApiId }:{
    eventApiId: string;
  }): Promise<EventApiVersion | undefined> => {
    const funcName = 'getLastestVersionById';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    const eventApiVersionList: Array<EventApiVersion> = await this.getVersions({ eventApiId: eventApiId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventApiVersionList: eventApiVersionList
    }}));
    const latestEventApiVersion: EventApiVersion | undefined = this.getLatestVersionFromList({ eventApiVersionList: eventApiVersionList });
    if(latestEventApiVersion === undefined) return undefined;
    return latestEventApiVersion;
  }

  public getVersionByVersion = async({ eventApiId, versionString }:{
    eventApiId: string;
    versionString: string;
  }): Promise<EventApiVersion | undefined> => {
    const funcName = 'getVersionByVersion';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    const eventApiVersionList: Array<EventApiVersion> = await this.getVersions({ eventApiId: eventApiId });
    const found: EventApiVersion | undefined = eventApiVersionList.find( (eventApiVersion: EventApiVersion ) => {
      if(eventApiVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventApiVersion.version === undefined', {
        eventApiVersion: eventApiVersion
      });
      return eventApiVersion.version === versionString;
    });
    return found;
  }

  public getAsyncApiDocument = async({ eventApiId, eventApiVersionId, asyncApiSpecVersion }:{
    eventApiId: string;
    eventApiVersionId: string;
    asyncApiSpecVersion: string;
  }): Promise<CliAsyncApiDocument> => {
    // const funcName = 'getAsyncApiDocument';
    // const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    eventApiId;
    const anySpec: any = await EventApIsService.getAsyncApiForEventApiVersion({
      eventApiVersionId: eventApiVersionId,
      format: 'json',
      version: asyncApiSpecVersion
    });

    const cliAsyncApiDocument: CliAsyncApiDocument = await CliAsyncApiDocumentsService.createFromAny({ 
      anySpec: anySpec,
      appConfig: CliConfig.getCliAppConfig()
    });
    return cliAsyncApiDocument;
  }

  public createNewEventApiVersion = async({ applicationDomainId, eventApiId, cliAsyncApiDocument, stateId }:{
    applicationDomainId: string;
    eventApiId: string;
    stateId: string;
    cliAsyncApiDocument: CliAsyncApiDocument;
  }): Promise<EventApiVersion> => {
    const funcName = 'createNewEventApiVersion';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    applicationDomainId;
    const newVersionString: string = cliAsyncApiDocument.getVersion();
    const latestExistingVersionString: string | undefined = await this.getLastestVersionString({ eventApiId: eventApiId });
    if(latestExistingVersionString !== undefined) {
      // ensure new Version is greater
      if(!CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({ newVersion: newVersionString, oldVersion: latestExistingVersionString })) {
        throw new CliImporterError(logName, 'new version is not greater than existing version', {
          title: cliAsyncApiDocument.getTitle(),
          newVersion: newVersionString,
          latestExistingVersion: latestExistingVersionString,
        });
      }
    }
    // collect all publish event version Ids
    const publishEventVersionIds: Array<string> = [];
    const subscribeEventVersionIds: Array<string> = [];
    const cliChannelDocumentMap: CliChannelDocumentMap = cliAsyncApiDocument.getChannelDocuments();
    for(let [topic, cliChannelDocument] of cliChannelDocumentMap) {
      // collect all publish event version Ids
      const cliChannelPublishOperation: CliChannelPublishOperation | undefined = cliChannelDocument.getChannelPublishOperation();
      if(cliChannelPublishOperation !== undefined) {
        const cliMessageDocument: CliMessageDocument = cliChannelPublishOperation.getCliMessageDocument();
        const eventName: string = cliMessageDocument.getMessageName();
        const eventVersion: EventVersion | undefined = await CliEPEventVersionsService.getLastestVersionByName({
          applicationDomainId: applicationDomainId,
          eventName: eventName
        });
        if(eventVersion === undefined) throw new CliImporterError(logName, 'expecting the an eventVersion to exists', {
          applicationDomainId: applicationDomainId,
          eventName: eventName
        });
        if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
          eventVersion: eventVersion,
        });
        publishEventVersionIds.push(eventVersion.id);
      }
      //  collect all subscribe event version Ids
      const cliChannelSubscribeOperation: CliChannelSubscribeOperation | undefined = cliChannelDocument.getChannelSubscribeOperation();
      if(cliChannelSubscribeOperation !== undefined) {
        const cliMessageDocument: CliMessageDocument = cliChannelSubscribeOperation.getCliMessageDocument();
        const eventName: string = cliMessageDocument.getMessageName();
        const eventVersion: EventVersion | undefined = await CliEPEventVersionsService.getLastestVersionByName({
          applicationDomainId: applicationDomainId,
          eventName: eventName
        });
        if(eventVersion === undefined) throw new CliImporterError(logName, 'expecting the an eventVersion to exists', {
          applicationDomainId: applicationDomainId,
          eventName: eventName
        });
        if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
          eventVersion: eventVersion,
        });
        subscribeEventVersionIds.push(eventVersion.id);
      }
    }
    // create the version object
    const create: EventApiVersion = {
      description: cliAsyncApiDocument.getDescription(),
      version: cliAsyncApiDocument.getVersion(),
      displayName: cliAsyncApiDocument.getTitle(),
      stateId: stateId,
      producedEventVersionIds: (publishEventVersionIds as unknown) as EventApiVersion.producedEventVersionIds,
      consumedEventVersionIds: (subscribeEventVersionIds as unknown) as EventApiVersion.consumedEventVersionIds,
      // producedEventVersionIds: publishEventVersionIds,
      // consumedEventVersionIds: subscribeEventVersionIds
    }
    const eventApiVersionResponse: EventApiVersionResponse = await EventApIsService.createEventApiVersionForEventApi({
      eventApiId: eventApiId,
      requestBody: create
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE_CREATE, details: {
      eventApiVersionResponse: eventApiVersionResponse
    }}));

    if(eventApiVersionResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventApiVersionResponse.data === undefined', {
      eventApiVersionResponse: eventApiVersionResponse
    });

    const created: EventApiVersion = eventApiVersionResponse.data;
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE_CREATE, details: {
      created: created
    }}));
    return created;
  }
}

export default new CliEPEventApiVersionsService();

