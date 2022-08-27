import { 
  EpAsynApiChannelPublishOperation,
  EpAsyncApiChannelDocument,
  EpAsyncApiChannelParameterDocument,
  EpAsyncApiChannelSubscribeOperation,
  EpAsyncApiDocument, 
  EpAsyncApiMessageDocument, 
  E_EpAsyncApiContentTypes, 
  T_EpAsyncApiChannelDocumentMap,
  T_EpAsyncApiChannelParameterDocumentMap
} from '@solace-labs/ep-asyncapi';
import { 
  Enum, 
  SchemaObject, 
  SchemaVersion, 
  Event as EPEvent 
} from '@solace-labs/ep-openapi-node';
import { 
  EEpSdkSchemaType,
  EEpSdkTask_TargetState,
  EpSdkApplicationDomainTask, 
  EpSdkEnumTask, 
  EpSdkEnumVersionTask, 
  EpSdkEpEventTask, 
  EpSdkEpEventVersionTask, 
  EpSdkSchemaTask,
  EpSdkSchemaVersionTask,
  IEpSdkApplicationDomainTask_ExecuteReturn,
  IEpSdkEnumTask_ExecuteReturn,
  IEpSdkEnumVersionTask_ExecuteReturn,
  IEpSdkEpEventTask_ExecuteReturn,
  IEpSdkEpEventVersionTask_ExecuteReturn,
  IEpSdkSchemaTask_ExecuteReturn,
  IEpSdkSchemaVersionTask_ExecuteReturn,
} from '@solace-labs/ep-sdk';
import { 
  CliEPApiContentError,
  CliAsyncApiSpecFeatureNotSupportedError,
  CliErrorFactory
} from '../CliError';
import { 
  CliImporter, 
  ICliImporterGenerateAssetsOptions, 
  ICliImporterOptions, 
  ICliImporterRunOptions, 
  ICliImporterRunPresentOptions,
  ICliImporterRunPresentReturn,
  ICliImporterRunReturn, 
} from './CliImporter';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliRunContext, { 
  ECliChannelOperation, 
  ICliApiFileRunContext, 
  ICliApiRunContext, 
  ICliApiRunContext_Channel, 
  ICliApiRunContext_Channel_Operation, 
  ICliApiRunContext_Channel_Operation_Message, 
  ICliApiRunContext_Channel_Parameter, 
} from '../CliRunContext';
import CliRunSummary, { ECliChannelOperationType, ECliRunSummary_Type } from '../CliRunSummary';
import { CliUtils } from '../CliUtils';
import CliAsyncApiDocumentService from '../services/CliAsyncApiDocumentService';

export interface ICliAssetsImporterOptions extends ICliImporterOptions {
}
export interface ICliAssetsImporterGenerateAssetsOptions extends ICliImporterGenerateAssetsOptions {
  epAsyncApiDocument: EpAsyncApiDocument;
}
export interface ICliAssetsImporterRunPresentOptions extends ICliImporterRunPresentOptions {
  epAsyncApiDocument: EpAsyncApiDocument;
}
export interface ICliAssetsImporterRunPresentReturn extends ICliImporterRunPresentReturn {
}
export interface ICliAssetsImporterRunOptions extends ICliImporterRunOptions {
}
export interface ICliAssetsImporterRunReturn extends ICliImporterRunReturn {
}

export class CliAssetsImporter extends CliImporter {

  constructor(cliAssetImporterOptions: ICliAssetsImporterOptions) { 
    super(cliAssetImporterOptions);
  }

  private get_cliAssetsImporterOptions(): ICliAssetsImporterOptions { return this.cliImporterOptions; }

  private run_present_event_version = async({ epAsyncApiChannelDocument, eventObject, specVersion, epAsyncApiMessageDocument, schemaVersionId, applicationDomainId, checkmode }: {
    epAsyncApiChannelDocument: EpAsyncApiChannelDocument;
    epAsyncApiMessageDocument: EpAsyncApiMessageDocument;
    eventObject: EPEvent;
    specVersion: string;
    schemaVersionId: string;
    applicationDomainId: string;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_event_version';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_MESSAGE, details: {
      eventObject: eventObject,
      specVersion: specVersion,
      epAsyncApiMessageDocument: epAsyncApiMessageDocument
    }}));

    if(eventObject.id === undefined) throw new CliEPApiContentError(logName, 'eventObject.id === undefined', {
      eventObject: eventObject
    });

    const eventId: string = eventObject.id;
    const eventVersionDisplayName: string = epAsyncApiChannelDocument.getEpEventVersionDisplayName();
    const channelTopic: string = epAsyncApiChannelDocument.getAsyncApiChannelKey();

    const epSdkEpEventVersionTask = new EpSdkEpEventVersionTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventId: eventId,
      versionString: specVersion,
      versionStrategy: this.get_EEpSdk_VersionTaskStrategy(),
      topicString: channelTopic,
      eventVersionSettings: {
        description: epAsyncApiMessageDocument.getDescription(),
        displayName: eventVersionDisplayName,
        schemaVersionId: schemaVersionId,
        stateId: this.get_EpSdkTask_StateId(),
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: checkmode
    });
    const epSdkEpEventVersionTask_ExecuteReturn: IEpSdkEpEventVersionTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkEpEventVersionTask,
      expectNoAction: checkmode
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT_VERSION, details: {
      epSdkEpEventVersionTask_ExecuteReturn: epSdkEpEventVersionTask_ExecuteReturn
    }}));
    // summary
    CliRunSummary.processedEventVersion({ epSdkEpEventVersionTask_ExecuteReturn: epSdkEpEventVersionTask_ExecuteReturn });
  }

  private run_present_channel_event = async({ applicationDomainId, epAsyncApiChannelDocument, epAsyncApiMessageDocument, specVersion, schemaVersionId, checkmode }:{
    applicationDomainId: string;
    epAsyncApiChannelDocument: EpAsyncApiChannelDocument;
    epAsyncApiMessageDocument: EpAsyncApiMessageDocument;
    specVersion: string;
    schemaVersionId: string;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_channel_event';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    const epEventName: string = epAsyncApiChannelDocument.getEpEventName();
    const channelTopic: string = epAsyncApiChannelDocument.getAsyncApiChannelKey();

    // const rctxt: ICliApiRunContext_Channel_Event = {
    //   channelTopic: channelTopic,
    //   epEventName: epEventName 
    // };
    // CliRunContext.updateContext({ 
    //   runContext: rctxt
    // });  
    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_MESSAGE, details: {
      epEventName: epEventName,
      channelTopic: channelTopic
    }}));
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_MESSAGE, details: {
      epAsyncApiMessageDocument: epAsyncApiMessageDocument
    }}));

    // present event
    const epSdkEpEventTask = new EpSdkEpEventTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventName: epEventName,
      eventObjectSettings: {
        shared: true,
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: checkmode
    });
    const epSdkEpEventTask_ExecuteReturn: IEpSdkEpEventTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkEpEventTask,
      expectNoAction: checkmode
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT, details: {
      epSdkEpEventTask_ExecuteReturn: epSdkEpEventTask_ExecuteReturn
    }}));

    // present the event version
    const xvoid: void = await this.run_present_event_version({
      applicationDomainId: applicationDomainId,
      eventObject: epSdkEpEventTask_ExecuteReturn.epObject,
      specVersion: specVersion,
      epAsyncApiChannelDocument: epAsyncApiChannelDocument,
      epAsyncApiMessageDocument: epAsyncApiMessageDocument,
      schemaVersionId: schemaVersionId,
      checkmode: checkmode
    });
  }

  private run_present_schema_version = async({ applicationDomainId, schemaObject, specVersion, epAsyncApiMessageDocument, checkmode }: {
    applicationDomainId: string;
    schemaObject: SchemaObject;
    specVersion: string;
    epAsyncApiMessageDocument: EpAsyncApiMessageDocument;
    checkmode: boolean;
  }): Promise<IEpSdkSchemaVersionTask_ExecuteReturn> => {
    const funcName = 'run_present_schema_version';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_MESSAGE, details: {
    }}));
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_MESSAGE, details: {
      schemaObject: schemaObject,
      specVersion: specVersion,
      epAsyncApiMessageDocument: epAsyncApiMessageDocument
    }}));

    if(schemaObject.id === undefined) throw new CliEPApiContentError(logName, 'schemaObject.id === undefined', {
      schemaObject: schemaObject
    });

    const epSdkSchemaVersionTask = new EpSdkSchemaVersionTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      schemaId: schemaObject.id,
      versionString: specVersion,
      versionStrategy: this.get_EEpSdk_VersionTaskStrategy(),
      schemaVersionSettings: {
        content: JSON.stringify(epAsyncApiMessageDocument.getSchemaAsSanitizedJson()),
        description: epAsyncApiMessageDocument.getDescription(),
        displayName: epAsyncApiMessageDocument.getMessageName(),
        stateId: this.get_EpSdkTask_StateId(),
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: checkmode
    });
    const epSdkSchemaVersionTask_ExecuteReturn: IEpSdkSchemaVersionTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkSchemaVersionTask,
      expectNoAction: checkmode
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_SCHEMA_VERSION, details: {
      epSdkSchemaVersionTask_ExecuteReturn: epSdkSchemaVersionTask_ExecuteReturn
    }}));
    // summary
    CliRunSummary.processedSchemaVersion({ epSdkSchemaVersionTask_ExecuteReturn: epSdkSchemaVersionTask_ExecuteReturn });
    return epSdkSchemaVersionTask_ExecuteReturn;
  }

  private run_present_channel_message = async({ applicationDomainId, epAsyncApiMessageDocument, specVersion, checkmode }:{
    applicationDomainId: string;
    epAsyncApiMessageDocument: EpAsyncApiMessageDocument;
    specVersion: string;
    checkmode: boolean;
  }): Promise<SchemaVersion> => {
    const funcName = 'run_present_channel_message';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    const rctxt: ICliApiRunContext_Channel_Operation_Message = {
      messageName: epAsyncApiMessageDocument.getMessageName()
    };
    CliRunContext.push(rctxt);  

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_MESSAGE, details: {
    }}));
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_MESSAGE, details: {
      epAsyncApiMessageDocument: epAsyncApiMessageDocument
    }}));

    // present schema
    const epSdkSchemaTask = new EpSdkSchemaTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      schemaName: epAsyncApiMessageDocument.getMessageName(),
      schemaObjectSettings: {
        contentType: CliUtils.map_MessageDocumentContentType_To_EpSchemaContentType(epAsyncApiMessageDocument.getContentType()),
        schemaType: EEpSdkSchemaType.JSON_SCHEMA,
        shared: true,
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: checkmode,
    });
    const epSdkSchemaTask_ExecuteReturn: IEpSdkSchemaTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkSchemaTask,
      expectNoAction: checkmode
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_SCHEMA, details: {
      epSdkSchemaTask_ExecuteReturn: epSdkSchemaTask_ExecuteReturn
    }}));

    // present the schema version
    const epSdkSchemaVersionTask_ExecuteReturn: IEpSdkSchemaVersionTask_ExecuteReturn = await this.run_present_schema_version({
      schemaObject: epSdkSchemaTask_ExecuteReturn.epObject,
      specVersion: specVersion,
      epAsyncApiMessageDocument: epAsyncApiMessageDocument,
      applicationDomainId: applicationDomainId,
      checkmode: checkmode
    });
    CliRunContext.pop();  
    return epSdkSchemaVersionTask_ExecuteReturn.epObject;
  }

  private run_present_enum_version = async({ applicationDomainId, enumObject, specVersion, epAsyncApiChannelParameterDocument, checkmode }: {
    applicationDomainId: string;
    enumObject: Enum;
    specVersion: string;
    epAsyncApiChannelParameterDocument: EpAsyncApiChannelParameterDocument;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_enum_version';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;
    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_PARAMETER, details: {
    }}));
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_PARAMETER, details: {
      enumObject: enumObject,
      specVersion: specVersion,
      epAsyncApiChannelParameterDocument: epAsyncApiChannelParameterDocument,
      checkmode: checkmode
    }}));

    if(enumObject.id === undefined) throw new CliEPApiContentError(logName, 'enumObject.id === undefined', {
      enumObject: enumObject
    });

    const epSdkEnumVersionTask = new EpSdkEnumVersionTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      enumId: enumObject.id,
      versionString: specVersion,
      versionStrategy: this.get_EEpSdk_VersionTaskStrategy(),
      enumValues: epAsyncApiChannelParameterDocument.getParameterEnumValueList(),
      enumVersionSettings: {
        description: epAsyncApiChannelParameterDocument.getDescription(),
        displayName: epAsyncApiChannelParameterDocument.getDisplayName(),
        stateId: this.get_EpSdkTask_StateId(),
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: checkmode
    });
    const epSdkEnumVersionTask_ExecuteReturn: IEpSdkEnumVersionTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkEnumVersionTask,
      expectNoAction: checkmode
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_ENUM_VERSION, details: {
      epSdkEnumVersionTask_ExecuteReturn: epSdkEnumVersionTask_ExecuteReturn
    }}));
    // summary
    CliRunSummary.processedEnumVersion({ epSdkEnumVersionTask_ExecuteReturn: epSdkEnumVersionTask_ExecuteReturn });
        
  }

  private run_present_channel_parameters = async({ applicationDomainId, epAsyncApiChannelParameterDocumentMap, specVersion, checkmode }:{
    applicationDomainId: string;
    epAsyncApiChannelParameterDocumentMap?: T_EpAsyncApiChannelParameterDocumentMap;
    specVersion: string;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_channel_parameters';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    if(epAsyncApiChannelParameterDocumentMap === undefined) {
      CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_PARAMETERS, details: {
        channelParameters: []
      }}));
      return;
    }

    for(const [parameterName, epAsyncApiChannelParameterDocument] of epAsyncApiChannelParameterDocumentMap) {

      const parameterEnumList: Array<string> = epAsyncApiChannelParameterDocument.getParameterEnumValueList();

      const rctxt: ICliApiRunContext_Channel_Parameter = {
        parameter: parameterName,
        parameterEnumList: parameterEnumList.length > 0 ? parameterEnumList : undefined
      };
      CliRunContext.push(rctxt);
      CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_PARAMETER, details: {
      }}));
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_PARAMETER, details: {
        epAsyncApiChannelParameterDocument: epAsyncApiChannelParameterDocument,
      }}));
      // only create the enum if there are any values in the list
      if(parameterEnumList.length > 0) {
        // present enum
        const epSdkEnumTask = new EpSdkEnumTask({
          epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
          applicationDomainId: applicationDomainId,
          enumName: parameterName,
          enumObjectSettings: {
            shared: true
          },
          epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
          // TODO: checkmode?
        });
        const epSdkEnumTask_ExecuteReturn: IEpSdkEnumTask_ExecuteReturn = await this.executeTask({
          epSdkTask: epSdkEnumTask,
          expectNoAction: checkmode
        });
        const enumObject: Enum = epSdkEnumTask_ExecuteReturn.epObject;
        if(enumObject.id === undefined) throw new CliEPApiContentError(logName, 'enumObject.id === undefined', {
          enumObject: enumObject,
        });

        CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_ENUM, details: {
          epSdkEnumTask_ExecuteReturn: epSdkEnumTask_ExecuteReturn
        }}));
        CliRunSummary.processedEnum({ epSdkEnumTask_ExecuteReturn: epSdkEnumTask_ExecuteReturn });

        // present the enum version
        const xvoid: void = await this.run_present_enum_version({
          applicationDomainId: applicationDomainId,
          enumObject: enumObject,
          specVersion: specVersion,
          epAsyncApiChannelParameterDocument: epAsyncApiChannelParameterDocument,
          checkmode: checkmode
        });
      }
      CliRunContext.pop();
    }
  }

  private run_present_channel = async({ applicationDomainId, epAsyncApiChannelDocument, specVersion, checkmode }:{
    applicationDomainId: string;
    epAsyncApiChannelDocument: EpAsyncApiChannelDocument;
    specVersion: string;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_channel';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    const channelTopic: string = epAsyncApiChannelDocument.getAsyncApiChannelKey();
    const epEventName: string = epAsyncApiChannelDocument.getEpEventName();

    const rctxt: ICliApiRunContext_Channel = {
      channelTopic: channelTopic,
      epEventName: epEventName
    };
    CliRunContext.push(rctxt);
    CliRunSummary.processingApiChannel({ cliRunSummary_ApiChannel: {
      type: ECliRunSummary_Type.ApiChannel,
      channelTopic: channelTopic,
    }});
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL, details: {
      epAsyncApiChannelDocument: epAsyncApiChannelDocument,
    }}));

    let xvoid: void;

    // present channel parameters
    xvoid = await this.run_present_channel_parameters({
      applicationDomainId: applicationDomainId,
      epAsyncApiChannelParameterDocumentMap: epAsyncApiChannelDocument.getEpAsyncApiChannelParameterDocumentMap(),
      specVersion: specVersion,
      checkmode: checkmode,
    });
    // publish operations
    const epAsynApiChannelPublishOperation: EpAsynApiChannelPublishOperation | undefined = epAsyncApiChannelDocument.getEpAsyncApiChannelPublishOperation();
    if(epAsynApiChannelPublishOperation !== undefined) {

      const rctxt: ICliApiRunContext_Channel_Operation = {
        type: ECliChannelOperation.Publish,
      };
      CliRunContext.push(rctxt);  
      CliRunSummary.processingApiChannelOperation({ cliRunSummary_ApiChannel_Operation: {
        type: ECliRunSummary_Type.ApiChannelOperation,
        operationType: ECliChannelOperationType.PUBLISH
      }});
      CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_PUBLISH_OPERATION, details: {
      }}));
  
      const epAsyncApiMessageDocument: EpAsyncApiMessageDocument = epAsynApiChannelPublishOperation.getEpAsyncApiMessageDocument();

      // present message
      const schemaVersionObject: SchemaVersion = await this.run_present_channel_message({
        applicationDomainId: applicationDomainId,
        epAsyncApiMessageDocument: epAsyncApiMessageDocument,
        specVersion: specVersion,
        checkmode: checkmode
      });
      if(schemaVersionObject.id === undefined) throw new CliEPApiContentError(logName, 'schemaVersionObject.id === undefined', {
        schemaVersionObject: schemaVersionObject,
      });
      // present event
      xvoid = await this.run_present_channel_event({
        applicationDomainId: applicationDomainId,
        epAsyncApiChannelDocument: epAsyncApiChannelDocument,
        epAsyncApiMessageDocument: epAsyncApiMessageDocument,
        specVersion: specVersion,
        schemaVersionId: schemaVersionObject.id,
        checkmode: checkmode
      });
      CliRunContext.pop();  
    }

    const epAsyncApiChannelSubscribeOperation: EpAsyncApiChannelSubscribeOperation | undefined = epAsyncApiChannelDocument.getEpAsyncApiChannelSubscribeOperation();
    if(epAsyncApiChannelSubscribeOperation !== undefined) {

      const rctxt: ICliApiRunContext_Channel_Operation = {
        type: ECliChannelOperation.Subscribe
      };
      CliRunContext.push(rctxt);  
      CliRunSummary.processingApiChannelOperation({ cliRunSummary_ApiChannel_Operation: {
        type: ECliRunSummary_Type.ApiChannelOperation,
        operationType: ECliChannelOperationType.SUBSCRIBE
      }});
      CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_API_CHANNEL_SUBSCRIBE_OPERATION, details: {
      }}));

      const epAsyncApiMessageDocument: EpAsyncApiMessageDocument = epAsyncApiChannelSubscribeOperation.getEpAsyncApiMessageDocument();

      // present message
      const schemaVersionObject: SchemaVersion = await this.run_present_channel_message({
        applicationDomainId: applicationDomainId,
        epAsyncApiMessageDocument: epAsyncApiMessageDocument,
        specVersion: specVersion,
        checkmode: checkmode
      });
      if(schemaVersionObject.id === undefined) throw new CliEPApiContentError(logName, 'schemaVersionObject.id === undefined', {
        schemaVersionObject: schemaVersionObject,
      })
      // present event
      xvoid = await this.run_present_channel_event({
        applicationDomainId: applicationDomainId,
        epAsyncApiChannelDocument: epAsyncApiChannelDocument,
        epAsyncApiMessageDocument: epAsyncApiMessageDocument,
        specVersion: specVersion,
        schemaVersionId: schemaVersionObject.id,
        checkmode: checkmode
      });
      CliRunContext.pop();
    }
    CliRunContext.pop();
  }

  protected generate_asset_ouput = ({ cliImporterGenerateAssetsOptions }:{
    cliImporterGenerateAssetsOptions: ICliAssetsImporterGenerateAssetsOptions;
  }): void => {
    const funcName = 'generate_asset_ouput';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    const epAsyncApiDocument = cliImporterGenerateAssetsOptions.epAsyncApiDocument;
    // calculate the asset output dir
    const applicationDomainNameAsFilePath: string = CliUtils.convertStringToFilePath(epAsyncApiDocument.getApplicationDomainName());
    const apiTitleAsFilePath = epAsyncApiDocument.getTitleAsFilePath();
    const assetOutputRootDir: string = CliUtils.ensureDirExists(this.get_cliAssetsImporterOptions().assetOutputDir, applicationDomainNameAsFilePath + '/' + apiTitleAsFilePath);
    const schemasOutputDir = CliUtils.ensureDirExists(assetOutputRootDir, 'schemas');

    const asyncApiSpecFileNameJson = assetOutputRootDir + "/" + epAsyncApiDocument.getTitleAsFileName("json");
    const asyncApiSpecFileNameYaml = assetOutputRootDir + "/" + epAsyncApiDocument.getTitleAsFileName("yml");

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.GENERATING_ASSETS, details: {
      asyncApiSpecFileNameJson: asyncApiSpecFileNameJson,
      asyncApiSpecFileNameYaml: asyncApiSpecFileNameYaml,
      schemasOutputDir: schemasOutputDir
    }}));

    // save specs as file
    CliUtils.saveContents2File({ 
      filePath: asyncApiSpecFileNameJson,
      content: JSON.stringify(epAsyncApiDocument.getAsSanitizedJson(), null, 2)
    });
    CliUtils.saveContents2File({ 
      filePath: asyncApiSpecFileNameYaml,
      content: epAsyncApiDocument.getAsSanitizedYamlString()
    });
    // save all channel message schemas to files
    const epAsyncApiChannelDocumentMap: T_EpAsyncApiChannelDocumentMap = epAsyncApiDocument.getEpAsyncApiChannelDocumentMap();
    for(let [topic, epAsyncApiChannelDocument] of epAsyncApiChannelDocumentMap) {
      const epAsynApiChannelPublishOperation: EpAsynApiChannelPublishOperation | undefined = epAsyncApiChannelDocument.getEpAsyncApiChannelPublishOperation();
      if(epAsynApiChannelPublishOperation !== undefined) {
        const epAsyncApiMessageDocument: EpAsyncApiMessageDocument = epAsynApiChannelPublishOperation.getEpAsyncApiMessageDocument();
        if(epAsyncApiMessageDocument.getContentType() !== E_EpAsyncApiContentTypes.APPLICATION_JSON) throw new CliAsyncApiSpecFeatureNotSupportedError(logName, "unsupported message schema content type", {
          messageName: epAsyncApiMessageDocument.getMessageName(),
          contentType: CliUtils.map_MessageDocumentContentType_To_EpSchemaContentType(epAsyncApiMessageDocument.getContentType()),
          supportedContentTypes: epAsyncApiDocument.getSupportedContentTypes()
        });

        const schemaFilePath = schemasOutputDir + "/" + CliUtils.convertStringToFilePath(epAsyncApiMessageDocument.getSchemaFileName());
        CliUtils.saveContents2File({ 
          filePath: schemaFilePath,
          content: JSON.stringify(epAsyncApiMessageDocument.getSchemaAsSanitizedJson(), null, 2)
        });
    
      }
      const epAsyncApiChannelSubscribeOperation: EpAsyncApiChannelSubscribeOperation | undefined = epAsyncApiChannelDocument.getEpAsyncApiChannelSubscribeOperation();
      if(epAsyncApiChannelSubscribeOperation !== undefined) {
        const epAsyncApiMessageDocument: EpAsyncApiMessageDocument = epAsyncApiChannelSubscribeOperation.getEpAsyncApiMessageDocument();
        if(epAsyncApiMessageDocument.getContentType() !== E_EpAsyncApiContentTypes.APPLICATION_JSON) throw new CliAsyncApiSpecFeatureNotSupportedError(logName, "unsupported message schema content type", {
          messageName: epAsyncApiMessageDocument.getMessageName(),
          contentType: CliUtils.map_MessageDocumentContentType_To_EpSchemaContentType(epAsyncApiMessageDocument.getContentType()),
          supportedContentTypes: epAsyncApiDocument.getSupportedContentTypes()
        });

        const schemaFilePath = schemasOutputDir + "/" + CliUtils.convertStringToFilePath(epAsyncApiMessageDocument.getSchemaFileName());
        CliUtils.saveContents2File({ 
          filePath: schemaFilePath,
          content: JSON.stringify(epAsyncApiMessageDocument.getSchemaAsSanitizedJson(), null, 2)
        });    
      }
    }
  }

  protected async run_present({ cliImporterRunPresentOptions }:{
    cliImporterRunPresentOptions: ICliAssetsImporterRunPresentOptions;
  }): Promise<ICliAssetsImporterRunPresentReturn> {
    const funcName = 'run_present';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_API_ASSETS, details: {
      cliImporterRunPresentOptions: cliImporterRunPresentOptions
    }}));

    // use for type validation when calling async functions
    let xvoid: void;
    
    // application domain present
    const applicationDomainsTask = new EpSdkApplicationDomainTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainName: cliImporterRunPresentOptions.epAsyncApiDocument.getApplicationDomainName(),
      applicationDomainSettings: {
        // description: "a new description x"
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: cliImporterRunPresentOptions.checkmode
    });
    const epSdkApplicationDomainTask_ExecuteReturn: IEpSdkApplicationDomainTask_ExecuteReturn = await this.executeTask({
      epSdkTask: applicationDomainsTask,
      expectNoAction: cliImporterRunPresentOptions.checkmode
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_APPLICATION_DOMAIN, message: 'application domain', details: {
      epSdkApplicationDomainTask_ExecuteReturn: epSdkApplicationDomainTask_ExecuteReturn
    }}));
    // create summary log
    CliRunSummary.processedApplicationDomain({ epSdkApplicationDomainTask_ExecuteReturn: epSdkApplicationDomainTask_ExecuteReturn });

    // we need the id in subsequent calls
    if(epSdkApplicationDomainTask_ExecuteReturn.epObject.id === undefined) throw new CliEPApiContentError(logName, 'epSdkApplicationDomainTask_ExecuteReturn.epObject.id === undefined', {
      applicationDomainObject: epSdkApplicationDomainTask_ExecuteReturn.epObject,
    });
    // const applicationDomainId: string = epSdkApplicationDomainTask_ExecuteReturn.epObject.id;
    const cliAssetsImporterRunPresentReturn: ICliAssetsImporterRunPresentReturn = {
      applicationDomainId: epSdkApplicationDomainTask_ExecuteReturn.epObject.id
    };

    // present all channels
    const epAsyncApiChannelDocumentMap: T_EpAsyncApiChannelDocumentMap = cliImporterRunPresentOptions.epAsyncApiDocument.getEpAsyncApiChannelDocumentMap();
    for(let [topic, epAsyncApiChannelDocument] of epAsyncApiChannelDocumentMap) {
      // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
      //   topic: topic,
      //   channelDocument: channelDocument
      // }}));
      xvoid = await this.run_present_channel({
        applicationDomainId: cliAssetsImporterRunPresentReturn.applicationDomainId,
        epAsyncApiChannelDocument: epAsyncApiChannelDocument,
        specVersion: cliImporterRunPresentOptions.epAsyncApiDocument.getVersion(),
        checkmode: cliImporterRunPresentOptions.checkmode
      });
    }
    // throw new Error(`${logName}: test error handling in test_mode`);
    return cliAssetsImporterRunPresentReturn;
  }

  protected async run({ cliImporterRunOptions }:{
    cliImporterRunOptions: ICliAssetsImporterRunOptions;    
  }): Promise<ICliAssetsImporterRunReturn> {
    const funcName = 'run';
    const logName = `${CliAssetsImporter.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_API_ASSETS, details: {
      cliImporterRunOptions: cliImporterRunOptions
    }}));

    const cliAssetsImporterRunReturn: ICliAssetsImporterRunReturn = {
      applicationDomainName: undefined,
      error: undefined
    };

    try {

      const epAsyncApiDocument: EpAsyncApiDocument = await CliAsyncApiDocumentService.parse_and_validate({
        apiFile: cliImporterRunOptions.apiFile,
        applicationDomainName: cliImporterRunOptions.applicationDomainName,
        applicationDomainNamePrefix: cliImporterRunOptions.applicationDomainNamePrefix
      });
      cliAssetsImporterRunReturn.applicationDomainName = epAsyncApiDocument.getApplicationDomainName();
      const cliAssetsImporterRunPresentReturn: ICliAssetsImporterRunPresentReturn = await this.run_present({ cliImporterRunPresentOptions: {
          epAsyncApiDocument: epAsyncApiDocument,
          checkmode: cliImporterRunOptions.checkmode  
      }});

      this.generate_asset_ouput({ cliImporterGenerateAssetsOptions: {
          epAsyncApiDocument: epAsyncApiDocument,
      }});

      CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_API, details: {}}));

    } catch(e: any) {
      cliAssetsImporterRunReturn.error = CliErrorFactory.createCliError({
        logName: logName,
        e: e
      });
      // if(e instanceof CliError) {
      //   cliAsyncApiFileImporterRunReturn.error = e;
      // } else if(e instanceof EpAsyncApiError) {
      //   cliAsyncApiFileImporterRunReturn.error = new CliErrorFromEpAsyncApiError(logName, e);
      // } else if(e instanceof EpSdkError) {
      //   cliAsyncApiFileImporterRunReturn.error = new CliErrorFromEpSdkError(logName, e);
      // } else if(e instanceof ApiError) {
      //   cliAsyncApiFileImporterRunReturn.error = new CliErrorFromEPApiError(logName, e);
      // } else if(e instanceof ParserError) {
      //   cliAsyncApiFileImporterRunReturn.error = new CliAsyncApiParserError(logName, e);
      // } else {
      //   cliAsyncApiFileImporterRunReturn.error = new CliErrorFromError(logName, e);
      // }
    } finally {
      if(cliAssetsImporterRunReturn.error !== undefined) {
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR_API_ASSETS, details: {
          error: cliAssetsImporterRunReturn.error
        }}));  
      }
      return cliAssetsImporterRunReturn;
    }

  }

}

