import { CliEPApiContentError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { 
  Event as EPEvent,
  EventsResponse, 
  EventsService, 
} from '../_generated/@solace-iot-team/sep-openapi-node';

class CliEPEventsService {

  public getEventByName = async({ eventName, applicationDomainId }:{
    applicationDomainId: string;
    eventName: string;
  }): Promise<EPEvent | undefined> => {
    const funcName = 'getEventByName';
    const logName = `${CliEPEventsService.name}.${funcName}()`;

    const eventsResponse: EventsResponse = await EventsService.list1({
      applicationDomainId: applicationDomainId,
      name: eventName
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventsResponse: eventsResponse
    }}));
    if(eventsResponse.data === undefined || eventsResponse.data.length === 0) return undefined;
    if(eventsResponse.data.length > 1) throw new CliEPApiContentError(logName, 'eventsResponse.data.length > 1', {
      eventsResponse: eventsResponse
    });
    const event: EPEvent = eventsResponse.data[0];
    return event;  
  }

}

export default new CliEPEventsService();

