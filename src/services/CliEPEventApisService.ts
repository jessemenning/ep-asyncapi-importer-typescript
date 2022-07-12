import { CliError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { 
  EventApi,
  EventApisResponse,
  EventApIsService,
} from '../_generated/@solace-iot-team/sep-openapi-node';

class CliEPEventApisService {

  public getEventApiByName = async({ eventApiName, applicationDomainId }:{
    eventApiName: string;
    applicationDomainId: string;
  }): Promise<EventApi | undefined> => {
    const funcName = 'getEventApiByName';
    const logName = `${CliEPEventApisService.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventApiName: eventApiName,
      applicationDomainId: applicationDomainId
    }}));

    const eventApisResponse: EventApisResponse = await EventApIsService.list4({
      applicationDomainId: applicationDomainId,
      name: eventApiName
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.SERVICE, details: {
      eventApisResponse: eventApisResponse
    }}));

    if(eventApisResponse.data === undefined || eventApisResponse.data.length === 0) return undefined;
    if(eventApisResponse.data.length > 1) throw new CliError(logName, 'eventApisResponse.data.length > 1');
    return eventApisResponse.data[0];

  }

}

export default new CliEPEventApisService();

