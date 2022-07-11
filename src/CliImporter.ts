import { CliLogger, ECliStatusCodes } from './CliLogger';
import CliConfig, { ECliAssetImportTargetLifecycleState_VersionStrategy, ECliAssetsTargetState, TCliAppConfig } from './CliConfig';
import { CliAsyncApiDocument, CliChannelDocumentMap, CliMessageDocumentMap } from './documents/CliAsyncApiDocument';
import { ECliTaskState } from './tasks/CliTask';
import { CliApplicationDomainTask, ICliApplicationDomainTask_ExecuteReturn } from './tasks/CliApplicationDomainTask';
import CliEPStatesService from './services/CliEPStatesService';
import { CliUtils } from './CliUtils';
import { CliEPApiError, CliError, CliErrorFromError } from './CliError';
import { CliSchemaTask, EPSchemaType, ICliSchemaTask_ExecuteReturn } from './tasks/CliSchemaTask';
import { SchemaObject } from './_generated/@solace-iot-team/sep-openapi-node';
import { CliMessageDocument } from './documents/CliMessageDocument';
import CliSemVerUtils from './CliSemVerUtils';
import CliEPSchemaVersionsService from './services/CliEPSchemaVersionsService';
import { CliChannelDocument, CliChannelPublishOperation, CliChannelSubscribeOperation } from './documents/CliChannelDocument';
import { CliSchemaVersionTask, ICliSchemaVersionTask_ExecuteReturn } from './tasks/CliSchemaVersionTask';


export class CliImporter {
  private cliAppConfig: TCliAppConfig;

  constructor(cliAppConfig: TCliAppConfig) { 
    this.cliAppConfig = cliAppConfig;
  }

  /**
   * Create a new version of the schema.
   * 
   * Check if schemaObject has any versions already.
   * 
   * if no versions:
   * - use version number of api spec as default
   * if has verions:
   * - bump latest version per strategy
   * 
   */
  private run_present_schema_version = async({ schemaObject, specVersion, cliMessageDocument }: {
    schemaObject: SchemaObject;
    specVersion: string;
    cliMessageDocument: CliMessageDocument;
  }): Promise<void> => {
    const funcName = 'run_present_schema_version';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_SCHEMA_VERSION, details: {
      schemaObject: schemaObject,
      specVersion: specVersion,
      cliMessageDocument: cliMessageDocument
    }}));

    if(schemaObject.id === undefined) throw new CliEPApiError(logName, 'schemaObject.id === undefined', {
      schemaObject: schemaObject
    });

    const schemaId: string = schemaObject.id;

    const cliSchemaVersionTask: CliSchemaVersionTask = new CliSchemaVersionTask({
      cliTaskState: ECliTaskState.PRESENT,
      schemaId: schemaId,
      baseVersionString: specVersion,
      schemaVersionSettings: {
        content: cliMessageDocument.getPayloadSchemaAsString(),
        description: cliMessageDocument.getDescription(),
        displayName: cliMessageDocument.getDisplayName(),
        stateId: CliEPStatesService.getTargetLifecycleState({assetImportTargetLifecycleState: CliConfig.getCliAppConfig().assetImportTargetLifecycleState}),
      }
    });
    const cliSchemaVersionTask_ExecuteReturn: ICliSchemaVersionTask_ExecuteReturn = await cliSchemaVersionTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      cliSchemaVersionTask_ExecuteReturn: cliSchemaVersionTask_ExecuteReturn
    }}));
  }

  private run_present_channel_messages = async({ applicationDomainId, messageDocumentMap, specVersion }:{
    applicationDomainId: string;
    messageDocumentMap: CliMessageDocumentMap;
    specVersion: string;
  }): Promise<void> => {
    const funcName = 'run_present_channel_messages';
    const logName = `${CliImporter.name}.${funcName}()`;

    let xvoid: void;

    for(let [key, messageDocument] of messageDocumentMap) {
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        key: key,
        messageDocument: messageDocument
      }}));

      // ensure the schema exists
      const cliSchemaTask = new CliSchemaTask({
        cliTaskState: ECliTaskState.PRESENT,
        applicationDomainId: applicationDomainId,
        schemaName: messageDocument.getMessage().name(),
        schemaObjectSettings: {
          contentType: messageDocument.getContentType(),
          schemaType: EPSchemaType.JSON_SCHEMA,
          shared: true,
        }
      });
      const cliSchemaTask_ExecuteReturn: ICliSchemaTask_ExecuteReturn = await cliSchemaTask.execute();
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        cliSchemaTask_ExecuteReturn: cliSchemaTask_ExecuteReturn
      }}));

      // present the schema version
      xvoid = await this.run_present_schema_version({
        schemaObject: cliSchemaTask_ExecuteReturn.schemaObject,
        specVersion: specVersion,
        cliMessageDocument: messageDocument
      });
    }

  }

  private run_present_channel = async({ applicationDomainId, channelTopic, channelDocument, specVersion }:{
    applicationDomainId: string;
    channelTopic: string;
    channelDocument: CliChannelDocument;
    specVersion: string;
  }): Promise<void> => {
    const funcName = 'run_present_channel';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      channelTopic: channelTopic,
      channelDocument: channelDocument,
    }}));

    let xvoid: void;

    const channelPublishOperation: CliChannelPublishOperation | undefined = channelDocument.getChannelPublishOperation();
    if(channelPublishOperation !== undefined) {
      const messageDocumentMap: CliMessageDocumentMap = channelPublishOperation.getCliMessageDocumentMap();
      xvoid = await this.run_present_channel_messages({
        applicationDomainId: applicationDomainId,
        messageDocumentMap: messageDocumentMap,
        specVersion: specVersion
      });
    }

    const channelSubscribeOperation: CliChannelSubscribeOperation | undefined = channelDocument.getChannelSubscribeOperation();
    if(channelSubscribeOperation !== undefined) {
      const messageDocumentMap: CliMessageDocumentMap = channelSubscribeOperation.getCliMessageDocumentMap();
      xvoid = await this.run_present_channel_messages({
        applicationDomainId: applicationDomainId,
        messageDocumentMap: messageDocumentMap,
        specVersion: specVersion,
      });
    }

    // throw new Error(`${logName}: do the events per channel operation`);

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
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainName: asyncApiDocument.getApplicationDomainName(),
      applicationDomainSettings: {
        // description: "a new description x"
      }
    });
    const cliApplicationDomainTask_ExecuteReturn: ICliApplicationDomainTask_ExecuteReturn = await applicationDomainsTask.execute();
    // we need the id in subsequent calls
    if(cliApplicationDomainTask_ExecuteReturn.applicationDomainObject.id === undefined) throw new CliEPApiError(logName, 'cliApplicationDomainTask_ExecuteReturn.applicationDomainObject.id === undefined', {
      applicationDomainObject: cliApplicationDomainTask_ExecuteReturn.applicationDomainObject,
    });
    const applicationDomainId: string = cliApplicationDomainTask_ExecuteReturn.applicationDomainObject.id;

    // present all channels
    const channelDocumentMap: CliChannelDocumentMap = asyncApiDocument.getChannelDocuments();
    for(let [key, channelDocument] of channelDocumentMap) {
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        key: key,
        channelDocument: channelDocument
      }}));
      xvoid = await this.run_present_channel({
        applicationDomainId: applicationDomainId,
        channelTopic: key,
        channelDocument: channelDocument,
        specVersion: asyncApiDocument.getVersion(),
      });
    }

    // throw new Error(`${logName}: add the messages to the channel function`);

    // // present all the messages
    // const messageDocumentMap: CliMessageDocumentMap = asyncApiDocument.getMessageDocuments();
    // for(let [key, messageDocument] of messageDocumentMap) {
    //   CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
    //     key: key,
    //     messageDocument: messageDocument
    //   }}));

    //   // ensure the schema exists
    //   const cliSchemaTask = new CliSchemaTask({
    //     cliAsyncApiDocument: asyncApiDocument,
    //     cliTaskState: ECliTaskState.PRESENT,
    //     schemaObject: {
    //       applicationDomainId: applicationDomainId,
    //       name: messageDocument.getMessage().name(),
    //       contentType: messageDocument.getContentType(),
    //       schemaType: ESchemaType.JSON_SCHEMA,
    //       shared: true
    //     }
    //   });
    //   const cliSchemaTask_ExecuteReturn: ICliSchemaTask_ExecuteReturn = await cliSchemaTask.execute();
    //   CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
    //     cliSchemaTask_ExecuteReturn: cliSchemaTask_ExecuteReturn
    //   }}));

    //   // present the schema version
    //   xvoid = await this.run_present_schema_version({
    //     cliAsyncApiDocument: asyncApiDocument,
    //     schemaObject: cliSchemaTask_ExecuteReturn.schemaObject,
    //     specVersion: asyncApiDocument.getVersion(),
    //     cliMessageDocument: messageDocument
    //   });
    // }
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

