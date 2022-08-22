import {
  EpSdkEventApiVersionsService,
} from "@solace-labs/ep-sdk";
import { EpAsyncApiDocument, EpAsyncApiDocumentService } from "@solace-labs/ep-asyncapi";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliErrorFactory } from "../CliError";


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

}

export default new CliAsyncApiDocumentService();

