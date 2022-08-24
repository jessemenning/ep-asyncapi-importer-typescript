
import { EpAsyncApiDocument } from '@solace-labs/ep-asyncapi';
import { CliImporterFeatureNotSupportedError } from './CliError';
import { 
  CliEventApiImporter, 
  ICliEventApiImporterOptions, 
  ICliEventApiImporterRunPresentReturn, 
  ICliEventApiImporterRunReturn 
} from './CliEventApiImporter';
import { CliLogger, ECliStatusCodes } from './CliLogger';

export interface ICliApplicationImporterOptions extends ICliEventApiImporterOptions {
}

export interface ICliApplicationImporterRunReturn extends ICliEventApiImporterRunReturn {
}
export interface ICliApplicationImporterRunPresentReturn extends ICliEventApiImporterRunPresentReturn {
}

export class CliApplicationImporter extends CliEventApiImporter {

  constructor(cliEventApiImporterOptions: ICliEventApiImporterOptions) { 
    super(cliEventApiImporterOptions);
  }

  private run_present_application = async({ applicationDomainId, epAsyncApiDocument, checkmode }:{
    applicationDomainId: string;
    epAsyncApiDocument: EpAsyncApiDocument;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_application';
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    const applicationName: string = epAsyncApiDocument.getTitle();
    applicationDomainId;
    checkmode;

    CliLogger.fatal(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR_APPLICATION, details: {
      cause: "not implemented"
    }}));
    throw new CliImporterFeatureNotSupportedError(logName, undefined, {
      feature: 'create application'
    });

  }

  protected async run_present({ epAsyncApiDocument, checkmode }:{
    epAsyncApiDocument: EpAsyncApiDocument;
    checkmode: boolean;
  }): Promise<ICliEventApiImporterRunPresentReturn> {
    const funcName = 'run_present';
    const logName = `${CliApplicationImporter.name}.${funcName}()`;

    let xvoid: void;

    const cliEventApiImporterRunPresentReturn: ICliEventApiImporterRunPresentReturn = await super.run_present({ 
      epAsyncApiDocument: epAsyncApiDocument,
      checkmode: checkmode
    });

    // present application
    xvoid = await this.run_present_application({
      applicationDomainId: cliEventApiImporterRunPresentReturn.applicationDomainId,
      epAsyncApiDocument: epAsyncApiDocument,
      checkmode: checkmode
    }); 

        // // generate the output for all assets
    // this.generate_asset_ouput({
    //   epAsyncApiDocument: epAsyncApiDocument,
    //   filePath: this.cliAppConfig.asyncApiFileName,
    //   appConfig: this.cliAppConfig,
    // });

    return cliEventApiImporterRunPresentReturn;
  }

  /**
   * Placeholder for future extension.
   */
  public async run({ apiFile, applicationDomainName, applicationDomainNamePrefix, checkmode }:{
    apiFile: string;
    applicationDomainName: string | undefined;
    applicationDomainNamePrefix: string | undefined;
    checkmode: boolean;
  }): Promise<ICliEventApiImporterRunReturn> {
    const funcName = 'run';
    const logName = `${CliApplicationImporter.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_APPLICATION, details: {
      applicationDomainName: applicationDomainName,
      applicationDomainNamePrefix: applicationDomainNamePrefix,
      checkmode: checkmode  
    }}));

    const cliEventApiImporterRunReturn: ICliEventApiImporterRunReturn = await super.run({ 
      apiFile: apiFile,
      applicationDomainName: applicationDomainName,
      applicationDomainNamePrefix: applicationDomainNamePrefix,
      checkmode: checkmode,
    });

    if(cliEventApiImporterRunReturn.error === undefined) CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_APPLICATION, details: {}}));

    return cliEventApiImporterRunReturn;

  }

}

