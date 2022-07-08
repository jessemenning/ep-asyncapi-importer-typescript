import { CliLogger, ECliStatusCodes } from './CliLogger';
import { TCliAppConfig } from './CliConfig';
import CliApiSpecsService from './services/CliApiSpecsService';
import { CliAsyncApiDocument } from './services/CliAsyncApiDocument';
import { ECliTaskState } from './services/CliTask';
import { CliApplicationDomainTask } from './tasks/CliApplicationDomainTask';
import { Message } from '@asyncapi/parser';


export class CliImporter {
  private cliAppConfig: TCliAppConfig;

  constructor(cliAppConfig: TCliAppConfig) { 
    this.cliAppConfig = cliAppConfig;
  }

  public run = async(): Promise<void> => {
    const funcName = 'run';
    const logName = `${CliImporter.name}.${funcName}()`;
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      specFile: this.cliAppConfig.asyncApiSpecFileName
    }}));

    const asyncApiDocument: CliAsyncApiDocument = await CliApiSpecsService.createFromFile({ 
      filePath: this.cliAppConfig.asyncApiSpecFileName,
      appConfig: this.cliAppConfig,
    });

    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      title: asyncApiDocument.getTitle(),
      version: asyncApiDocument.getVersion(),
      applicationDomainName: asyncApiDocument.getApplicationDomainName()
    }}));

    // use for type validation when calling async functions
    let x: void;
    
    // ensure application domain name exists
    const applicationDomainsTask = new CliApplicationDomainTask({
      cliAsyncApiDocument: asyncApiDocument,
      cliTaskState: ECliTaskState.PRESENT
    });
    x = await applicationDomainsTask.execute();

    // get all the messages
    const messageMap: Map<string, Message> = asyncApiDocument.getMessages();
    for(let [key, message] of messageMap) {
      CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        key: key,
        message: message
      }}));
    }



    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTED, details: {
      specFile: this.cliAppConfig.asyncApiSpecFileName
    }}));

  }

}

