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

  private getLatestVersionFromList = ({ eventVersionList }:{
    eventVersionList: Array<EventVersion>;
  }): EventVersion | undefined => {
    const funcName = 'getLatestVersionFromList';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    let latestVersion: EventVersion | undefined = undefined;
    let latestVersionString: string = '0.0.0';
    for(const eventVersion of eventVersionList) {
      if(eventVersion.version === undefined) throw new CliEPApiContentError(logName, 'eventVersion.version === undefined', {
        eventVersion: eventVersion
      });
      const newVersion: string = eventVersion.version;
      if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: newVersion,
        oldVersion: latestVersionString,
      })) {
        latestVersionString = newVersion;
        latestVersion = eventVersion;
      }
    }
    return latestVersion;
  }

  public getVersionByVersion = async({ eventId, eventVersionString }:{
    eventId: string;
    eventVersionString: string;
  }): Promise<EventVersion | undefined> => {
    const funcName = 'getVersionByVersion';
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

  public getEventVersions = async({ eventId }:{
    eventId: string;
  }): Promise<Array<EventVersion>> => {
    const funcName = 'getEventVersions';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    // trick (api kaputt)
    const params: any = {
      eventId: eventId
    }
    const eventVersionsResponse: EventVersionsResponse = await EventsService.getEventVersionsForEvent({
      ...params
    });
    
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionsResponse: eventVersionsResponse,
      params: params
    }}));
    if(eventVersionsResponse.data === undefined || eventVersionsResponse.data.length === 0) return [];
    return eventVersionsResponse.data;
  }

  public getEventVersionsByName = async({ eventName, applicationDomainId }:{
    applicationDomainId: string;
    eventName: string;
  }): Promise<Array<EventVersion>> => {
    const funcName = 'getEventVersionsByName';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const event: EPEvent | undefined = await CliEPEventsService.getByName({
      applicationDomainId: applicationDomainId,
      eventName: eventName
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      event: event ? event : 'undefined',
      params: {
        eventName: eventName,
        applicationDomainId: applicationDomainId
      }
    }}));

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

    const latestEventVersion: EventVersion | undefined = this.getLatestVersionFromList({ eventVersionList: eventVersionList });
    if(latestEventVersion === undefined) return undefined;
    if(latestEventVersion.version === undefined) throw new CliEPApiContentError(logName, 'latestEventVersion.version === undefined', {
      latestEventVersion: latestEventVersion
    });
    return latestEventVersion.version;
  }

  public getLastestVersionById = async({ eventId, applicationDomainId }:{
    eventId: string;
    applicationDomainId: string;
  }): Promise<EventVersion | undefined> => {
    const funcName = 'getLastestVersionById';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    applicationDomainId;
    const eventVersionList: Array<EventVersion> = await this.getEventVersions({ eventId: eventId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionList: eventVersionList
    }}));
    const latestEventVersion: EventVersion | undefined = this.getLatestVersionFromList({ eventVersionList: eventVersionList });
    if(latestEventVersion === undefined) return undefined;
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
    const latestEventVersion: EventVersion | undefined = this.getLatestVersionFromList({ eventVersionList: eventVersionList });
    if(latestEventVersion === undefined) return undefined;
    return latestEventVersion;
  }

}

export default new CliEPEventVersionsService();

