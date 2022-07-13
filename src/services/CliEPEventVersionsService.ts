import { CliEPApiContentError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { 
  EventsResponse, 
  EventsService, 
  EventVersion, 
  EventVersionsResponse,
  Event as EPEvent,
} from '../_generated/@solace-iot-team/sep-openapi-node';
import CliEPEventsService from './CliEPEventsService';


class CliEPEventVersionsService {

  public getEventVersions = async({ eventId }:{
    eventId: string;
  }): Promise<Array<EventVersion>> => {
    const funcName = 'getEventVersions';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    // TODO: BUG_IN_EP_API
    // id is not actually required, waiting for fix

    // trick API into not having the id
    const BUG_IN_EP_API_trickParams: any = {
      eventId: eventId
    };
    const eventVersionResponse: EventVersionsResponse = await EventsService.list2({
      ...BUG_IN_EP_API_trickParams
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionResponse: eventVersionResponse
    }}));
    if(eventVersionResponse.data === undefined || eventVersionResponse.data.length === 0) return [];
    return eventVersionResponse.data;
  }

  public getEventVersionsByName = async({ eventName, applicationDomainId }:{
    applicationDomainId: string;
    eventName: string;
  }): Promise<Array<EventVersion>> => {
    const funcName = 'getEventVersionsByName';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const event: EPEvent | undefined = await CliEPEventsService.getEventByName({
      applicationDomainId: applicationDomainId,
      eventName: eventName
    });
    if(event === undefined) return [];
    if(event.id === undefined) throw new CliEPApiContentError(logName, 'event.id === undefined', {
      event: event
    });
    const eventVersionList: Array<EventVersion> = await this.getEventVersions({ eventId: event.id });
    return eventVersionList;
  }

  public getLastestEventVersionString = async({ eventId }:{
    eventId: string;
  }): Promise<string | undefined> => {
    const funcName = 'getLastestEventVersionString';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const eventVersionList: Array<EventVersion> = await this.getEventVersions({ eventId: eventId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionList: eventVersionList
    }}));
    if(eventVersionList.length === 0) return undefined;

    let latest: string = '0.0.0';
    for(const eventVersion of eventVersionList) {
      if(eventVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventVersion.version === undefined', {
        eventVersion: eventVersion
      });
      const newVersion: string = eventVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latest,
      })) {
        latest = newVersion;
      }
    }
    return latest;
  }

  public getLastestVersion = async({ eventId }:{
    eventId: string;
  }): Promise<EventVersion | undefined> => {
    const funcName = 'getLastestVersion';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const eventVersionList: Array<EventVersion> = await this.getEventVersions({ eventId: eventId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionList: eventVersionList
    }}));
    if(eventVersionList.length === 0) return undefined;

    let latestEventVersion: EventVersion | undefined = undefined;
    let latestVersion: string = '0.0.0';
    for(const eventVersion of eventVersionList) {
      if(eventVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventVersion.version === undefined', {
        eventVersion: eventVersion
      });

      const newVersion: string = eventVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latestVersion,
      })) {
        latestVersion = newVersion;
        latestEventVersion = eventVersion;
      }
    }
    return latestEventVersion;
  }

  public getLastestVersionByName = async({ eventName, applicationDomainId }:{
    applicationDomainId: string;
    eventName: string;
  }): Promise<EventVersion | undefined> => {
    const funcName = 'getLastestVersionByName';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const eventVersionList: Array<EventVersion> = await this.getEventVersionsByName({ 
      eventName: eventName, 
      applicationDomainId: applicationDomainId,
     });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionList: eventVersionList
    }}));
    if(eventVersionList.length === 0) return undefined;

    let latestEventVersion: EventVersion | undefined = undefined;
    let latestVersion: string = '0.0.0';
    for(const eventVersion of eventVersionList) {
      if(eventVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventVersion.version === undefined', {
        eventVersion: eventVersion
      });

      const newVersion: string = eventVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latestVersion,
      })) {
        latestVersion = newVersion;
        latestEventVersion = eventVersion;
      }
    }
    return latestEventVersion;
  }

  public getEventVersion = async({ eventId, eventVersionString }:{
    eventId: string;
    eventVersionString: string;
  }): Promise<EventVersion | undefined> => {
    const funcName = 'getEventVersion';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const eventVersionList: Array<EventVersion> = await this.getEventVersions({ eventId: eventId });
    const found: EventVersion | undefined = eventVersionList.find( (eventVersion: EventVersion ) => {
      if(eventVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventVersion.version === undefined', {
        eventVersion: eventVersion
      });
      return eventVersion.version === eventVersionString;
    });
    return found;
  }
}

export default new CliEPEventVersionsService();

