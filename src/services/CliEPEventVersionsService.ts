import { CliEPApiError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { EventsService, EventVersion, EventVersionsResponse } from '../_generated/@solace-iot-team/sep-openapi-node';


class CliEPEventVersionsService {

  public getEventVersions = async({ eventId }:{
    eventId: string;
  }): Promise<Array<EventVersion>> => {
    const funcName = 'getEventVersions';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const eventVersionResponse: EventVersionsResponse = await EventsService.list2({
      eventId: eventId,
      id: 'what-id?'
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionResponse: eventVersionResponse
    }}));

    if(eventVersionResponse.data === undefined || eventVersionResponse.data.length === 0) return [];
    return eventVersionResponse.data;
  }

  public getLastestEventVersion = async({ eventId }:{
    eventId: string;
  }): Promise<string | undefined> => {
    const funcName = 'getLastestEventVersion';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const eventVersionList: Array<EventVersion> = await this.getEventVersions({ eventId: eventId });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventVersionList: eventVersionList
    }}));
    if(eventVersionList.length === 0) return undefined;

    let latest: string = '0.0.0';
    for(const eventVersion of eventVersionList) {
      if(eventVersion.version === undefined) throw new CliEPApiError(logName, 'eventVersion.version === undefined', {
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

  public getEventVersion = async({ eventId, eventVersionString }:{
    eventId: string;
    eventVersionString: string;
  }): Promise<EventVersion | undefined> => {
    const funcName = 'getEventVersion';
    const logName = `${CliEPEventVersionsService.name}.${funcName}()`;

    const eventVersionList: Array<EventVersion> = await this.getEventVersions({ eventId: eventId });
    const found: EventVersion | undefined = eventVersionList.find( (eventVersion: EventVersion ) => {
      if(eventVersion.version === undefined) throw new CliEPApiError(logName, 'eventVersion.version === undefined', {
        eventVersion: eventVersion
      });
      return eventVersion.version === eventVersionString;
    });
    return found;
  }
}

export default new CliEPEventVersionsService();

