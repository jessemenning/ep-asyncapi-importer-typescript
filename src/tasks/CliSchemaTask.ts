import { CliEPApiError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn } from "../services/CliTask";
import { SchemaObject, SchemaResponse, SchemasResponse, SchemasService, SchemaVersion } from "../_generated/@solace-iot-team/sep-openapi-node";

export enum ESchemaType {
  JSON_SCHEMA = "jsonSchema"
}
enum EPContentType {
  APPLICATION_JSON = "json"
}
export interface ICliSchemaTask_Config extends ICliTaskConfig {
  schemaObject: Required<Pick<SchemaObject, "applicationDomainId" | "name" | "shared"  | "contentType" | "schemaType">>;
}
export interface ICliSchemaTask_Keys extends ICliTaskKeys {
  schemaName: string;
  applicationDomainId: string;
}
export interface ICliSchemaTask_GetFuncReturn extends ICliGetFuncReturn {
  schemaObject: SchemaObject | undefined;
}
export interface ICliSchemaTask_CreateFuncReturn extends ICliCreateFuncReturn {
  schemaObject: SchemaObject;
}
export interface ICliSchemaTask_ExecuteReturn extends ICliTaskExecuteReturn {
  schemaObject: SchemaObject;
}

export class CliSchemaTask extends CliTask {

  private readonly ContentTypeMap: Map<string, EPContentType> = new Map<string, EPContentType>([
    ["application/json", EPContentType.APPLICATION_JSON]
  ]); 

  private readonly Empty_ICliSchemaTask_GetFuncReturn: ICliSchemaTask_GetFuncReturn = {
    apiObject: undefined,
    schemaObject: undefined,
    documentExists: false  
  };

  constructor(taskConfig: ICliSchemaTask_Config) {
    super(taskConfig);
  }

  private mapContentType(contentType: string): EPContentType {
    const funcName = 'mapContentType';
    const logName = `${CliSchemaTask.name}.${funcName}()`;
    const mapped: EPContentType | undefined = this.ContentTypeMap.get(contentType);
    if(mapped === undefined) throw new CliEPApiError(logName, "mapped === undefined", {
      contentType: contentType
    });
    return mapped;
  }
  protected getTaskKeys(): ICliSchemaTask_Keys {
    return {
      schemaName: (this.cliTaskConfig as ICliSchemaTask_Config).schemaObject.name,
      applicationDomainId: (this.cliTaskConfig as ICliSchemaTask_Config).schemaObject.applicationDomainId,
    }
  }

  protected async getFunc(cliTaskKeys: ICliSchemaTask_Keys): Promise<ICliSchemaTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliSchemaTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      params: {
        schemaName: cliTaskKeys.schemaName
      }
    }}));

    const schemasResponse: SchemasResponse = await SchemasService.listSchemas({
      name: cliTaskKeys.schemaName,
      applicationDomainId: cliTaskKeys.applicationDomainId,
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      schemasResponse: schemasResponse
    }}));

    if(schemasResponse.data === undefined || schemasResponse.data.length === 0) return this.Empty_ICliSchemaTask_GetFuncReturn;

    const cliSchemaTask_GetFuncReturn: ICliSchemaTask_GetFuncReturn = {
      apiObject: schemasResponse.data[0],
      schemaObject: schemasResponse.data[0],
      documentExists: true,
    }
    return cliSchemaTask_GetFuncReturn;
  };

  protected async createFunc(): Promise<ICliSchemaTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliSchemaTask.name}.${funcName}()`;

    const create: SchemaObject = {
      ...(this.cliTaskConfig as ICliSchemaTask_Config).schemaObject,
      contentType: this.mapContentType((this.cliTaskConfig as ICliSchemaTask_Config).schemaObject.contentType)
    };

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      document: create
    }}));

    const schemaResponse: SchemaResponse = await SchemasService.postSchema({
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      schemaResponse: schemaResponse
    }}));

    if(schemaResponse.data === undefined) throw new CliEPApiError(logName, 'schemaResponse.data === undefined', {
      schemaResponse: schemaResponse
    });
    return {
       schemaObject: schemaResponse.data
    };
  }

  public async execute(): Promise<ICliSchemaTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliSchemaTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliSchemaTask_ExecuteReturn: ICliSchemaTask_ExecuteReturn = {
      cliTaskState: cliTaskExecuteReturn.cliTaskState,
      apiObject: undefined,
      schemaObject: cliTaskExecuteReturn.apiObject
    };
    return cliSchemaTask_ExecuteReturn;
  }

}
