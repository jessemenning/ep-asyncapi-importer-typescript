import {
  EpSdkEpEventVersionsService,
  EpSdkEventApiVersionsService,
} from "@solace-labs/ep-sdk";
import { EpAsyncApiDocument, EpAsyncApiDocumentService, T_EpAsyncApiEventNames } from "@solace-labs/ep-asyncapi";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliEPApiContentError, CliErrorFactory, CliImporterError } from "../CliError";
import { EventVersion } from "@solace-labs/ep-openapi-node";


export interface ICliPubSubEventVersionIds {
  publishEventVersionIdList: Array<string>;
  subscribeEventVersionIdList: Array<string>;
}

class CliAsyncApiDocumentService {

  public parse_and_validate = async({ apiFile, applicationDomainName, applicationDomainNamePrefix }:{
    apiFile: string;
    applicationDomainName: string | undefined;
    applicationDomainNamePrefix: string | undefined;
  }): Promise<EpAsyncApiDocument> => {
    const funcName = 'parse_and_validate';
    const logName = `${CliAsyncApiDocumentService.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_VALIDATING_API, details: {
      apiFile: apiFile
    }}));

    try {
      // parse spec
      const epAsyncApiDocument: EpAsyncApiDocument = await EpAsyncApiDocumentService.createFromFile({ 
        filePath: apiFile,
        overrideEpApplicationDomainName: applicationDomainName,
        prefixEpApplicationDomainName: applicationDomainNamePrefix
      });

      EpAsyncApiDocumentService.validate_BestPractices({ epAsyncApiDocument: epAsyncApiDocument });

      EpSdkEventApiVersionsService.validateDisplayName({ displayName: epAsyncApiDocument.getTitle() });

      CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_VALIDATING_API, details: {
        title: epAsyncApiDocument.getTitle(),
        version: epAsyncApiDocument.getVersion(),
        applicationDomainName: epAsyncApiDocument.getApplicationDomainName()
      }}));
      return epAsyncApiDocument;
    } catch(e: any) {
      const cliError = CliErrorFactory.createCliError({
        logName: logName,
        e: e
      });
      CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR_VALIDATING_API, details: {
        error: cliError
      }}));  
      throw cliError;
    }
  }

  public get_pub_sub_event_version_ids = async({ applicationDomainId, epAsyncApiDocument }:{
    applicationDomainId: string;
    epAsyncApiDocument: EpAsyncApiDocument;
  }): Promise<ICliPubSubEventVersionIds> => {
    const funcName = 'get_pub_sub_event_version_ids';
    const logName = `${CliAsyncApiDocumentService.name}.${funcName}()`;

    const epAsyncApiEventNames: T_EpAsyncApiEventNames = epAsyncApiDocument.getEpAsyncApiEventNames();
    const publishEventVersionIdList: Array<string> = [];    
    for(const publishEventName of epAsyncApiEventNames.publishEventNames) {
      const eventVersion: EventVersion | undefined = await EpSdkEpEventVersionsService.getLatestVersionForEventName({
        eventName: publishEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {
        eventName: publishEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      publishEventVersionIdList.push(eventVersion.id,);
    }
    const subscribeEventVersionIdList: Array<string> = [];
    for(const subscribeEventName of epAsyncApiEventNames.subscribeEventNames) {
      const eventVersion: EventVersion | undefined = await EpSdkEpEventVersionsService.getLatestVersionForEventName({
        eventName: subscribeEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {
        eventName: subscribeEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      subscribeEventVersionIdList.push(eventVersion.id);
    }
    return {
      publishEventVersionIdList: publishEventVersionIdList,
      subscribeEventVersionIdList: subscribeEventVersionIdList,
    };
  }


}

export default new CliAsyncApiDocumentService();

