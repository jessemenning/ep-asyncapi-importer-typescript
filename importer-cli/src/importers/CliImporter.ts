import { 
  EpAsyncApiDocument, 
} from '@solace-labs/ep-asyncapi';
import { 
  EEpSdkTask_Action,
  EEpSdk_VersionTaskStrategy, 
  EpSdkTask,
  IEpSdkTask_ExecuteReturn,
  IEpSdkTask_TransactionConfig,
} from '@solace-labs/ep-sdk';
import { 
  CliImporterTestRunAssetsInconsistencyError,
  CliInternalCodeInconsistencyError,
  CliAbstractMethodError
} from '../CliError';
import { CliUtils } from '../CliUtils';
import CliEPStatesService, { ECliAssetImport_TargetLifecycleState } from '../services/CliEPStatesService';

export enum ECliAssetImport_TargetVersionStrategy {
  BUMP_PATCH = EEpSdk_VersionTaskStrategy.BUMP_PATCH,
  BUMP_MINOR = EEpSdk_VersionTaskStrategy.BUMP_MINOR,
}

export interface ICliImporterOptions {
  runId: string;
  assetOutputDir: string;
  cliAssetImport_TargetLifecycleState: ECliAssetImport_TargetLifecycleState;
  cliAssetImport_TargetVersionStrategy: ECliAssetImport_TargetVersionStrategy;
}
export interface ICliImporterGenerateAssetsOptions {
}
export interface ICliImporterRunPresentOptions {
  checkmode: boolean;
}
export interface ICliImporterRunPresentReturn {
  applicationDomainId: string;
}
export interface ICliImporterRunOptions {
  apiFile: string;
  applicationDomainName: string | undefined;
  applicationDomainNamePrefix: string | undefined;
  checkmode: boolean;
}
export interface ICliImporterRunReturn {
  applicationDomainName: string | undefined;
  error: any;
}

export abstract class CliImporter {
  protected cliImporterOptions: ICliImporterOptions;
  protected importerTransactionId: string;

  constructor(cliImporterOptions: ICliImporterOptions) { 
    this.cliImporterOptions = cliImporterOptions;
    this.importerTransactionId = CliUtils.getUUID();
  }

  protected get_EpSdkTask_StateId = (): string => {
    return CliEPStatesService.getTargetLifecycleState({cliAssetImport_TargetLifecycleState: this.cliImporterOptions.cliAssetImport_TargetLifecycleState });
  }
  protected get_EEpSdk_VersionTaskStrategy = (): EEpSdk_VersionTaskStrategy => {
    const funcName = 'get_EEpSdk_VersionTaskStrategy';
    const logName = `${CliImporter.name}.${funcName}()`;
    switch(this.cliImporterOptions.cliAssetImport_TargetVersionStrategy) {
      case ECliAssetImport_TargetVersionStrategy.BUMP_PATCH:
        return EEpSdk_VersionTaskStrategy.BUMP_PATCH;
      case ECliAssetImport_TargetVersionStrategy.BUMP_MINOR:
        return EEpSdk_VersionTaskStrategy.BUMP_MINOR;
      default:
        throw new CliInternalCodeInconsistencyError(logName, { cliAssetImport_TargetVersionStrategy: this.cliImporterOptions.cliAssetImport_TargetVersionStrategy });
    }
  }

  protected get_IEpSdkTask_TransactionConfig = (): IEpSdkTask_TransactionConfig => {
    return {
      groupTransactionId: this.cliImporterOptions.runId,
      parentTransactionId: this.importerTransactionId
    };
  }

  protected async executeTask({ epSdkTask, expectNoAction }:{
    epSdkTask: EpSdkTask;
    expectNoAction: boolean;
  }): Promise<IEpSdkTask_ExecuteReturn> {
    const funcName = 'executeTask';
    const logName = `${CliImporter.name}.${funcName}()`;

    const epSdkTask_ExecuteReturn: IEpSdkTask_ExecuteReturn = await epSdkTask.execute();

    if(expectNoAction && epSdkTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action !== EEpSdkTask_Action.NO_ACTION) {
      throw new CliImporterTestRunAssetsInconsistencyError(logName, {
        message: `expect epSdkTask_TransactionLogData.epSdkTask_Action = '${EEpSdkTask_Action.NO_ACTION}', instead got '${epSdkTask_ExecuteReturn.epSdkTask_TransactionLogData.epSdkTask_Action}'`,
        epSdkTask_TransactionLogData: epSdkTask_ExecuteReturn.epSdkTask_TransactionLogData
      });
    }
    return epSdkTask_ExecuteReturn;
  }

  protected abstract generate_asset_ouput({ cliImporterGenerateAssetsOptions }:{
    cliImporterGenerateAssetsOptions: ICliImporterGenerateAssetsOptions;
  }): void;

  protected async run_present({ cliImporterRunPresentOptions }:{
    cliImporterRunPresentOptions: ICliImporterRunPresentOptions;
  }): Promise<ICliImporterRunPresentReturn> {
    const funcName = 'run_present';
    const logName = `${CliImporter.name}.${funcName}()`;
    cliImporterRunPresentOptions;
    throw new CliAbstractMethodError(logName, this.constructor.name, funcName);
  }

  protected async run({ cliImporterRunOptions }:{
    cliImporterRunOptions: ICliImporterRunOptions;    
  }): Promise<ICliImporterRunReturn> {
    const funcName = 'run';
    const logName = `${CliImporter.name}.${funcName}()`;
    cliImporterRunOptions;
    throw new CliAbstractMethodError(logName, this.constructor.name, funcName);
  }

}

