import { CliLogger, ECliStatusCodes } from './CliLogger';
import CliConfig, { ECliAssetsTargetState, TCliAppConfig } from './CliConfig';
import { CliAsyncApiDocument, CliChannelDocumentMap, CliChannelParameterDocumentMap, CliEventNames, E_ASYNC_API_SPEC_CONTENNT_TYPES } from './documents/CliAsyncApiDocument';
import { ECliTaskAction, ECliTaskState } from './tasks/CliTask';
import { CliApplicationDomainTask, ICliApplicationDomainTask_ExecuteReturn } from './tasks/CliApplicationDomainTask';
import CliEPStatesService from './services/CliEPStatesService';
import { CliUtils, TDeepDiffFromTo } from './CliUtils';
import { 
  CliAsyncApiSpecBestPracticesError, 
  CliAsyncApiSpecNotSupportedError, 
  CliAsyncApiParserError, 
  CliEPApiContentError, 
  CliError, 
  CliErrorFromError, 
  CliErrorFromSEPApiError, 
  CliImporterError 
} from './CliError';
import { CliSchemaTask, EPSchemaType, ICliSchemaTask_ExecuteReturn } from './tasks/CliSchemaTask';
import { 
  SchemaObject, 
  Event as EPEvent, 
  SchemaVersion, 
  Enum, 
  EventApi, 
  eventApiVersion as EventApiVersion,
  ApiError,
  EventVersion
} from './_generated/@solace-iot-team/sep-openapi-node';
import { CliMessageDocument } from './documents/CliMessageDocument';
import { CliChannelDocument, CliChannelParameterDocument, CliChannelPublishOperation, CliChannelSubscribeOperation } from './documents/CliChannelDocument';
import { CliSchemaVersionTask, ICliSchemaVersionTask_ExecuteReturn } from './tasks/CliSchemaVersionTask';
import { CliEventTask, ICliEventTask_ExecuteReturn } from './tasks/CliEventTask';
import { CliEventVersionTask, ICliEventVersionTask_ExecuteReturn } from './tasks/CliEventVersionTask';
import { CliEnumTask, ICliEnumTask_ExecuteReturn } from './tasks/CliEnumTask';
import { CliEnumVersionTask, ICliEnumVersionTask_ExecuteReturn } from './tasks/CliEnumVersionTask';
import CliEPEventApisService from './services/CliEPEventApisService';
import CliEPEventApiVersionsService from './services/CliEPEventApiVersionsService';
import CliSemVerUtils from './CliSemVerUtils';
import CliAsyncApiDocumentsService from './services/CliAsyncApiDocumentsService';
import { CliEventApiTask, ICliEventApiTask_ExecuteReturn } from './tasks/CliEventApiTask';
import { CliEventApiVersionTask, ICliEventApiVersionTask_ActionLog, ICliEventApiVersionTask_ExecuteReturn } from './tasks/CliEventApiVersionTask';
import CliEPEventVersionsService from './services/CliEPEventVersionsService';
import CliRunContext, { 
  ECliChannelOperation, 
  ICliRunContext_Channel, 
  ICliRunContext_Channel_Event, 
  ICliRunContext_Channel_Operation, 
  ICliRunContext_Channel_Operation_Message, 
  ICliRunContext_Channel_Parameter, 
  ICliRunContext_EventApi, 
  ICliRunContext_EventApiVersion, 
  ICliRunContext_State 
} from './CliRunContext';
import { ParserError } from '@asyncapi/parser';

type TCliImporter_FromTo_EventVersionId = {
  type: string;
  fromEventVersionId: string;
  toEventVersionId: string;
}
type TCliImporter_FromTo_EventVersion = {
  type: string;
  fromEventVersion: EventVersion;
  toEventVersion: EventVersion;
  difference: any;
}

export interface ICliImporterRunReturn {
  applicationDomainName: string | undefined;
  error: any;
}

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

    if(schemaObject.id === undefined) throw new CliEPApiContentError(logName, 'schemaObject.id === undefined', {
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
        displayName: cliMessageDocument.getMessageName(),
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

    const rctxt: ICliRunContext_Channel_Operation_Message = {
      messageName: messageDocument.getMessageName()
    };
    CliRunContext.updateContext({ 
      runContext: rctxt
    });  
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
    }}));
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      messageDocument: messageDocument
    }}));

    // ensure the schema exists
    const cliSchemaTask = new CliSchemaTask({
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainId: applicationDomainId,
      schemaName: messageDocument.getMessageName(),
      schemaObjectSettings: {
        contentType: messageDocument.getContentType(),
        schemaType: EPSchemaType.JSON_SCHEMA,
        shared: true,
      },
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

  private run_present_event_version = async({ channelTopic, eventObject, specVersion, cliMessageDocument, schemaVersionId, applicationDomainId  }: {
    channelTopic: string;
    eventObject: EPEvent;
    specVersion: string;
    cliMessageDocument: CliMessageDocument;
    schemaVersionId: string;
    applicationDomainId: string;
  }): Promise<void> => {
    const funcName = 'run_present_event_version';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EVENT_VERSION, details: {
      eventObject: eventObject,
      specVersion: specVersion,
      cliMessageDocument: cliMessageDocument
    }}));

    if(eventObject.id === undefined) throw new CliEPApiContentError(logName, 'eventObject.id === undefined', {
      eventObject: eventObject
    });

    const eventId: string = eventObject.id;

    const cliEventVersionTask: CliEventVersionTask = new CliEventVersionTask({
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventId: eventId,
      baseVersionString: specVersion,
      channelTopic: channelTopic,
      eventVersionSettings: {
        description: cliMessageDocument.getDescription(),
        displayName: cliMessageDocument.getMessageName(),
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

    const rctxt: ICliRunContext_Channel_Event = {
      messageName: messageDocument.getMessageName()
    };
    CliRunContext.updateContext({ 
      runContext: rctxt
    });  
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
    }}));

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      messageDocument: messageDocument
    }}));

    // ensure the event exists
    const cliEventTask = new CliEventTask({
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventName: messageDocument.getMessageName(),
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
      applicationDomainId: applicationDomainId,
      channelTopic: channelTopic,
      eventObject: cliEventTask_ExecuteReturn.eventObject,
      specVersion: specVersion,
      cliMessageDocument: messageDocument,
      schemaVersionId: schemaVersionId
    });
  }

  private run_present_enum_version = async({ applicationDomainId, enumObject, specVersion, cliChannelParameterDocument }: {
    applicationDomainId: string;
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

    if(enumObject.id === undefined) throw new CliEPApiContentError(logName, 'enumObject.id === undefined', {
      enumObject: enumObject
    });

    const cliEnumVersionTask: CliEnumVersionTask = new CliEnumVersionTask({
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainId: applicationDomainId,
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

    if(channelParameterDocumentMap === undefined) {
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        channelParameters: []
      }}));
      return;
    }

    for(const [parameterName, channelParameterDocument] of channelParameterDocumentMap) {

      const parameterEnumList: Array<string> = channelParameterDocument.getParameterEnumValueList();

      const rctxt: ICliRunContext_Channel_Parameter = {
        parameter: parameterName,
        parameterEnumList: parameterEnumList.length > 0 ? parameterEnumList : undefined
      };
      CliRunContext.updateContext({ 
        runContext: rctxt
      });
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      }}));
  
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_CHANNEL_PARAMETERS, details: {
        channelParameterDocument: channelParameterDocument,
      }}));
      // only create the enum if there are any values in the list
      if(parameterEnumList.length > 0) {
        // ensure the enum exists
        const cliEnumTask = new CliEnumTask({
          cliTaskState: ECliTaskState.PRESENT,
          applicationDomainId: applicationDomainId,
          enumName: parameterName,
          enumObjectSettings: {
            shared: true,
          }
        });
        const cliEnumTask_ExecuteReturn: ICliEnumTask_ExecuteReturn = await cliEnumTask.execute();
        CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
          cliEnumTask_ExecuteReturn: cliEnumTask_ExecuteReturn
        }}));
        const enumObject: Enum = cliEnumTask_ExecuteReturn.enumObject;
        if(enumObject.id === undefined) throw new CliEPApiContentError(logName, 'enumObject.id === undefined', {
          enumObject: enumObject,
        })

        // present the enum version
        const xvoid: void = await this.run_present_enum_version({
          applicationDomainId: applicationDomainId,
          enumObject: enumObject,
          specVersion: specVersion,
          cliChannelParameterDocument: channelParameterDocument,
        });
      }
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

    const rctxt: ICliRunContext_Channel = {
      channelTopic: channelTopic
    };
    CliRunContext.updateContext({ 
      runContext: rctxt
    });

    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
    }}));
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      channelDocument: channelDocument,
    }}));

    let xvoid: void;

    // present channel parameters
    xvoid = await this.run_present_channel_parameters({
      applicationDomainId: applicationDomainId,
      channelParameterDocumentMap: channelDocument.getChannelParameters(),
      specVersion: specVersion
    });
    
    const channelPublishOperation: CliChannelPublishOperation | undefined = channelDocument.getChannelPublishOperation();
    if(channelPublishOperation !== undefined) {

      const rctxt: ICliRunContext_Channel_Operation = {
        type: ECliChannelOperation.Publish,
      };
      CliRunContext.updateContext({ 
        runContext: rctxt
      });  
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      }}));
  
      const messageDocument: CliMessageDocument = channelPublishOperation.getCliMessageDocument();

      // present message
      const schemaVersionObject: SchemaVersion = await this.run_present_channel_message({
        applicationDomainId: applicationDomainId,
        messageDocument: messageDocument,
        specVersion: specVersion,
      });
      if(schemaVersionObject.id === undefined) throw new CliEPApiContentError(logName, 'schemaVersionObject.id === undefined', {
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

      const rctxt: ICliRunContext_Channel_Operation = {
        type: ECliChannelOperation.Subscribe
      };
      CliRunContext.updateContext({ 
        runContext: rctxt
      });  
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      }}));

      const messageDocument: CliMessageDocument = channelSubscribeOperation.getCliMessageDocument();

      // present message
      const schemaVersionObject: SchemaVersion = await this.run_present_channel_message({
        applicationDomainId: applicationDomainId,
        messageDocument: messageDocument,
        specVersion: specVersion,
      });
      if(schemaVersionObject.id === undefined) throw new CliEPApiContentError(logName, 'schemaVersionObject.id === undefined', {
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

  private run_present_event_api = async({ applicationDomainId, cliAsyncApiDocument }:{
    applicationDomainId: string;
    cliAsyncApiDocument: CliAsyncApiDocument;
  }): Promise<void> => {
    const funcName = 'run_present_event_api';
    const logName = `${CliImporter.name}.${funcName}()`;

    const eventApiName: string = cliAsyncApiDocument.getTitle();

    const rctxt: ICliRunContext_EventApi = {
      eventApiName: eventApiName ? eventApiName : 'undefined'
    };
    CliRunContext.updateContext({ 
      runContext: rctxt
    });  
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EVENT_API, details: {
    }}));

    // present event api
    const cliEventApiTask: CliEventApiTask = new CliEventApiTask({
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventApiName: cliAsyncApiDocument.getTitle(),
      eventApiObjectSettings: {
        shared: true
      }
    });
    const cliEventApiTask_ExecuteReturn: ICliEventApiTask_ExecuteReturn = await cliEventApiTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EVENT_API, details: {
      cliEventApiTask_ExecuteReturn: cliEventApiTask_ExecuteReturn
    }}));
    if(cliEventApiTask_ExecuteReturn.eventApiObject.id === undefined) throw new CliEPApiContentError(logName, 'cliEventApiTask_ExecuteReturn.eventApiObject.id === undefined', {
      cliEventApiTask_ExecuteReturn: cliEventApiTask_ExecuteReturn
    });
    const eventApiId: string = cliEventApiTask_ExecuteReturn.eventApiObject.id;
    // create new version
    const cliEventNames: CliEventNames = cliAsyncApiDocument.getEventNames();
    const publishEventVersionIds: Array<string> = [];
    for(const publishEventName of cliEventNames.publishEventNames) {
      const eventVersion: EventVersion | undefined = await CliEPEventVersionsService.getLastestVersionByName({ eventName: publishEventName, applicationDomainId: applicationDomainId });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {});
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      publishEventVersionIds.push(eventVersion.id);
    }
    const subscribeEventVersionIds: Array<string> = [];
    for(const subscribeEventName of cliEventNames.subscribeEventNames) {
      const eventVersion: EventVersion | undefined = await CliEPEventVersionsService.getLastestVersionByName({ eventName: subscribeEventName, applicationDomainId: applicationDomainId });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {});
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      subscribeEventVersionIds.push(eventVersion.id);
    }
    const cliEventApiVersionTask: CliEventApiVersionTask = new CliEventApiVersionTask({
      cliTaskState: ECliTaskState.PRESENT,
      // checkmode: true,
      applicationDomainId: applicationDomainId,
      eventApiId: eventApiId,
      baseVersionString: cliAsyncApiDocument.getVersion(),
      eventApiVersionSettings: {
        description: cliAsyncApiDocument.getDescription(),
        displayName: cliAsyncApiDocument.getTitle(),
        stateId: CliEPStatesService.getTargetLifecycleState({assetImportTargetLifecycleState: CliConfig.getCliAppConfig().assetImportTargetLifecycleState}),

        producedEventVersionIds: (publishEventVersionIds as unknown) as EventApiVersion.producedEventVersionIds,
        consumedEventVersionIds: (subscribeEventVersionIds as unknown) as EventApiVersion.consumedEventVersionIds,
  
        // consumedEventVersionIds: subscribeEventVersionIds,
        // producedEventVersionIds: publishEventVersionIds
      }
    });
    const cliEventApiVersionTask_ExecuteReturn: ICliEventApiVersionTask_ExecuteReturn = await cliEventApiVersionTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EVENT_API, details: {
      cliEventApiVersionTask_ExecuteReturn: cliEventApiVersionTask_ExecuteReturn
    }}));

  }

  private run_present_check_and_compare = async({ applicationDomainId, cliAsyncApiDocument }:{
    applicationDomainId: string;
    cliAsyncApiDocument: CliAsyncApiDocument;
  }): Promise<void> => {
    const funcName = 'run_present_check_and_compare';
    const logName = `${CliImporter.name}.${funcName}()`;

    // check if event api exists
    const eventApi: EventApi | undefined = await CliEPEventApisService.getByName({ 
      applicationDomainId: applicationDomainId,
      eventApiName: cliAsyncApiDocument.getTitle()
    });

    if(eventApi === undefined) {
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.CHECK_EVENT_API, message: "eventApi does not exist", details: {
        applicationDomainId: applicationDomainId,
        eventApiName: cliAsyncApiDocument.getTitle()  
      }}));
      return;
    }

    // eventApi exists
    if(eventApi.id === undefined) throw new CliEPApiContentError(logName, 'eventApi.id === undefined', {
      eventApi: eventApi
    });
    if(eventApi.name === undefined) throw new CliEPApiContentError(logName, 'eventApi.name === undefined', {
      eventApi: eventApi
    });

    // check if event api version already exists in the application domain
    const latestEventApiVersion: EventApiVersion | undefined = await CliEPEventApiVersionsService.getLastestVersionById({ 
      eventApiId: eventApi.id,
    });
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.CHECK_EVENT_API, message: "latest version of event api", details: {
      latestEventApiVersion: latestEventApiVersion ? latestEventApiVersion : 'undefined'
    }}));
    if(latestEventApiVersion === undefined) return;

    // event api version exists
    if(latestEventApiVersion.version === undefined || latestEventApiVersion.id === undefined) throw new CliEPApiContentError(logName, 'latestEventApiVersion.version === undefined || latestEventApiVersion.id === undefined', {
      latestEventApiVersion: latestEventApiVersion
    });
    const rctxt: ICliRunContext_EventApiVersion = {
      existingEventApiName: eventApi.name,
      eventApiVersion: cliAsyncApiDocument.getVersion(),
      latestExistingEventApiVersion: latestEventApiVersion.version
    };
    CliRunContext.updateContext({ 
      runContext: rctxt
    });  
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.CHECK_EVENT_API_VERSION, details: {
    }}));
    
    // if ep version is greater spec version ==> don't continue, manual versioning in EP happened
    if(CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
      newVersion: latestEventApiVersion.version,
      oldVersion: cliAsyncApiDocument.getVersion(),
    })) {
      throw new CliAsyncApiSpecBestPracticesError(logName, undefined, "Event Portal Event API Version greater than Api Spec version. Aborting import...", {
        epEventApiName: eventApi.name ? eventApi.name : 'undefined',
        epEventApiVersionName: latestEventApiVersion.displayName ? latestEventApiVersion.displayName : 'undefined',
        epEventApiVersion: latestEventApiVersion.version,
        asyncApiVersion: cliAsyncApiDocument.getVersion()
      });
    }

    // both versions are either the same or import spec version is greater than ep spec version

    // check if a new event api version would be created
    const cliEventNames: CliEventNames = cliAsyncApiDocument.getEventNames();

    const publishEventVersionIds: Array<string> = [];
    for(const publishEventName of cliEventNames.publishEventNames) {
      // set run context
      const rctxt: ICliRunContext_Channel_Event = {
        messageName: publishEventName
      };
      CliRunContext.updateContext({ 
        runContext: rctxt
      });  
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.CHECK_EVENT, details: {
      }}));  
      // check if event version exists 
      const eventVersion: EventVersion | undefined = await CliEPEventVersionsService.getLastestVersionByName({ eventName: publishEventName, applicationDomainId: applicationDomainId });
      // there may not be an event version yet
      let eventVersionId: string = `new-event-version-for-${publishEventName}`;
      if(eventVersion !== undefined) {
        if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
          eventVersion: eventVersion
        });
        eventVersionId = eventVersion.id;
      } 
      publishEventVersionIds.push(eventVersionId);
    }
    const subscribeEventVersionIds: Array<string> = [];
    for(const subscribeEventName of cliEventNames.subscribeEventNames) {
      // set run context
      const rctxt: ICliRunContext_Channel_Event = {
        messageName: subscribeEventName
      };
      CliRunContext.updateContext({ 
        runContext: rctxt
      });  
      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.CHECK_EVENT, details: {
      }}));
      // check if event version exists 
      const eventVersion: EventVersion | undefined = await CliEPEventVersionsService.getLastestVersionByName({ eventName: subscribeEventName, applicationDomainId: applicationDomainId });
      // there may not be an event version yet
      let eventVersionId: string = `new-event-version-for-${subscribeEventName}`;
      if(eventVersion !== undefined) {
        if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
          eventVersion: eventVersion
        });
        eventVersionId = eventVersion.id;
      } 
      subscribeEventVersionIds.push(eventVersionId);
    }

    // check if a new event api version would be required
    const cliEventApiVersionTask: CliEventApiVersionTask = new CliEventApiVersionTask({
      cliTaskState: ECliTaskState.PRESENT,
      checkmode: true,
      applicationDomainId: applicationDomainId,
      eventApiId: eventApi.id,
      baseVersionString: cliAsyncApiDocument.getVersion(),
      eventApiVersionSettings: {
        description: cliAsyncApiDocument.getDescription(),
        displayName: cliAsyncApiDocument.getTitle(),
        stateId: CliEPStatesService.getTargetLifecycleState({assetImportTargetLifecycleState: CliConfig.getCliAppConfig().assetImportTargetLifecycleState}),

        producedEventVersionIds: (publishEventVersionIds as unknown) as EventApiVersion.producedEventVersionIds,
        consumedEventVersionIds: (subscribeEventVersionIds as unknown) as EventApiVersion.consumedEventVersionIds,

        // consumedEventVersionIds: subscribeEventVersionIds,
        // producedEventVersionIds: publishEventVersionIds
      }
    });
    const cliEventApiVersionTask_ExecuteReturn: ICliEventApiVersionTask_ExecuteReturn = await cliEventApiVersionTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EVENT_API, details: {
      cliEventApiVersionTask_ExecuteReturn: cliEventApiVersionTask_ExecuteReturn
    }}));

    // check result
    // check if new version would be created
    if(cliEventApiVersionTask_ExecuteReturn.actionLog.action === ECliTaskAction.CREATE_NEW_VERSION) {
      const epLatestVersion = latestEventApiVersion.version;
      const importSpecVersion = cliAsyncApiDocument.getVersion();
      // importSpecVersion must be greater than epLatestVersion
      if(!CliSemVerUtils.is_NewVersion_GreaterThan_OldVersion({
        newVersion: importSpecVersion,
        oldVersion: epLatestVersion,
      })) {
        // create report of differences
        const cliEventApiVersionTask_ActionLog: ICliEventApiVersionTask_ActionLog = cliEventApiVersionTask_ExecuteReturn.actionLog;
        if(cliEventApiVersionTask_ActionLog.details.difference === undefined) throw new CliImporterError(logName, 'cliEventApiVersionTask_ActionLog.details.difference === undefined', {
          cliEventApiVersionTask_ActionLog: cliEventApiVersionTask_ActionLog
        });
        // follow the event version ids and get the details and differences: from / to

        // const fromTo: {
        //   from: string;
        //   to: string;
        // } = {
        //   from: "03tptnff2sh",
        //   to: "657ob2ysenj" 
        // };
        // const producedEventVersionIds: Array<{
        //   from: string;
        //   to: string;
        // }> = [];

        const fromToEventVersionIdList: Array<TCliImporter_FromTo_EventVersionId> = [];
        for(const key in cliEventApiVersionTask_ActionLog.details.difference) {
          let _type = CliUtils.nameOf<EventApiVersion>('producedEventVersionIds');
          if(key.includes(_type)) {
            const fromTo: TDeepDiffFromTo = cliEventApiVersionTask_ActionLog.details.difference[key];
            fromToEventVersionIdList.push({
              type: _type,
              fromEventVersionId: fromTo.from,
              toEventVersionId: fromTo.to
            });
          }
          _type = CliUtils.nameOf<EventApiVersion>('consumedEventVersionIds');
          if(key.includes(_type)) {
            const fromTo: TDeepDiffFromTo = cliEventApiVersionTask_ActionLog.details.difference[key];
            fromToEventVersionIdList.push({
              type: _type,
              fromEventVersionId: fromTo.from,
              toEventVersionId: fromTo.to
            });
          }
        }
        // gather the even version objects
        const cliImporter_FromTo_EventVersion_List: Array<TCliImporter_FromTo_EventVersion> = [];
        for(const cliImporter_FromTo_EventVersionId of fromToEventVersionIdList) {
          // get both event versions and output details
          const cliImporter_FromTo_EventVersion: TCliImporter_FromTo_EventVersion = {
            type: cliImporter_FromTo_EventVersionId.type,
            fromEventVersion: await CliEPEventVersionsService.getVersionById({ 
              applicationDomainId: applicationDomainId,
              eventVersionId: cliImporter_FromTo_EventVersionId.fromEventVersionId,
            }),
            toEventVersion: await CliEPEventVersionsService.getVersionById({ 
              applicationDomainId: applicationDomainId,
              eventVersionId: cliImporter_FromTo_EventVersionId.toEventVersionId,
            }),
            difference: undefined
          };
          cliImporter_FromTo_EventVersion.difference = CliEPEventVersionsService.creteVersionDifference4Reporting({ 
            fromEventVersion: cliImporter_FromTo_EventVersion.fromEventVersion,
            toEventVersion: cliImporter_FromTo_EventVersion.toEventVersion
          });
          cliImporter_FromTo_EventVersion_List.push(cliImporter_FromTo_EventVersion);
        }
        throw new CliAsyncApiSpecBestPracticesError(logName, undefined, "Changes made to Api. Api Version not greater than latest Event Portal Event API Version. Aborting import...", {
          epEventApiName: eventApi.name ? eventApi.name : 'undefined',
          epEventApiVersionName: latestEventApiVersion.displayName ? latestEventApiVersion.displayName : 'undefined',
          epEventApiVersion: epLatestVersion,
          apiVersion: importSpecVersion,
          eventVersionDifferences: cliImporter_FromTo_EventVersion_List
        });  
      }
    }
  }

  private generate_asset_ouput = ({ cliAsyncApiDocument, filePath, appConfig }:{
    cliAsyncApiDocument: CliAsyncApiDocument;
    filePath: string;
    appConfig: TCliAppConfig;
  }): void => {
    const funcName = 'generate_asset_ouput';
    const logName = `${CliImporter.name}.${funcName}()`;

    // calculate the asset output dir
    const applicationDomainName: string = cliAsyncApiDocument.getApplicationDomainName();
    
    
    // TODO: make a proper dirs out of these
    const assetOutputRootDir: string = appConfig.assetOutputRootDir + "/" + applicationDomainName;
    CliUtils.ensurePathExists(assetOutputRootDir);
    const asyncApiSpecDir = assetOutputRootDir + "/" + cliAsyncApiDocument.getTitleAsFilePath();
    CliUtils.ensurePathExists(asyncApiSpecDir);
    const schemasDir = assetOutputRootDir + "/schemas"; 
    CliUtils.ensurePathExists(schemasDir);

    const asyncApiSpecFileNameJson = asyncApiSpecDir + "/" + cliAsyncApiDocument.getTitleAsFileName("json");
    const asyncApiSpecFileNameYaml = asyncApiSpecDir + "/" + cliAsyncApiDocument.getTitleAsFileName("yml");

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.GENERATING_ASSETS, details: {
      filePath: filePath,
      asyncApiSpecFileNameJson: asyncApiSpecFileNameJson,
      asyncApiSpecFileNameYaml: asyncApiSpecFileNameYaml,
      schemasDir: schemasDir
    }}));

    // save specs as file
    CliUtils.saveContents2File({ 
      filePath: asyncApiSpecFileNameJson,
      content: JSON.stringify(cliAsyncApiDocument.getSpecAsSanitizedJson(), null, 2)
    });
    CliUtils.saveContents2File({ 
      filePath: asyncApiSpecFileNameYaml,
      content: cliAsyncApiDocument.getSpecAsSanitizedYamlString()
    });
    // save all channel message schemas to files
    const cliChannelDocumentMap: CliChannelDocumentMap = cliAsyncApiDocument.getChannelDocuments();
    for(let [topic, channelDocument] of cliChannelDocumentMap) {
      const cliChannelPublishOperation: CliChannelPublishOperation | undefined = channelDocument.getChannelPublishOperation();
      if(cliChannelPublishOperation !== undefined) {
        const cliMessageDocument: CliMessageDocument = cliChannelPublishOperation.getCliMessageDocument();
        if(cliMessageDocument.getContentType() !== E_ASYNC_API_SPEC_CONTENNT_TYPES.APPLICATION_JSON) throw new CliAsyncApiSpecNotSupportedError(logName, undefined, { message: "unsupported message schema content type" }, {
          messageName: cliMessageDocument.getMessageName(),
          contentType: cliMessageDocument.getContentType(),
          supportedContentTypes: cliAsyncApiDocument.getSupportedContentTypes()
        });

        const schemaFilePath = schemasDir + "/" + cliMessageDocument.getSchemaFileName();
        CliUtils.saveContents2File({ 
          filePath: schemaFilePath,
          content: JSON.stringify(cliMessageDocument.getSchemaAsSanitizedJson(), null, 2)
        });
    
      }
      const cliChannelSubscribeOperation: CliChannelSubscribeOperation | undefined = channelDocument.getChannelSubscribeOperation();
      if(cliChannelSubscribeOperation !== undefined) {
        const cliMessageDocument: CliMessageDocument = cliChannelSubscribeOperation.getCliMessageDocument();
        if(cliMessageDocument.getContentType() !== E_ASYNC_API_SPEC_CONTENNT_TYPES.APPLICATION_JSON) throw new CliAsyncApiSpecNotSupportedError(logName, undefined, { message: "unsupported message schema content type" }, {
          messageName: cliMessageDocument.getMessageName(),
          contentType: cliMessageDocument.getContentType(),
          supportedContentTypes: cliAsyncApiDocument.getSupportedContentTypes()
        });

        const schemaFilePath = schemasDir + "/" + cliMessageDocument.getSchemaFileName();
        CliUtils.saveContents2File({ 
          filePath: schemaFilePath,
          content: JSON.stringify(cliMessageDocument.getSchemaAsSanitizedJson(), null, 2)
        });
    
      }
    }
  }

  private run_present = async({ cliAsyncApiDocument }:{
    cliAsyncApiDocument: CliAsyncApiDocument;
  }): Promise<void> => {
    const funcName = 'run_present';
    const logName = `${CliImporter.name}.${funcName}()`;

    const rctxt: ICliRunContext_State = {
      apiTitle: cliAsyncApiDocument.getTitle(),
      apiVersion: cliAsyncApiDocument.getVersion(),
      epApplicationDomainName: cliAsyncApiDocument.getApplicationDomainName(),
    };
    CliRunContext.updateContext({ 
      runContext: rctxt
    });

    // use for type validation when calling async functions
    let xvoid: void;
    
    // ensure application domain name exists
    const applicationDomainsTask = new CliApplicationDomainTask({
      cliTaskState: ECliTaskState.PRESENT,
      applicationDomainName: cliAsyncApiDocument.getApplicationDomainName(),
      applicationDomainSettings: {
        // description: "a new description x"
      }
    });
    const cliApplicationDomainTask_ExecuteReturn: ICliApplicationDomainTask_ExecuteReturn = await applicationDomainsTask.execute();
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, message: 'created application domain', details: {
      cliApplicationDomainTask_ExecuteReturn: cliApplicationDomainTask_ExecuteReturn
    }}));

    // we need the id in subsequent calls
    if(cliApplicationDomainTask_ExecuteReturn.applicationDomainObject.id === undefined) throw new CliEPApiContentError(logName, 'cliApplicationDomainTask_ExecuteReturn.applicationDomainObject.id === undefined', {
      applicationDomainObject: cliApplicationDomainTask_ExecuteReturn.applicationDomainObject,
    });
    const applicationDomainId: string = cliApplicationDomainTask_ExecuteReturn.applicationDomainObject.id;
    
    xvoid = await this.run_present_check_and_compare({ 
      applicationDomainId: applicationDomainId,
      cliAsyncApiDocument: cliAsyncApiDocument
    });

    // present all channels
    const channelDocumentMap: CliChannelDocumentMap = cliAsyncApiDocument.getChannelDocuments();
    for(let [topic, channelDocument] of channelDocumentMap) {
      // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      //   topic: topic,
      //   channelDocument: channelDocument
      // }}));
      xvoid = await this.run_present_channel({
        applicationDomainId: applicationDomainId,
        channelTopic: topic,
        channelDocument: channelDocument,
        specVersion: cliAsyncApiDocument.getVersion(),
      });
    }

    // present event api
    xvoid = await this.run_present_event_api({
      applicationDomainId: applicationDomainId,
      cliAsyncApiDocument: cliAsyncApiDocument
    }); 

    // generate the output for all assets
    this.generate_asset_ouput({
      cliAsyncApiDocument: cliAsyncApiDocument,
      filePath: this.cliAppConfig.asyncApiFileName,
      appConfig: this.cliAppConfig,
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTED, details: {
      specFile: this.cliAppConfig.asyncApiFileName,
      targetState: this.cliAppConfig.assetsTargetState,
    }}));

    // throw new Error(`${logName}: test error handling in test_mode`);

  }

  private run_absent = async({ cliAsyncApiDocument }:{
    cliAsyncApiDocument: CliAsyncApiDocument;
  }): Promise<void> => {
    const funcName = 'run_absent';
    const logName = `${CliImporter.name}.${funcName}()`;
    cliAsyncApiDocument;
    throw new Error(`${logName}: implement me.`);
  }

  private parse_and_run_validations = async(): Promise<CliAsyncApiDocument> => {
    const funcName = 'parse_and_run_validations';
    const logName = `${CliImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.VALIDATING_SPEC, details: {
      specFile: this.cliAppConfig.asyncApiFileName,
    }}));

    // parse & validate spec
    const asyncApiDocument: CliAsyncApiDocument = await CliAsyncApiDocumentsService.createFromFile({ 
      filePath: this.cliAppConfig.asyncApiFileName,
      appConfig: this.cliAppConfig,
    });

    // TODO: run best practice checks separately here
    // with options


    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.VALIDATED_SPEC, details: {
      title: asyncApiDocument.getTitle(),
      version: asyncApiDocument.getVersion(),
      applicationDomainName: asyncApiDocument.getApplicationDomainName()
    }}));
    return asyncApiDocument;
  }

  public run = async(): Promise<ICliImporterRunReturn> => {
    const funcName = 'run';
    const logName = `${CliImporter.name}.${funcName}()`;
    
    CliRunContext.setRunContext({ 
      runContext: {
        apiFile: this.cliAppConfig.asyncApiFileName,
        targetState: this.cliAppConfig.assetsTargetState,
      }
    });

    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
    }}));

    const cliImporterRunReturn: ICliImporterRunReturn = {
      applicationDomainName: undefined,
      error: undefined
    }

    try {

      const cliAsyncApiDocument: CliAsyncApiDocument = await this.parse_and_run_validations();
      cliImporterRunReturn.applicationDomainName = cliAsyncApiDocument.getApplicationDomainName();

      let xvoid: void;

      // get the state dtos as reference
      xvoid = await CliEPStatesService.initialize();

      // run the respective pipeline
      switch(this.cliAppConfig.assetsTargetState) {
        case ECliAssetsTargetState.PRESENT:
          xvoid = await this.run_present({ cliAsyncApiDocument: cliAsyncApiDocument });
          break;
        case ECliAssetsTargetState.ABSENT:
          xvoid = await this.run_absent( { cliAsyncApiDocument: cliAsyncApiDocument });
          break;
        default:
          CliUtils.assertNever(logName, this.cliAppConfig.assetsTargetState);
      }

      CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTED, details: {
        specFile: this.cliAppConfig.asyncApiFileName,
        targetState: this.cliAppConfig.assetsTargetState,
      }}));

    } catch(e: any) {
      if(e instanceof CliError) {
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
          error: e
        }}));
      } else if(e instanceof ApiError) {
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
          error: new CliErrorFromSEPApiError(logName, undefined, e)
        }}));
      } else if(e instanceof ParserError) {
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
          error: new CliAsyncApiParserError(logName, undefined, e)
        }}));
      } else {
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
          error: new CliErrorFromError(e, logName)
        }}));  
      }
      cliImporterRunReturn.error = e;
    } finally {
      return cliImporterRunReturn;
    }

  }

}

