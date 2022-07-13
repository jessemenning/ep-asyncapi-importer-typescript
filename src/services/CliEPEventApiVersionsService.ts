import { Validator, ValidatorResult } from 'jsonschema';
import CliConfig from '../CliConfig';

import { AsyncApiSpecEPValidationError, CliEPApiContentError, CliError, CliImporterError } from '../CliError';
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
  EventVersion
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
      if(eventApiVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventApiVersion.version === undefined', {
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
      if(eventApiVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventApiVersion.version === undefined', {
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

    const anySpec: any = await EventApIsService.generateAsyncApi({
      eventApiId: eventApiId,
      id: eventApiVersionId,
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
    const funcName = 'createNewVersion';
    const logName = `${CliEPEventApiVersionsService.name}.${funcName}()`;

    applicationDomainId;
    const newVersion: string = cliAsyncApiDocument.getVersion();
    const latestExistingVersion: string | undefined = await this.getLastestVersionString({ eventApiId: eventApiId });
    if(latestExistingVersion !== undefined) {
      // ensure new Version is greater
      if(!CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({ newVersion: newVersion, oldVersion: latestExistingVersion })) {
        throw new CliImporterError(logName, 'new version is not greater than existing version', {
          title: cliAsyncApiDocument.getTitle(),
          newVersion: newVersion,
          latestExistingVersion: latestExistingVersion,
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
        const eventName: string = cliMessageDocument.getDisplayName();
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
        const eventName: string = cliMessageDocument.getDisplayName();
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
    throw new Error(`${logName}: continue here once EP API is complete`);
    stateId;
    // // create the version object
    // const create: EventApiVersion = {
    //   description: cliAsyncApiDocument.getDescription(),
    //   version: cliAsyncApiDocument.getVersion(),
    //   displayName: cliAsyncApiDocument.getTitle(),
    //   stateId: stateId,
    //   // TODO: wait for API
    //   // producedEventVersionIds: publishEventVersionIds,
    //   // consumedEventVersionIds: subscribeEventVersionIds,
    // }
    // const eventApiVersionResponse: EventApiVersionResponse = await EventApIsService.create5({
    //   eventApiId: eventApiId,
    //   requestBody: create
    // });
    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE_CREATE, details: {
    //   eventApiVersionResponse: eventApiVersionResponse
    // }}));

    // if(eventApiVersionResponse.data === undefined) throw new CliEPApiContentError(logName, 'eventApiVersionResponse.data === undefined', {
    //   eventApiVersionResponse: eventApiVersionResponse
    // });

    // const created: EventApiVersion = eventApiVersionResponse.data;
    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE_CREATE, details: {
    //   created: created
    // }}));
    // return created;
  }
}

export default new CliEPEventApiVersionsService();

