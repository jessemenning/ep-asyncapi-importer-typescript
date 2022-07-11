import { CliEPApiError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn } from "./CliTask";
import { SchemasService, SchemaVersion, SchemaVersionResponse, VersionedObjectStateChangeRequest } from "../_generated/@solace-iot-team/sep-openapi-node";
import CliEPSchemaVersionsService from "../services/CliEPSchemaVersionsService";
import isEqual from "lodash.isequal";
import CliEPStatesService from "../services/CliEPStatesService";
import CliConfig, { ECliAssetImportTargetLifecycleState_VersionStrategy } from "../CliConfig";
import CliSemVerUtils from "../CliSemVerUtils";

type TCliSchemaVersionTask_Settings = Required<Pick<SchemaVersion, "description" | "displayName" | "content" | "stateId">>;
type TCliSchemaVersionTask_CompareObject = Partial<TCliSchemaVersionTask_Settings>;

export interface ICliSchemaVersionTask_Config extends ICliTaskConfig {
  schemaId: string;
  baseVersionString: string;
  schemaVersionSettings: TCliSchemaVersionTask_Settings;
}
export interface ICliSchemaVersionTask_Keys extends ICliTaskKeys {
  schemaId: string;
}
export interface ICliSchemaVersionTask_GetFuncReturn extends ICliGetFuncReturn {
  schemaVersionObject: SchemaVersion | undefined;
}
export interface ICliSchemaVersionTask_CreateFuncReturn extends ICliCreateFuncReturn {
  schemaVersionObject: SchemaVersion;
}
export interface ICliSchemaVersionTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  schemaVersionObject: SchemaVersion;
}
export interface ICliSchemaVersionTask_ExecuteReturn extends ICliTaskExecuteReturn {
  schemaVersionObject: SchemaVersion;
}

export class CliSchemaVersionTask extends CliTask {
  private newVersionString: string;

  private readonly Empty_ICliSchemaVersionTask_GetFuncReturn: ICliSchemaVersionTask_GetFuncReturn = {
    documentExists: false,
    apiObject: undefined,
    schemaVersionObject: undefined,
  };
  private readonly Default_TCliSchemaVersionTask_Settings: Partial<TCliSchemaVersionTask_Settings> = {
    // stateId: CliEPStatesService.getTargetLifecycleState({assetImportTargetLifecycleState: CliConfig.getCliAppConfig().assetImportTargetLifecycleState}),
  }
  private getCliTaskConfig(): ICliSchemaVersionTask_Config { return this.cliTaskConfig as ICliSchemaVersionTask_Config; }
  private createObjectSettings(): Partial<SchemaVersion> {
    return {
      ...this.Default_TCliSchemaVersionTask_Settings,
      ...this.getCliTaskConfig().schemaVersionSettings,
    };
  }

  constructor(taskConfig: ICliSchemaVersionTask_Config) {
    super(taskConfig);
    this.newVersionString = taskConfig.baseVersionString;
  }

  protected getTaskKeys(): ICliSchemaVersionTask_Keys {
    return {
      schemaId: this.getCliTaskConfig().schemaId,
    };
  }

  /**
   * Get the latest schema version.
   */
  protected async getFunc(cliTaskKeys: ICliSchemaVersionTask_Keys): Promise<ICliSchemaVersionTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      params: {
        schemaId: cliTaskKeys.schemaId,
      }
    }}));

    // get the latest schema version
    const latestSchemaVersionString: string | undefined = await CliEPSchemaVersionsService.getLastestSchemaVersion({ schemaId: cliTaskKeys.schemaId });
    if(latestSchemaVersionString === undefined) return this.Empty_ICliSchemaVersionTask_GetFuncReturn;

    const schemaVersion: SchemaVersion | undefined = await CliEPSchemaVersionsService.getSchemaVersion({ 
      schemaId: cliTaskKeys.schemaId,
      schemaVersionString: latestSchemaVersionString
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      schemaVersion: schemaVersion ? schemaVersion : 'undefined'
    }}));
    if(schemaVersion === undefined) throw new CliError(logName, 'schemaVersion === undefined');

    const cliSchemaVersionTask_GetFuncReturn: ICliSchemaVersionTask_GetFuncReturn = {
      apiObject: schemaVersion,
      schemaVersionObject: schemaVersion,
      documentExists: true,
    }
    return cliSchemaVersionTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliSchemaVersionTask_GetFuncReturn; 
  }): boolean {
    const funcName = 'isUpdateRequired';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;
    if(cliGetFuncReturn.schemaVersionObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.schemaVersionObject === undefined');
    let isUpdateRequired: boolean = false;

    const existingObject: SchemaVersion = cliGetFuncReturn.schemaVersionObject;
    const existingCompareObject: TCliSchemaVersionTask_CompareObject = {
      content: existingObject.content,
      description: existingObject.description,
      displayName: existingObject.displayName,
      stateId: existingObject.stateId
    };
    const requestedCompareObject: TCliSchemaVersionTask_CompareObject = this.createObjectSettings();
    isUpdateRequired = !isEqual(existingCompareObject, requestedCompareObject);
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      existingCompareObject: existingCompareObject,
      requestedCompareObject: requestedCompareObject,
      isUpdateRequired: isUpdateRequired
    }}));
    // if(isUpdateRequired) throw new Error(`${logName}: check updates requiired`);
    return isUpdateRequired;
  }

  private async createSchemaVersion({ schemaId, schemaVersion, code, targetLifecycleStateId }:{
    schemaId: string;
    schemaVersion: SchemaVersion;
    code: ECliStatusCodes;
    targetLifecycleStateId: string;
  }): Promise<SchemaVersion> {
    const funcName = 'createSchemaVersion';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      document: schemaVersion
    }}));

    const schemaVersionResponse: SchemaVersionResponse = await SchemasService.postSchemaVersion({
      schemaId: schemaId,
      requestBody: schemaVersion
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      schemaVersionResponse: schemaVersionResponse
    }}));

    if(schemaVersionResponse.data === undefined) throw new CliEPApiError(logName, 'schemaVersionResponse.data === undefined', {
      schemaVersionResponse: schemaVersionResponse
    });
    const createdSchemaVersion: SchemaVersion = schemaVersionResponse.data;

    if(createdSchemaVersion.id === undefined || createdSchemaVersion.stateId === undefined) throw new CliEPApiError(logName, 'createdSchemaVersion.id === undefined || createdSchemaVersion.stateId === undefined', {
      createdSchemaVersion: createdSchemaVersion
    });
    // check the target lifecycle state
    if(createdSchemaVersion.stateId !== targetLifecycleStateId) {
      const versionedObjectStateChangeRequest: VersionedObjectStateChangeRequest = await SchemasService.changeState({
        schemaId: schemaId,
        id: createdSchemaVersion.id,
        requestBody: {
          stateId: targetLifecycleStateId
        }
      });
      const updatedSchemaVersion: SchemaVersion | undefined = await CliEPSchemaVersionsService.getSchemaVersion({
        schemaId: schemaId,
        schemaVersionString: this.newVersionString
      });
      if(updatedSchemaVersion === undefined) throw new CliEPApiError(logName, 'updatedSchemaVersion === undefined', {
        updatedSchemaVersion: updatedSchemaVersion
      });
      return updatedSchemaVersion;
    }
    return createdSchemaVersion;
  }
  /**
   * Create a new SchemaVersion
   */
  protected async createFunc(): Promise<ICliSchemaVersionTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    const schemaId: string = this.getCliTaskConfig().schemaId;
    
    const create: SchemaVersion = {
      ...this.createObjectSettings(),
      schemaId: schemaId,
      version: this.newVersionString,
    };
    const schemaVersion: SchemaVersion = await this.createSchemaVersion({
      schemaId: schemaId,
      schemaVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_CREATE,
      targetLifecycleStateId: this.getCliTaskConfig().schemaVersionSettings.stateId,
    });
    return {
      schemaVersionObject: schemaVersion,
      apiObject: schemaVersion
    };
  }

  /**
   * Creates a new SchemaVersion with bumped version number.
   */
  protected async updateFunc(cliGetFuncReturn: ICliSchemaVersionTask_GetFuncReturn): Promise<ICliSchemaVersionTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    cliGetFuncReturn;
    const schemaId: string = this.getCliTaskConfig().schemaId;

    const latestSchemaVersionString: string | undefined = await CliEPSchemaVersionsService.getLastestSchemaVersion({ schemaId: this.getCliTaskConfig().schemaId });
    if(latestSchemaVersionString === undefined) throw new CliError(logName, 'latestSchemaVersionString === undefined');
    // bump version according to strategy
    const newSchemaVersionString = CliSemVerUtils.createNextVersion({
      versionString: latestSchemaVersionString,
      strategy: CliConfig.getCliAppConfig().assetImportTargetLifecycleState.versionStrategy,
    });

    const create: SchemaVersion = {
      ...this.createObjectSettings(),
      schemaId: schemaId,
      version: newSchemaVersionString,
    };
    const schemaVersion: SchemaVersion = await this.createSchemaVersion({
      schemaId: schemaId,
      schemaVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_UPDATE,
      targetLifecycleStateId: this.getCliTaskConfig().schemaVersionSettings.stateId
    });

    const cliSchemaVersionTask_UpdateFuncReturn: ICliSchemaVersionTask_UpdateFuncReturn = {
      apiObject: schemaVersion,
      schemaVersionObject: schemaVersion,
    };
    return cliSchemaVersionTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliSchemaVersionTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliSchemaVersionTask_ExecuteReturn: ICliSchemaVersionTask_ExecuteReturn = {
      cliTaskState: cliTaskExecuteReturn.cliTaskState,
      apiObject: undefined,
      schemaVersionObject: cliTaskExecuteReturn.apiObject,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: {
      cliSchemaVersionTask_ExecuteReturn: cliSchemaVersionTask_ExecuteReturn,
    }}));
    return cliSchemaVersionTask_ExecuteReturn;
  }

}
