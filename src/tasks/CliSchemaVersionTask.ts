import { CliEPApiError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn } from "./CliTask";
import { SchemasService, SchemaVersion, SchemaVersionResponse, VersionedObjectStateChangeRequest } from "../_generated/@solace-iot-team/sep-openapi-node";
import CliEPSchemaVersionsService from "../services/CliEPSchemaVersionsService";

export interface ICliSchemaVersionTask_Config extends ICliTaskConfig {
  schemaId: string;
  schemaVersionString: string;
  schemaString: string;
  schemaTargetLifecycleState: string;
  schemaVersionSettings: Pick<SchemaVersion, "description" | "displayName">;
  // schemaObject: Required<Pick<SchemaObject, "applicationDomainId" | "name" | "shared"  | "contentType" | "schemaType">>;
}
export interface ICliSchemaVersionTask_Keys extends ICliTaskKeys {
  schemaId: string;
  schemaVersionString: string;
}
export interface ICliSchemaVersionTask_GetFuncReturn extends ICliGetFuncReturn {
  schemaVersion: SchemaVersion | undefined;
}
export interface ICliSchemaVersionTask_CreateFuncReturn extends ICliCreateFuncReturn {
  schemaVersion: SchemaVersion;
}
export interface ICliSchemaVersionTask_ExecuteReturn extends ICliTaskExecuteReturn {
  schemaVersion: SchemaVersion;
}

export class CliSchemaVersionTask extends CliTask {

  // private readonly ContentTypeMap: Map<string, EPContentType> = new Map<string, EPContentType>([
  //   ["application/json", EPContentType.APPLICATION_JSON]
  // ]); 

  private readonly Empty_ICliSchemaVersionTask_GetFuncReturn: ICliSchemaVersionTask_GetFuncReturn = {
    apiObject: undefined,
    documentExists: false,
    schemaVersion: undefined,
  };

  constructor(taskConfig: ICliSchemaVersionTask_Config) {
    super(taskConfig);
  }

  // private mapContentType(contentType: string): EPContentType {
  //   const funcName = 'mapContentType';
  //   const logName = `${CliSchemaTask.name}.${funcName}()`;
  //   const mapped: EPContentType | undefined = this.ContentTypeMap.get(contentType);
  //   if(mapped === undefined) throw new CliEPApiError(logName, "mapped === undefined", {
  //     contentType: contentType
  //   });
  //   return mapped;
  // }

  protected getTaskKeys(): ICliSchemaVersionTask_Keys {
    return {
      schemaId: (this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaId,
      schemaVersionString: (this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaVersionString,
    }
  }

  protected async getFunc(cliTaskKeys: ICliSchemaVersionTask_Keys): Promise<ICliSchemaVersionTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      params: {
        schemaId: cliTaskKeys.schemaId,
        schemaVersionString: cliTaskKeys.schemaVersionString,
      }
    }}));

    const schemaVersion: SchemaVersion | undefined = await CliEPSchemaVersionsService.getSchemaVersion({ 
      schemaId: cliTaskKeys.schemaId,
      schemaVersionString: cliTaskKeys.schemaVersionString
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      schemaVersion: schemaVersion
    }}));

    if(schemaVersion === undefined) return this.Empty_ICliSchemaVersionTask_GetFuncReturn;

    const cliSchemaVersionTask_GetFuncReturn: ICliSchemaVersionTask_GetFuncReturn = {
      apiObject: schemaVersion,
      schemaVersion: schemaVersion,
      documentExists: true,
    }
    return cliSchemaVersionTask_GetFuncReturn;
  };

  protected async createFunc(): Promise<ICliSchemaVersionTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    const schemaId: string = (this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaId;
    const schemaVersionString: string = (this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaVersionString
    const create: SchemaVersion = {
      ...(this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaVersionSettings,
      schemaId: schemaId,
      version: schemaVersionString,
      content: (this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaString,
    };

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      document: create
    }}));

    const schemaVersionResponse: SchemaVersionResponse = await SchemasService.postSchemaVersion({
      schemaId: (this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaId,
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      schemaVersionResponse: schemaVersionResponse
    }}));

    if(schemaVersionResponse.data === undefined) throw new CliEPApiError(logName, 'schemaVersionResponse.data === undefined', {
      schemaVersionResponse: schemaVersionResponse
    });
    const schemaVersion: SchemaVersion = schemaVersionResponse.data;
    if(schemaVersion.id === undefined || schemaVersion.stateId === undefined) throw new CliEPApiError(logName, 'schemaVersion.id === undefined || schemaVersion.stateId === undefined', {
      schemaVersion: schemaVersion
    });
    // check the target lifecycle state
    const schemaVersionId: string = schemaVersion.id;
    const schemaVersionStateId: string = schemaVersion.stateId;
    const targetLifecycleStateId: string = (this.cliTaskConfig as ICliSchemaVersionTask_Config).schemaTargetLifecycleState;
    if(schemaVersionStateId !== targetLifecycleStateId) {
      const versionedObjectStateChangeRequest: VersionedObjectStateChangeRequest = await SchemasService.changeState({
        schemaId: schemaId,
        id: schemaVersionId,
        requestBody: {
          stateId: targetLifecycleStateId
        }
      });
      const updatedSchemaVersion: SchemaVersion | undefined = await CliEPSchemaVersionsService.getSchemaVersion({
        schemaId: schemaId,
        schemaVersionString: schemaVersionString
      });
      if(updatedSchemaVersion === undefined) throw new CliEPApiError(logName, 'updatedSchemaVersion === undefined', {
        updatedSchemaVersion: updatedSchemaVersion
      });
      return {
        schemaVersion: updatedSchemaVersion,
        apiObject: updatedSchemaVersion,
      };
    }
    return {
      schemaVersion: schemaVersion,
      apiObject: schemaVersion
    };
  }

  public async execute(): Promise<ICliSchemaVersionTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliSchemaVersionTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliSchemaVersionTask_ExecuteReturn: ICliSchemaVersionTask_ExecuteReturn = {
      cliTaskState: cliTaskExecuteReturn.cliTaskState,
      apiObject: undefined,
      schemaVersion: cliTaskExecuteReturn.apiObject,
    };
    return cliSchemaVersionTask_ExecuteReturn;
  }

}
