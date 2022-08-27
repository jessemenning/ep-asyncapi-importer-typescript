
import { EpAsyncApiDocument } from '@solace-labs/ep-asyncapi';
import { 
  eventApiVersion as EventApiVersion 
} from '@solace-labs/ep-openapi-node';
import { 
  EEpSdkTask_Action,
  EEpSdkTask_TargetState, 
  EEpSdk_VersionTaskStrategy, 
  EpSdkEventApiTask, 
  EpSdkEventApiVersionsService, 
  EpSdkEventApiVersionTask, 
  IEpSdkEventApiTask_ExecuteReturn, 
  IEpSdkEventApiVersionTask_ExecuteReturn
} from '@solace-labs/ep-sdk';
import { 
  CliAssetsImporter, 
  ICliAssetsImporterGenerateAssetsOptions, 
  ICliAssetsImporterOptions, 
  ICliAssetsImporterRunOptions, 
  ICliAssetsImporterRunPresentOptions,
  ICliAssetsImporterRunPresentReturn,
  ICliAssetsImporterRunReturn
} from './CliAssetsImporter';
import { CliEPApiContentError, CliInternalCodeInconsistencyError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliRunContext, { ECliRunContext_RunMode, ICliApiRunContext } from '../CliRunContext';
import CliRunSummary, { ECliRunSummary_Type } from '../CliRunSummary';
import CliAsyncApiDocumentService, { ICliPubSubEventVersionIds } from '../services/CliAsyncApiDocumentService';

export interface ICliEventApiImporterOptions extends ICliAssetsImporterOptions {
}
export interface ICliEventApiImporterGenerateAssetsOptions extends ICliAssetsImporterGenerateAssetsOptions {
}
export interface ICliEventApiImporterRunPresentOptions extends ICliAssetsImporterRunPresentOptions {
}
export interface ICliEventApiImporterRunPresentReturn extends ICliAssetsImporterRunPresentReturn {
}
export interface ICliEventApiImporterRunOptions extends ICliAssetsImporterRunOptions {
}
export interface ICliEventApiImporterRunReturn extends ICliAssetsImporterRunReturn {
}

export class CliEventApiImporter extends CliAssetsImporter {

  constructor(cliEventApiImporterOptions: ICliEventApiImporterOptions) { 
    super(cliEventApiImporterOptions);
  }

  private run_present_event_api_version = async({ applicationDomainId, eventApiId, epAsyncApiDocument, checkmode }:{
    applicationDomainId: string;
    eventApiId: string;
    epAsyncApiDocument: EpAsyncApiDocument;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_event_api_version';
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    // get latest version as reference
    const latestExistingEventApiVersionObjectBefore: EventApiVersion | undefined = await EpSdkEventApiVersionsService.getLatestVersionForEventApiName({ 
      applicationDomainId: applicationDomainId,
      eventApiName: epAsyncApiDocument.getTitle()
    });
    const latestExistingEventApiVersionString: string | undefined = latestExistingEventApiVersionObjectBefore?.version;
    // get the list of pub and sub events
    const cliPubSubEventVersionIds: ICliPubSubEventVersionIds = await CliAsyncApiDocumentService.get_pub_sub_event_version_ids({
      applicationDomainId: applicationDomainId,
      epAsyncApiDocument: epAsyncApiDocument
    });
    // const rctxtVersion: ICliAsyncApiRunContext_EventApiVersion = {
    //   epTargetEventApiVersion: epAsyncApiDocument.getVersion(),
    //   epLatestExistingEventApiVersion: latestExistingEventApiVersionString
    // };
    // CliRunContext.updateContext({ runContext: rctxtVersion });

    // because of exact version, test first and add to summary
    const epSdkEventApiVersionTask_Check = new EpSdkEventApiVersionTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventApiId: eventApiId,
      versionString: epAsyncApiDocument.getVersion(),
      versionStrategy: EEpSdk_VersionTaskStrategy.EXACT_VERSION,
      eventApiVersionSettings: {
        description: epAsyncApiDocument.getDescription(),
        displayName: epAsyncApiDocument.getTitle(),
        producedEventVersionIds: (cliPubSubEventVersionIds.publishEventVersionIdList as unknown) as EventApiVersion.producedEventVersionIds,
        consumedEventVersionIds: (cliPubSubEventVersionIds.subscribeEventVersionIdList as unknown) as EventApiVersion.consumedEventVersionIds,
        stateId: this.get_EpSdkTask_StateId(),
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: true
    });
    const epSdkEventApiVersionTask_ExecuteReturn_Check: IEpSdkEventApiVersionTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkEventApiVersionTask_Check,
      expectNoAction: false
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT_API_VERSION_CHECK, details: {
      epSdkEventApiVersionTask_ExecuteReturn_Check: epSdkEventApiVersionTask_ExecuteReturn_Check
    }}));
    CliRunSummary.processingStartEventApiVersion({
      latestExistingEventApiVersionObjectBefore: latestExistingEventApiVersionObjectBefore,
      exactTargetVersion: epAsyncApiDocument.getVersion(),
      epSdkEventApiVersionTask_ExecuteReturn_Check: epSdkEventApiVersionTask_ExecuteReturn_Check
    });
    // different strategies for release mode and test mode
    if(
      CliRunContext.get().runMode === ECliRunContext_RunMode.RELEASE &&
      epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action === EEpSdkTask_Action.WOULD_FAIL_CREATE_NEW_VERSION_ON_EXACT_VERSION_REQUIREMENT      
    ) {      
      if(latestExistingEventApiVersionObjectBefore === undefined) throw new CliInternalCodeInconsistencyError(logName, {
        message: "latestExistingEventApiVersionObjectBefore === undefined",
        applicationDomainId: applicationDomainId,
        applicationName: epAsyncApiDocument.getTitle()
      });

      // create a new event api version and issue warning
      const epSdkEventApiVersionTask = new EpSdkEventApiVersionTask({
        epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
        applicationDomainId: applicationDomainId,
        eventApiId: eventApiId,
        versionString: epAsyncApiDocument.getVersion(),
        versionStrategy: EEpSdk_VersionTaskStrategy.BUMP_PATCH,
        eventApiVersionSettings: {
          description: epAsyncApiDocument.getDescription(),
          displayName: epAsyncApiDocument.getTitle(),
          producedEventVersionIds: (cliPubSubEventVersionIds.publishEventVersionIdList as unknown) as EventApiVersion.producedEventVersionIds,
          consumedEventVersionIds: (cliPubSubEventVersionIds.subscribeEventVersionIdList as unknown) as EventApiVersion.consumedEventVersionIds,
          // stateId: CliEPStatesService.getTargetLifecycleState({cliAssetImport_TargetLifecycleState: ECliAssetImport_TargetLifecycleState.DRAFT }),
          // still create it in requested state
          stateId: this.get_EpSdkTask_StateId(),
        },
        epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
        checkmode: checkmode
      });
      const epSdkEventApiVersionTask_ExecuteReturn: IEpSdkEventApiVersionTask_ExecuteReturn = await this.executeTask({
        epSdkTask: epSdkEventApiVersionTask,
        expectNoAction: checkmode
      });
      CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT_API_WITH_WARNING, details: {
        warning: [
          `expect epSdkTask_TransactionLogData.epSdkTask_Action = '${EEpSdkTask_Action.NO_ACTION}', instead got '${epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action}'`,
          `created new event api version`          
        ],
        targetEventApiVersion: epAsyncApiDocument.getVersion(),
        createdEventApiVersion: epSdkEventApiVersionTask_ExecuteReturn.epObject.version ? epSdkEventApiVersionTask_ExecuteReturn.epObject.version : 'undefined',
        epSdkEventApiVersionTask_ExecuteReturn: epSdkEventApiVersionTask_ExecuteReturn
      }}));
      // summary
      CliRunSummary.processedEventApiVersionWithWarning({ 
        targetEventApiVersion: epAsyncApiDocument.getVersion(),
        targetEventApiState: this.get_EpSdkTask_StateId(),
        latestExistingEventApiVersionObjectBefore: latestExistingEventApiVersionObjectBefore, 
        epSdkEventApiVersionTask_ExecuteReturn: epSdkEventApiVersionTask_ExecuteReturn 
      });
    } else {
      // create the target version in release state as intended
      const epSdkEventApiVersionTask = new EpSdkEventApiVersionTask({
        epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
        applicationDomainId: applicationDomainId,
        eventApiId: eventApiId,
        versionString: epAsyncApiDocument.getVersion(),
        versionStrategy: EEpSdk_VersionTaskStrategy.EXACT_VERSION,
        eventApiVersionSettings: {
          description: epAsyncApiDocument.getDescription(),
          displayName: epAsyncApiDocument.getTitle(),
          producedEventVersionIds: (cliPubSubEventVersionIds.publishEventVersionIdList as unknown) as EventApiVersion.producedEventVersionIds,
          consumedEventVersionIds: (cliPubSubEventVersionIds.subscribeEventVersionIdList as unknown) as EventApiVersion.consumedEventVersionIds,
          stateId: this.get_EpSdkTask_StateId(),
        },
        epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
        checkmode: checkmode
      });
      const epSdkEventApiVersionTask_ExecuteReturn: IEpSdkEventApiVersionTask_ExecuteReturn = await this.executeTask({
        epSdkTask: epSdkEventApiVersionTask,
        expectNoAction: checkmode
      });
      CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT_API, details: {
        epSdkEventApiVersionTask_ExecuteReturn: epSdkEventApiVersionTask_ExecuteReturn
      }}));
      // summary
      CliRunSummary.processedEventApiVersion({ epSdkEventApiVersionTask_ExecuteReturn: epSdkEventApiVersionTask_ExecuteReturn });
    }
  }

  private run_present_event_api = async({ applicationDomainId, epAsyncApiDocument, checkmode }:{
    applicationDomainId: string;
    epAsyncApiDocument: EpAsyncApiDocument;
    checkmode: boolean;
  }): Promise<void> => {
    const funcName = 'run_present_event_api';
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_API, details: {
    }}));

    // present event api
    const epSdkEventApiTask = new EpSdkEventApiTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventApiName: epAsyncApiDocument.getTitle(),
      eventApiObjectSettings: {
        shared: true,
      },
      epSdkTask_TransactionConfig: this.get_IEpSdkTask_TransactionConfig(),
      checkmode: checkmode
    });
    const epSdkEventApiTask_ExecuteReturn: IEpSdkEventApiTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkEventApiTask,
      expectNoAction: checkmode
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT_API, details: {
      epSdkEventApiTask_ExecuteReturn: epSdkEventApiTask_ExecuteReturn
    }}));
    if(epSdkEventApiTask_ExecuteReturn.epObject.id === undefined) throw new CliEPApiContentError(logName, 'epSdkEventApiTask_ExecuteReturn.epObject.id === undefined', {
      epSdkEventApiTask_ExecuteReturn: epSdkEventApiTask_ExecuteReturn
    });
    const eventApiId: string = epSdkEventApiTask_ExecuteReturn.epObject.id;

    await this.run_present_event_api_version({
      applicationDomainId: applicationDomainId,
      eventApiId: eventApiId,
      epAsyncApiDocument: epAsyncApiDocument,
      checkmode: checkmode,
    });

  }

  protected async run_present({ cliImporterRunPresentOptions }:{
    cliImporterRunPresentOptions: ICliEventApiImporterRunPresentOptions;
  }): Promise<ICliEventApiImporterRunPresentReturn> {
    const funcName = 'run_present';
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    const apiTitle: string = cliImporterRunPresentOptions.epAsyncApiDocument.getTitle();
    const apiVersion: string = cliImporterRunPresentOptions.epAsyncApiDocument.getVersion();
    const epApplicationDomainName: string = cliImporterRunPresentOptions.epAsyncApiDocument.getApplicationDomainName();

    const rctxt: ICliApiRunContext = {
      apiTitle: apiTitle,
      apiVersion: apiVersion,
      applicationDomainName: epApplicationDomainName
    };
    CliRunContext.push(rctxt);
    CliRunSummary.processingApi({ cliRunSummary_Api: {
      type: ECliRunSummary_Type.Api,
      apiName: apiTitle,
      apiVersion: apiVersion,
      applicationDomainName: epApplicationDomainName,
    }});

    let xvoid: void;

    const cliAssetsImporterRunPresentReturn: ICliAssetsImporterRunPresentReturn = await super.run_present({ cliImporterRunPresentOptions: cliImporterRunPresentOptions });

    // present event api
    xvoid = await this.run_present_event_api({
      applicationDomainId: cliAssetsImporterRunPresentReturn.applicationDomainId,
      epAsyncApiDocument:cliImporterRunPresentOptions.epAsyncApiDocument,
      checkmode: cliImporterRunPresentOptions.checkmode
    }); 

    CliRunContext.pop();
    return cliAssetsImporterRunPresentReturn;
  }

  public async run({ cliImporterRunOptions }:{
    cliImporterRunOptions: ICliEventApiImporterRunOptions;    
  }): Promise<ICliEventApiImporterRunReturn> {
    const funcName = 'run';
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_API, details: {
      cliImporterRunOptions: cliImporterRunOptions
    }}));

    const cliAssetsImporterRunReturn: ICliAssetsImporterRunReturn = await super.run({ cliImporterRunOptions: cliImporterRunOptions });
    
    if(cliAssetsImporterRunReturn.error === undefined) CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_API, details: {}}));

    return cliAssetsImporterRunReturn;

  }

}

