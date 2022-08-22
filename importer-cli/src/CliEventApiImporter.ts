
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
  EpSdkEventApiVersionTask, 
  IEpSdkEventApiTask_ExecuteReturn, 
  IEpSdkEventApiVersionTask_Config, 
  IEpSdkEventApiVersionTask_ExecuteReturn
} from '@solace-labs/ep-sdk';
import { 
  CliAsyncApiFileImporter, 
  ICliAsyncApiFileImporterOptions, 
  ICliAsyncApiFileImporterRunPresentReturn, 
  ICliAsyncApiFileImporterRunReturn 
} from './CliAsyncApiFileImporter';
import { CliEPApiContentError, CliImporterError, CliImporterTestRunAssetsInconsistencyError } from './CliError';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import CliRunContext, { ECliRunContext_RunMode, ICliAsyncApiRunContext_EventApi, ICliAsyncApiRunContext_EventApiVersion } from './CliRunContext';
import CliRunSummary from './CliRunSummary';
import CliEPStatesService from './services/CliEPStatesService';

export interface ICliEventApiImporterOptions extends ICliAsyncApiFileImporterOptions {
}

export interface ICliEventApiImporterRunReturn extends ICliAsyncApiFileImporterRunReturn {
}
export interface ICliEventApiImporterRunPresentReturn extends ICliAsyncApiFileImporterRunPresentReturn {
}

export class CliEventApiImporter extends CliAsyncApiFileImporter {

  constructor(cliEventApiImporterOptions: ICliEventApiImporterOptions) { 
    super(cliEventApiImporterOptions);
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

    // create new version
    const epAsyncApiEventNames: T_EpAsyncApiEventNames = epAsyncApiDocument.getEpAsyncApiEventNames();
    const publishEventVersionIds: Array<string> = [];
    for(const publishEventName of epAsyncApiEventNames.publishEventNames) {
      const eventVersion: EventVersion | undefined = await EpSdkEpEventVersionsService.getLatestVersionForEventName({
        eventName: publishEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {});
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      publishEventVersionIds.push(eventVersion.id);
    }
    const subscribeEventVersionIds: Array<string> = [];
    for(const subscribeEventName of epAsyncApiEventNames.subscribeEventNames) {
      const eventVersion: EventVersion | undefined = await EpSdkEpEventVersionsService.getLatestVersionForEventName({
        eventName: subscribeEventName,
        applicationDomainId: applicationDomainId
      });
      if(eventVersion === undefined) throw new CliImporterError(logName, 'eventVersion === undefined', {});
      if(eventVersion.id === undefined) throw new CliEPApiContentError(logName, 'eventVersion.id === undefined', {
        eventVersion: eventVersion
      });
      subscribeEventVersionIds.push(eventVersion.id);
    }
    // present event api version
    const rctxtVersion: ICliAsyncApiRunContext_EventApiVersion = {
      epTargetEventApiVersion: epAsyncApiDocument.getVersion(),
    };
    CliRunContext.updateContext({ runContext: rctxtVersion });


    // because of exact version, test first if in release mode
    const epSdkEventApiVersionTask_Check = new EpSdkEventApiVersionTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventApiId: eventApiId,
      versionString: epAsyncApiDocument.getVersion(),
      versionStrategy: EEpSdk_VersionTaskStrategy.EXACT_VERSION,
      eventApiVersionSettings: {
        description: epAsyncApiDocument.getDescription(),
        displayName: epAsyncApiDocument.getTitle(),
        producedEventVersionIds: (publishEventVersionIds as unknown) as EventApiVersion.producedEventVersionIds,
        consumedEventVersionIds: (subscribeEventVersionIds as unknown) as EventApiVersion.consumedEventVersionIds,
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
      exactTargetVersion: epAsyncApiDocument.getVersion(),
      epSdkEventApiVersionTask_ExecuteReturn_Check: epSdkEventApiVersionTask_ExecuteReturn_Check
    });
    // in release mode only
    if(CliRunContext.getContext().runMode === ECliRunContext_RunMode.RELEASE) {
      // now check if this would fail to create a new version
      if(epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action === EEpSdkTask_Action.WOULD_FAIL_CREATE_NEW_VERSION_ON_EXACT_VERSION_REQUIREMENT) {
        // const epSdkEventApiVersionTask_Config = epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Config as IEpSdkEventApiVersionTask_Config;
        throw new CliImporterTestRunAssetsInconsistencyError(logName, {          
          message: [
            `expect epSdkTask_TransactionLogData.epSdkTask_Action = '${EEpSdkTask_Action.NO_ACTION}', instead got '${epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData.epSdkTask_Action}'`,
          ],
          note: `This may have led to inconsistencies in application domain.`,
          epSdkTask_TransactionLogData: epSdkEventApiVersionTask_ExecuteReturn_Check.epSdkTask_TransactionLogData
        });  
      }
    }

    const epSdkEventApiVersionTask = new EpSdkEventApiVersionTask({
      epSdkTask_TargetState: EEpSdkTask_TargetState.PRESENT,
      applicationDomainId: applicationDomainId,
      eventApiId: eventApiId,
      versionString: epAsyncApiDocument.getVersion(),
      versionStrategy: EEpSdk_VersionTaskStrategy.EXACT_VERSION,
      eventApiVersionSettings: {
        description: epAsyncApiDocument.getDescription(),
        displayName: epAsyncApiDocument.getTitle(),
        producedEventVersionIds: (publishEventVersionIds as unknown) as EventApiVersion.producedEventVersionIds,
        consumedEventVersionIds: (subscribeEventVersionIds as unknown) as EventApiVersion.consumedEventVersionIds,
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

