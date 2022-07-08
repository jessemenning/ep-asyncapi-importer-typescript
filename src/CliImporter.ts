import { CliLogger, ECliStatusCodes } from './CliLogger';
import { TCliAppConfig } from './CliConfig';
import CliApiSpecsService from './services/CliApiSpecsService';
import { CliAsyncApiDocument } from './services/CliAsyncApiDocument';
import { CliTask, ECliTaskState } from './services/CliTask';
import { CliApplicationDomainsTask } from './tasks/CliApplicationDomainsTask';


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
    const applicationDomainsTask = new CliApplicationDomainsTask({
      cliAsyncApiDocument: asyncApiDocument,
      cliTaskState: ECliTaskState.PRESENT
    });
    x = await applicationDomainsTask.execute();



    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTED, details: {
      specFile: this.cliAppConfig.asyncApiSpecFileName
    }}));

  }

}

