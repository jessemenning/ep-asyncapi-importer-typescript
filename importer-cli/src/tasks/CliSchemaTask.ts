import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { 
  CliTask, 
  ICliTaskKeys, 
  ICliGetFuncReturn, 
  ICliTaskConfig, 
  ICliCreateFuncReturn, 
  ICliTaskExecuteReturn, 
  ICliUpdateFuncReturn, 
  ICliTaskIsUpdateRequiredReturn, 
} from "./CliTask";
import { 
  SchemaObject, 
  SchemaResponse, 
  SchemasService, 
} from '@solace-iot-team/ep-sdk/sep-openapi-node';
import CliEPSchemasService from "../services/CliEPSchemasService";

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
    if(mapped === undefined) throw new CliEPApiContentError(logName, "mapped === undefined", {
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

    const schemaObject: SchemaObject | undefined = await CliEPSchemasService.getByName({ 
      schemaName: cliTaskKeys.schemaName,
      applicationDomainId: cliTaskKeys.applicationDomainId,

    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      schemaObject: schemaObject
    }}));

    if(schemaObject === undefined) return this.Empty_ICliSchemaTask_GetFuncReturn;

    const cliSchemaTask_GetFuncReturn: ICliSchemaTask_GetFuncReturn = {
      apiObject: schemaObject,
      schemaObject: schemaObject,
      documentExists: true,
    }
    return cliSchemaTask_GetFuncReturn;
  };

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliSchemaTask_GetFuncReturn; 
  }): ICliTaskIsUpdateRequiredReturn {
    const funcName = 'isUpdateRequired';
    const logName = `${CliSchemaTask.name}.${funcName}()`;
    if(cliGetFuncReturn.schemaObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.schemaObject === undefined');

    const existingObject: SchemaObject = cliGetFuncReturn.schemaObject;
    const existingCompareObject: TCliSchemaTask_CompareObject = {
      shared: existingObject.shared,
      contentType: existingObject.contentType,
      schemaType: existingObject.schemaType,
    }
    const requestedCompareObject: TCliSchemaTask_CompareObject = this.createObjectSettings();

    const cliTaskIsUpdateRequiredReturn: ICliTaskIsUpdateRequiredReturn = this.create_ICliTaskIsUpdateRequiredReturn({
      existingObject: existingCompareObject,
      requestedObject: requestedCompareObject
    });
    // DEBUG
    // if(cliTaskIsUpdateRequiredReturn.isUpdateRequired) throw new Error(`${logName}: check updates requiired`);
    return cliTaskIsUpdateRequiredReturn;

    // OLD: delete me
    // isUpdateRequired = !_.isEqual(existingCompareObject, requestedCompareObject);
    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
    //   existingCompareObject: existingCompareObject,
    //   requestedCompareObject: requestedCompareObject,
    //   isUpdateRequired: isUpdateRequired
    // }}));
    // return isUpdateRequired;
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

    const schemaResponse: SchemaResponse = await SchemasService.createSchema({
      requestBody: create
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
      schemaResponse: schemaResponse
    }}));

    if(schemaResponse.data === undefined) throw new CliEPApiContentError(logName, 'schemaResponse.data === undefined', {
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
    if(cliGetFuncReturn.schemaObject.id === undefined) throw new CliEPApiContentError(logName, 'cliGetFuncReturn.schemaObject.id === undefined', {
      schemaObject: cliGetFuncReturn.schemaObject
    });
    const schemaResponse: SchemaResponse = await SchemasService.updateSchema({
      id: cliGetFuncReturn.schemaObject.id,
      requestBody: update
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_UPDATE, details: {
      schemaResponse: schemaResponse
    }}));
    if(schemaResponse.data === undefined) throw new CliEPApiContentError(logName, 'schemaResponse.data === undefined', {
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
      ...cliTaskExecuteReturn,
      apiObject: undefined,
      schemaObject: cliTaskExecuteReturn.apiObject
    };
    return cliSchemaTask_ExecuteReturn;
  }

}
