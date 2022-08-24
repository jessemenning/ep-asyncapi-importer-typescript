
import { EpAsyncApiDocument, T_EpAsyncApiEventNames } from '@solace-labs/ep-asyncapi';
import { 
  EventVersion, 
  eventApiVersion as EventApiVersion 
} from '@solace-labs/ep-openapi-node';
import { 
  EEpSdkTask_Action,
  EEpSdkTask_TargetState, 
  EEpSdk_VersionTaskStrategy, 
  EpSdkEpEventVersionsService, 
  EpSdkEventApiTask, 
  EpSdkEventApiVersionsService, 
  EpSdkEventApiVersionTask, 
  IEpSdkEventApiTask_ExecuteReturn, 
  IEpSdkEventApiVersionTask_ExecuteReturn
} from '@solace-labs/ep-sdk';
import { 
  CliAsyncApiFileImporter, 
  ICliAsyncApiFileImporterOptions, 
  ICliAsyncApiFileImporterRunPresentReturn, 
  ICliAsyncApiFileImporterRunReturn 
} from './CliAsyncApiFileImporter';
import { CliEPApiContentError, CliError, CliImporterError, CliImporterTestRunAssetsInconsistencyError } from './CliError';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import CliRunContext, { ECliRunContext_RunMode, ICliAsyncApiRunContext_EventApi, ICliAsyncApiRunContext_EventApiVersion } from './CliRunContext';
import CliRunSummary from './CliRunSummary';
import CliEPStatesService, { ECliAssetImport_TargetLifecycleState } from './services/CliEPStatesService';

export interface ICliEventApiImporterOptions extends ICliAsyncApiFileImporterOptions {
}

export interface ICliEventApiImporterRunReturn extends ICliAsyncApiFileImporterRunReturn {
}
export interface ICliEventApiImporterRunPresentReturn extends ICliAsyncApiFileImporterRunPresentReturn {
}

interface ICliPubSubEventVersionIds {
  publishEventVersionIdList: Array<string>;
  subscribeEventVersionIdList: Array<string>;
}

export class CliEventApiImporter extends CliAsyncApiFileImporter {

  constructor(cliEventApiImporterOptions: ICliEventApiImporterOptions) { 
    super(cliEventApiImporterOptions);
  }

  private get_pub_sub_event_version_ids = async({ applicationDomainId, epAsyncApiDocument }:{
    applicationDomainId: string;
    epAsyncApiDocument: EpAsyncApiDocument;
  }): Promise<ICliPubSubEventVersionIds> => {
    const funcName = 'get_pub_sub_event_version_ids';
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    const epAsyncApiEventNames: T_EpAsyncApiEventNames = epAsyncApiDocument.getEpAsyncApiEventNames();
    const publishEventVersionIdList: Array<string> = [];    
    for(const publishEventName of epAsyncApiEventNames.publishEventNames) {
      const eventVersion: EventVersion | undefined = await EpSdkEpEventVersionsService.getLatestVersionForEventName({
        eventName: publishEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {});
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      publishEventVersionIdList.push(eventVersion.id,);
    }
    const subscribeEventVersionIdList: Array<string> = [];
    for(const subscribeEventName of epAsyncApiEventNames.subscribeEventNames) {
      const eventVersion: EventVersion | undefined = await EpSdkEpEventVersionsService.getLatestVersionForEventName({
        eventName: subscribeEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {});
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      subscribeEventVersionIdList.push(eventVersion.id);
    }
    return {
      publishEventVersionIdList: publishEventVersionIdList,
      subscribeEventVersionIdList: subscribeEventVersionIdList,
    };
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
    // get the list of pub and sub events
    const cliPubSubEventVersionIds: ICliPubSubEventVersionIds = await this.get_pub_sub_event_version_ids({
      applicationDomainId: applicationDomainId,
      epAsyncApiDocument: epAsyncApiDocument
    });
    const rctxtVersion: ICliAsyncApiRunContext_EventApiVersion = {
      epTargetEventApiVersion: epAsyncApiDocument.getVersion(),
    };
    CliRunContext.updateContext({ runContext: rctxtVersion });

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
        stateId: CliEPStatesService.getTargetLifecycleState({cliAssetImport_TargetLifecycleState: this.cliAsyncApiFileImporterOptions.cliAssetImport_TargetLifecycleState}),
      },
      epSdkTask_TransactionConfig: {
        groupTransactionId: this.cliAsyncApiFileImporterOptions.runId,
        parentTransactionId: this.apiTransactionId
      },
      checkmode: true
    });
    const epSdkEventApiVersionTask_ExecuteReturn_Check: IEpSdkEventApiVersionTask_ExecuteReturn = await this.executeTask({
      epSdkTask: epSdkEventApiVersionTask_Check,
      expectNoAction: false
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT_API_VERSION_CHECK, details: {
      epSdkEventApiVersionTask_ExecuteReturn: epSdkEventApiVersionTask_ExecuteReturn_Check
    }}));
    CliRunSummary.processingStartEventApiVersion({
      latestExistingEventApiVersionObjectBefore: latestExistingEventApiVersionObjectBefore,
      exactTargetVersion: epAsyncApiDocument.getVersion(),
      epSdkEventApiVersionTask_ExecuteReturn_Check: epSdkEventApiVersionTask_ExecuteReturn_Check
    });
    // different strategies for release mode and test mode
    if(
      CliRunContext.getContext().runMode === ECliRunContext_RunMode.RELEASE &&
      epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action === EEpSdkTask_Action.WOULD_FAIL_CREATE_NEW_VERSION_ON_EXACT_VERSION_REQUIREMENT      
    ) {      
      if(latestExistingEventApiVersionObjectBefore === undefined) throw new CliError(logName, 'latestExistingEventApiVersionObjectBefore === undefined');
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
          stateId: CliEPStatesService.getTargetLifecycleState({cliAssetImport_TargetLifecycleState: this.cliAsyncApiFileImporterOptions.cliAssetImport_TargetLifecycleState}),
        },
        epSdkTask_TransactionConfig: {
          groupTransactionId: this.cliAsyncApiFileImporterOptions.runId,
          parentTransactionId: this.apiTransactionId
        },
        checkmode: checkmode
      });
      const epSdkEventApiVersionTask_ExecuteReturn: IEpSdkEventApiVersionTask_ExecuteReturn = await this.executeTask({
        epSdkTask: epSdkEventApiVersionTask,
        expectNoAction: checkmode
      });
      CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_EP_EVENT_API_WITH_WARNING, details: {
        warning: [
          `expect epSdkTask_TransactionLogData.epSdkTask_Action = '${EEpSdkTask_Action.NO_ACTION}', instead got '${epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action}'`,
          `created new event api version in draft state`          
        ],
        targetEventApiVersion: epAsyncApiDocument.getVersion(),
        createdEventApiVersion: epSdkEventApiVersionTask_ExecuteReturn.epObject.version ? epSdkEventApiVersionTask_ExecuteReturn.epObject.version : 'undefined',
        epSdkEventApiVersionTask_ExecuteReturn: epSdkEventApiVersionTask_ExecuteReturn
      }}));
      // summary
      CliRunSummary.processedEventApiVersionWithWarning({ 
        targetEventApiVersion: epAsyncApiDocument.getVersion(),
        targetEventApiState: CliEPStatesService.getTargetLifecycleState({cliAssetImport_TargetLifecycleState: this.cliAsyncApiFileImporterOptions.cliAssetImport_TargetLifecycleState}),
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
          stateId: CliEPStatesService.getTargetLifecycleState({cliAssetImport_TargetLifecycleState: this.cliAsyncApiFileImporterOptions.cliAssetImport_TargetLifecycleState}),
        },
        epSdkTask_TransactionConfig: {
          groupTransactionId: this.cliAsyncApiFileImporterOptions.runId,
          parentTransactionId: this.apiTransactionId
        },
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

    const eventApiName: string = epAsyncApiDocument.getTitle();

    const rctxt: ICliAsyncApiRunContext_EventApi = {
      epEventApiName: eventApiName ? eventApiName : 'undefined'
    };
    CliRunContext.updateContext({ runContext: rctxt });
    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_API, details: {
    }}));

    // present event api
    const epSdkEventApiTask = new EpSdkEventApiTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventApiName: eventApiName,
      eventApiObjectSettings: {
        shared: true,
      },
      epSdkTask_TransactionConfig: {
        groupTransactionId: this.cliAsyncApiFileImporterOptions.runId,
        parentTransactionId: this.apiTransactionId
      },
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

  protected async run_present({ epAsyncApiDocument, checkmode }:{
    epAsyncApiDocument: EpAsyncApiDocument;
    checkmode: boolean;
  }): Promise<ICliEventApiImporterRunPresentReturn> {
    const funcName = 'run_present';
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    let xvoid: void;

    const cliAsyncApiFileImporterRunPresentReturn: ICliAsyncApiFileImporterRunPresentReturn = await super.run_present({ 
      epAsyncApiDocument: epAsyncApiDocument,
      checkmode: checkmode
    });

    // present event api
    xvoid = await this.run_present_event_api({
      applicationDomainId: cliAsyncApiFileImporterRunPresentReturn.applicationDomainId,
      epAsyncApiDocument: epAsyncApiDocument,
      checkmode: checkmode
    }); 

        // // generate the output for all assets
    // this.generate_asset_ouput({
    //   epAsyncApiDocument: epAsyncApiDocument,
    //   filePath: this.cliAppConfig.asyncApiFileName,
    //   appConfig: this.cliAppConfig,
    // });

    return cliAsyncApiFileImporterRunPresentReturn;
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
    const logName = `${CliEventApiImporter.name}.${funcName}()`;

    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_API, details: {
      applicationDomainName: applicationDomainName,
      applicationDomainNamePrefix: applicationDomainNamePrefix,
      checkmode: checkmode  
    }}));

    const cliAsyncApiFileImporterRunReturn: ICliAsyncApiFileImporterRunReturn = await super.run({ 
      apiFile: apiFile,
      applicationDomainName: applicationDomainName,
      applicationDomainNamePrefix: applicationDomainNamePrefix,
      checkmode: checkmode,
    });
    
    if(cliAsyncApiFileImporterRunReturn.error === undefined) CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_DONE_API, details: {}}));

    return cliAsyncApiFileImporterRunReturn;

  }

}

