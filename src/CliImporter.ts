import { CliLogger, ECliStatusCodes } from './CliLogger';
import CliConfig, { ECliAssetsTargetState, TCliAppConfig } from './CliConfig';
import { CliAsyncApiDocument, CliChannelDocumentMap, CliChannelParameterDocumentMap, CliMessageDocumentMap } from './documents/CliAsyncApiDocument';
import { ECliTaskState } from './tasks/CliTask';
import { CliApplicationDomainTask, ICliApplicationDomainTask_ExecuteReturn } from './tasks/CliApplicationDomainTask';
import CliEPStatesService from './services/CliEPStatesService';
import { CliUtils } from './CliUtils';
import { CliEPApiError, CliError, CliErrorFromError } from './CliError';
import { CliSchemaTask, EPSchemaType, ICliSchemaTask_ExecuteReturn } from './tasks/CliSchemaTask';
import { SchemaObject, Event as EPEvent, SchemaVersion, Enum, EnumValue } from './_generated/@solace-iot-team/sep-openapi-node';
import { CliMessageDocument } from './documents/CliMessageDocument';
import { CliChannelDocument, CliChannelParameterDocument, CliChannelPublishOperation, CliChannelSubscribeOperation } from './documents/CliChannelDocument';
import { CliSchemaVersionTask, ICliSchemaVersionTask_ExecuteReturn } from './tasks/CliSchemaVersionTask';
import { CliEventTask, ICliEventTask_ExecuteReturn } from './tasks/CliEventTask';
import { CliEventVersionTask, ICliEventVersionTask_ExecuteReturn } from './tasks/CliEventVersionTask';
import { CliEnumTask, ICliEnumTask_ExecuteReturn } from './tasks/CliEnumTask';
import { CliEnumVersionTask, ICliEnumVersionTask_ExecuteReturn } from './tasks/CliEnumVersionTask';


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
  }): Promise<ICliSchemaVersionTask_ExecuteReturn> => {
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
    return cliSchemaVersionTask_ExecuteReturn;
  }

  private run_present_channel_message = async({ applicationDomainId, messageDocument, specVersion }:{
    applicationDomainId: string;
    messageDocument: CliMessageDocument;
    specVersion: string;
  }): Promise<SchemaVersion> => {
    const funcName = 'run_present_channel_message';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
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
    const cliSchemaVersionTask_ExecuteReturn: ICliSchemaVersionTask_ExecuteReturn = await this.run_present_schema_version({
      schemaObject: cliSchemaTask_ExecuteReturn.schemaObject,
      specVersion: specVersion,
      cliMessageDocument: messageDocument
    });
    return cliSchemaVersionTask_ExecuteReturn.schemaVersionObject;
  }

  private run_present_event_version = async({ channelTopic, eventObject, specVersion, cliMessageDocument, schemaVersionId }: {
    channelTopic: string;
    eventObject: EPEvent;
    specVersion: string;
    cliMessageDocument: CliMessageDocument;
    schemaVersionId: string;
  }): Promise<void> => {
    const funcName = 'run_present_event_version';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EVENT_VERSION, details: {
      eventObject: eventObject,
      specVersion: specVersion,
      cliMessageDocument: cliMessageDocument
    }}));

    if(eventObject.id === undefined) throw new CliEPApiError(logName, 'eventObject.id === undefined', {
      eventObject: eventObject
    });

    const eventId: string = eventObject.id;

    const cliEventVersionTask: CliEventVersionTask = new CliEventVersionTask({
      cliTaskState: ECliTaskState.PRESENT,
      eventId: eventId,
      baseVersionString: specVersion,
      channelTopic: channelTopic,
      eventVersionSettings: {
        description: cliMessageDocument.getDescription(),
        displayName: cliMessageDocument.getDisplayName(),
        stateId: CliEPStatesService.getTargetLifecycleState({assetImportTargetLifecycleState: CliConfig.getCliAppConfig().assetImportTargetLifecycleState}),
        schemaVersionId: schemaVersionId,
      }
    });
    const cliEventVersionTask_ExecuteReturn: ICliEventVersionTask_ExecuteReturn = await cliEventVersionTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      cliEventVersionTask_ExecuteReturn: cliEventVersionTask_ExecuteReturn
    }}));
  }

  private run_present_channel_event = async({ applicationDomainId, messageDocument, specVersion, channelTopic, schemaVersionId }:{
    applicationDomainId: string;
    messageDocument: CliMessageDocument;
    specVersion: string;
    channelTopic: string;
    schemaVersionId: string;
  }): Promise<void> => {
    const funcName = 'run_present_channel_event';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      messageDocument: messageDocument
    }}));

    // ensure the event exists
    const cliEventTask = new CliEventTask({
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventName: messageDocument.getMessage().name(),
      eventObjectSettings: {
        shared: true,
      }
    });
    const cliEventTask_ExecuteReturn: ICliEventTask_ExecuteReturn = await cliEventTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      cliEventTask_ExecuteReturn: cliEventTask_ExecuteReturn
    }}));

    // present the event version
    const xvoid: void = await this.run_present_event_version({
      channelTopic: channelTopic,
      eventObject: cliEventTask_ExecuteReturn.eventObject,
      specVersion: specVersion,
      cliMessageDocument: messageDocument,
      schemaVersionId: schemaVersionId
    });
  }

  private run_present_enum_version = async({ enumObject, specVersion, cliChannelParameterDocument }: {
    enumObject: Enum;
    specVersion: string;
    cliChannelParameterDocument: CliChannelParameterDocument;
  }): Promise<void> => {
    const funcName = 'run_present_enum_version';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ENUM_VERSION, details: {
      enumObject: enumObject,
      specVersion: specVersion,
      cliChannelParameterDocument: cliChannelParameterDocument
    }}));

    if(enumObject.id === undefined) throw new CliEPApiError(logName, 'enumObject.id === undefined', {
      enumObject: enumObject
    });

    const cliEnumVersionTask: CliEnumVersionTask = new CliEnumVersionTask({
      cliTaskState: ECliTaskState.PRESENT,
      enumId: enumObject.id,
      baseVersionString: specVersion,
      parameterEnumValues: cliChannelParameterDocument.getParameterEnumValueList(),
      enumVersionSettings: {
        description: cliChannelParameterDocument.getDescription(),
        displayName: cliChannelParameterDocument.getDisplayName(),
        stateId: CliEPStatesService.getTargetLifecycleState({assetImportTargetLifecycleState: CliConfig.getCliAppConfig().assetImportTargetLifecycleState}),
      }
    });
    const cliEnumVersionTask_ExecuteReturn: ICliEnumVersionTask_ExecuteReturn = await cliEnumVersionTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      cliEnumVersionTask_ExecuteReturn: cliEnumVersionTask_ExecuteReturn
    }}));
  }

  private run_present_channel_parameters = async({ applicationDomainId, channelParameterDocumentMap, specVersion }:{
    applicationDomainId: string;
    channelParameterDocumentMap?: CliChannelParameterDocumentMap;
    specVersion: string;
  }): Promise<void> => {
    const funcName = 'run_present_channel_parameters';
    const logName = `${CliImporter.name}.${funcName}()`;

    if(channelParameterDocumentMap === undefined) return;

    for(const [enumName, channelParameterDocument] of channelParameterDocumentMap) {
      
      const parameterEnumList: Array<any> = channelParameterDocument.getParameterEnumValueList();
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_CHANNEL_PARAMETERS, details: {
        enumName: enumName,
        channelParameterDocument: channelParameterDocument,
        parameterEnumList: parameterEnumList
      }}));
      // only create the enum if there are any values in the list
      if(parameterEnumList.length > 0) {
        // ensure the enum exists
        const cliEnumTask = new CliEnumTask({
          cliTaskState: ECliTaskState.PRESENT,
          applicationDomainId: applicationDomainId,
          enumName: enumName,
          enumObjectSettings: {
            shared: true,
          }
        });
        const cliEnumTask_ExecuteReturn: ICliEnumTask_ExecuteReturn = await cliEnumTask.execute();
        CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
          cliEnumTask_ExecuteReturn: cliEnumTask_ExecuteReturn
        }}));
        const enumObject: Enum = cliEnumTask_ExecuteReturn.enumObject;
        if(enumObject.id === undefined) throw new CliEPApiError(logName, 'enumObject.id === undefined', {
          enumObject: enumObject,
        })

        specVersion;
        throw new Error(`${logName}: continue with enum version`);


        // present the enum version
        const xvoid: void = await this.run_present_enum_version({
          enumObject: enumObject,
          specVersion: specVersion,
          cliChannelParameterDocument: channelParameterDocument,
        });
      }
    }

    throw new Error(`${logName}: return the map of what - enum ids?`);
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
      const messageDocument: CliMessageDocument = channelPublishOperation.getCliMessageDocument();

      // TODO: wait for implementation in EP and then start testing again
      // // present parameters
      // const x = await this.run_present_channel_parameters({
      //   applicationDomainId: applicationDomainId,
      //   channelParameterDocumentMap: channelDocument.getChannelParameters(),
      //   specVersion: specVersion
      // });        

      // present message
      const schemaVersionObject: SchemaVersion = await this.run_present_channel_message({
        applicationDomainId: applicationDomainId,
        messageDocument: messageDocument,
        specVersion: specVersion
      });
      if(schemaVersionObject.id === undefined) throw new CliEPApiError(logName, 'schemaVersionObject.id === undefined', {
        schemaVersionObject: schemaVersionObject,
      });
      // present event
      xvoid = await this.run_present_channel_event({
        applicationDomainId: applicationDomainId,
        messageDocument: messageDocument,
        specVersion: specVersion,
        channelTopic: channelTopic,
        schemaVersionId: schemaVersionObject.id
      });
    }

    const channelSubscribeOperation: CliChannelSubscribeOperation | undefined = channelDocument.getChannelSubscribeOperation();
    if(channelSubscribeOperation !== undefined) {
      const messageDocument: CliMessageDocument = channelSubscribeOperation.getCliMessageDocument();
      const schemaVersionObject: SchemaVersion = await this.run_present_channel_message({
        applicationDomainId: applicationDomainId,
        messageDocument: messageDocument,
        specVersion: specVersion,
      });
      if(schemaVersionObject.id === undefined) throw new CliEPApiError(logName, 'schemaVersionObject.id === undefined', {
        schemaVersionObject: schemaVersionObject,
      })
      // present event
      xvoid = await this.run_present_channel_event({
        applicationDomainId: applicationDomainId,
        messageDocument: messageDocument,
        specVersion: specVersion,
        channelTopic: channelTopic,
        schemaVersionId: schemaVersionObject.id
      });
    }
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

