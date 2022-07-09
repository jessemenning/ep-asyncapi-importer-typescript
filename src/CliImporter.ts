import { CliLogger, ECliStatusCodes } from './CliLogger';
import { ECliAssetsTargetState, TCliAppConfig } from './CliConfig';
import { CliAsyncApiDocument, ICliMessage } from './services/CliAsyncApiDocument';
import { ECliTaskState, ICliTaskExecuteReturn } from './services/CliTask';
import { CliApplicationDomainTask, ICliApplicationDomain_TaskExecuteReturn } from './tasks/CliApplicationDomainTask';
import { Message } from '@asyncapi/parser';
import CliEPStatesService from './services/CliEPStatesService';
import { CliUtils } from './CliUtils';
import { CliEPApiError, CliError, CliErrorFromError } from './CliError';
import { CliSchemaTask, ESchemaType, ICliSchemaTask_ExecuteReturn } from './tasks/CliSchemaTask';


export class CliImporter {
  private cliAppConfig: TCliAppConfig;

  constructor(cliAppConfig: TCliAppConfig) { 
    this.cliAppConfig = cliAppConfig;
  }

  private run_present = async(): Promise<void> => {
    const funcName = 'run_present';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      specFile: this.cliAppConfig.asyncApiSpecFileName,
      targetState: this.cliAppConfig.assetsTargetState,
    }}));

    // parse & validate spec
    const asyncApiDocument: CliAsyncApiDocument = await CliAsyncApiDocument.createFromFile({ 
      filePath: this.cliAppConfig.asyncApiSpecFileName,
      appConfig: this.cliAppConfig,
    });
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      title: asyncApiDocument.getTitle(),
      version: asyncApiDocument.getVersion(),
      applicationDomainName: asyncApiDocument.getApplicationDomainName()
    }}));

    // use for type validation when calling async functions
    let xvoid: void;
    
    // ensure application domain name exists
    const applicationDomainsTask = new CliApplicationDomainTask({
      cliAsyncApiDocument: asyncApiDocument,
      cliTaskState: ECliTaskState.PRESENT
    });

    // need the application domain Id back
    const cliApplicationDomainTaskExecuteReturn: ICliApplicationDomain_TaskExecuteReturn = await applicationDomainsTask.execute();
    // we need the id in subsequent calls
    if(cliApplicationDomainTaskExecuteReturn.applicationDomain.id === undefined) throw new CliEPApiError(logName, 'cliApplicationDomainTaskExecuteReturn.applicationDomain.id === undefined', {
      applicationDomain: cliApplicationDomainTaskExecuteReturn.applicationDomain      
    });
    const applicationDomainId: string = cliApplicationDomainTaskExecuteReturn.applicationDomain.id;

    // present all the messages
    const messageMap: Map<string, ICliMessage> = asyncApiDocument.getMessages();
    for(let [key, message] of messageMap) {
      CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        key: key,
        message: message
      }}));
      const messageName: string = message.asyncApiMessage.name();
      const messageTitle: string = message.asyncApiMessage.title();
      const contentType: string = message.asyncApiMessage.contentType();

      // ensure the schema exists
      const cliSchemaTask = new CliSchemaTask({
        cliAsyncApiDocument: asyncApiDocument,
        cliTaskState: ECliTaskState.PRESENT,
        schemaObject: {
          applicationDomainId: applicationDomainId,
          name: messageName,
          contentType: contentType,
          schemaType: ESchemaType.JSON_SCHEMA,
          shared: true
        }
      });
      const cliSchemaTask_ExecuteReturn: ICliSchemaTask_ExecuteReturn = await cliSchemaTask.execute();
      CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        cliSchemaTask_ExecuteReturn: cliSchemaTask_ExecuteReturn
      }}));
      if(cliSchemaTask_ExecuteReturn.schemaObject.id === undefined) throw new CliEPApiError(logName, 'cliSchemaTask_ExecuteReturn.schemaObject.id === undefined', {
        schemaObject: cliSchemaTask_ExecuteReturn.schemaObject
      });
      const schemaId: string = cliSchemaTask_ExecuteReturn.schemaObject.id;
      const numberOfVersions: number = cliSchemaTask_ExecuteReturn.schemaObject.numberOfVersions ? cliSchemaTask_ExecuteReturn.schemaObject.numberOfVersions : 0;      
      // if any versions: get the latest version number and bump it
      // else new version number = spec version number
      // create a new version
      // config: asset version bump strategy (minor, patch) & imported asset state = released, draft

      throw new Error(`${logName}: check the first schema`);

    }

    throw new Error(`${logName}: get all the messages and create schemas for them`);

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTED, details: {
      specFile: this.cliAppConfig.asyncApiSpecFileName,
      targetState: this.cliAppConfig.assetsTargetState,
    }}));

  }

  private run_absent = async(): Promise<void> => {
    const funcName = 'run_absent';
    const logName = `${CliImporter.name}.${funcName}()`;
    throw new Error(`${logName}: implement me.`);
  }

  public run = async(): Promise<void> => {
    const funcName = 'run';
    const logName = `${CliImporter.name}.${funcName}()`;
    
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      specFile: this.cliAppConfig.asyncApiSpecFileName,
      targetState: this.cliAppConfig.assetsTargetState,
    }}));

    try {

      let xvoid: void;
      // get the state dtos as reference
      xvoid = await CliEPStatesService.initialize();

      // run the respective pipeline
      switch(this.cliAppConfig.assetsTargetState) {
        case ECliAssetsTargetState.PRESENT:
          xvoid = await this.run_present();
          break;
        case ECliAssetsTargetState.ABSENT:
          xvoid = await this.run_absent();
          break;
        default:
          CliUtils.assertNever(logName, this.cliAppConfig.assetsTargetState);
      }

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTED, details: {
        specFile: this.cliAppConfig.asyncApiSpecFileName,
        targetState: this.cliAppConfig.assetsTargetState,
      }}));

    } catch(e: any) {
      if(e instanceof CliError) {
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
          error: e
        }}));  
      } else {
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
          error: new CliErrorFromError(e, logName)
        }}));  
      }
      throw e;
    }
  }

}

