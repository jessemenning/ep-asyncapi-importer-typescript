import { CliEPApiError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn } from "./CliTask";
import { SchemaObject, SchemaResponse, SchemasResponse, SchemasService, SchemaVersion } from "../_generated/@solace-iot-team/sep-openapi-node";
import isEqual from "lodash.isequal";

export enum EPSchemaType {
  JSON_SCHEMA = "jsonSchema"
}
enum EPContentType {
  APPLICATION_JSON = "json"
}
type TCliSchemaTask_Settings = Partial<Pick<SchemaObject, "shared"  | "contentType" | "schemaType">>;
type TCliSchemaTask_CompareObject = TCliSchemaTask_Settings;

export interface ICliSchemaTask_Config extends ICliTaskConfig {
  schemaName: string;
  applicationDomainId: string;
  schemaObjectSettings: Required<TCliSchemaTask_Settings>;
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
export interface ICliSchemaTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  schemaObject: SchemaObject;
}
export interface ICliSchemaTask_ExecuteReturn extends ICliTaskExecuteReturn {
  schemaObject: SchemaObject;
}

export class CliSchemaTask extends CliTask {

  private readonly ContentTypeMap: Map<string, EPContentType> = new Map<string, EPContentType>([
    ["application/json", EPContentType.APPLICATION_JSON]
  ]); 
  private mapContentType(contentType: string): EPContentType {
    const funcName = 'mapContentType';
    const logName = `${CliSchemaTask.name}.${funcName}()`;
    const mapped: EPContentType | undefined = this.ContentTypeMap.get(contentType);
    if(mapped === undefined) throw new CliEPApiError(logName, "mapped === undefined", {
      contentType: contentType
    });
    return mapped;
  }

  private readonly Empty_ICliSchemaTask_GetFuncReturn: ICliSchemaTask_GetFuncReturn = {
    apiObject: undefined,
    schemaObject: undefined,
    documentExists: false  
  };
  private readonly Default_TCliSchemaTask_Settings: TCliSchemaTask_Settings = {
    shared: true,
    contentType: EPContentType.APPLICATION_JSON,
    schemaType: EPSchemaType.JSON_SCHEMA,
  }
  private getCliTaskConfig(): ICliSchemaTask_Config { return this.cliTaskConfig as ICliSchemaTask_Config; }
  private createObjectSettings(): Partial<SchemaObject> {
    return {
      ...this.Default_TCliSchemaTask_Settings,
      ...this.getCliTaskConfig().schemaObjectSettings,
      contentType: this.mapContentType(this.getCliTaskConfig().schemaObjectSettings.contentType)
    };
  }

  constructor(taskConfig: ICliSchemaTask_Config) {
    super(taskConfig);
  }

  protected getTaskKeys(): ICliSchemaTask_Keys {
    return {
      schemaName: this.getCliTaskConfig().schemaName,
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
    };
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

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliSchemaTask_GetFuncReturn; 
  }): boolean {
    const funcName = 'isUpdateRequired';
    const logName = `${CliSchemaTask.name}.${funcName}()`;
    if(cliGetFuncReturn.schemaObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.schemaObject === undefined');
    let isUpdateRequired: boolean = false;

    const existingObject: SchemaObject = cliGetFuncReturn.schemaObject;
    const existingCompareObject: TCliSchemaTask_CompareObject = {
      shared: existingObject.shared,
      contentType: existingObject.contentType,
      schemaType: existingObject.schemaType,
    }
    const requestedCompareObject: TCliSchemaTask_CompareObject = this.createObjectSettings();
    isUpdateRequired = !isEqual(existingCompareObject, requestedCompareObject);
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      existingCompareObject: existingCompareObject,
      requestedCompareObject: requestedCompareObject,
      isUpdateRequired: isUpdateRequired
    }}));
    return isUpdateRequired;
  }

  protected async createFunc(): Promise<ICliSchemaTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliSchemaTask.name}.${funcName}()`;

    const create: SchemaObject = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().schemaName,
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

    const created: SchemaObject = schemaResponse.data;
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      created: created
    }}));
    return {
       schemaObject: created,
       apiObject: created,
    };
  }

  protected async updateFunc(cliGetFuncReturn: ICliSchemaTask_GetFuncReturn): Promise<ICliSchemaTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliSchemaTask.name}.${funcName}()`;
    if(cliGetFuncReturn.schemaObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.schemaObject === undefined');

    const update: SchemaObject = {
      ...this.createObjectSettings(),
      applicationDomainId: this.getCliTaskConfig().applicationDomainId,
      name: this.getCliTaskConfig().schemaName,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      document: update
    }}));
    if(cliGetFuncReturn.schemaObject.id === undefined) throw new CliEPApiError(logName, 'cliGetFuncReturn.schemaObject.id === undefined', {
      schemaObject: cliGetFuncReturn.schemaObject
    });
    const schemaResponse: SchemaResponse = await SchemasService.patchSchema({
      id: cliGetFuncReturn.schemaObject.id,
      requestBody: update
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      schemaResponse: schemaResponse
    }}));
    if(schemaResponse.data === undefined) throw new CliEPApiError(logName, 'schemaResponse.data === undefined', {
      schemaResponse: schemaResponse
    });
    const cliSchemaTask_UpdateFuncReturn: ICliSchemaTask_UpdateFuncReturn = {
      apiObject: schemaResponse.data,
      schemaObject: schemaResponse.data,
    };
    return cliSchemaTask_UpdateFuncReturn;
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
