import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig } from "../services/CliTask";
import { SchemaObject, SchemaResponse, SchemasService, SchemaVersion } from "../_generated/@solace-iot-team/ep-openapi-node";

export interface ICliSchemaTask_Config extends ICliTaskConfig {
}
export interface ICliSchemaTask_Keys extends ICliTaskKeys {
  schemaId: string;
}
export interface ICliSchemaTask_GetFuncResponse extends ICliGetFuncReturn {
  schemaObject: SchemaObject | undefined;
}

export class CliSchemaTask extends CliTask {

  private readonly EmptyResponse: ICliSchemaTask_GetFuncResponse = {
    schemaObject: undefined,
    documentExists: false  
  };
  private readonly DefaultSchemaVersionParams: Partial<SchemaVersion> = {
    stateId: "1",
  }

  constructor(taskConfig: ICliSchemaTask_Config) {
    super(taskConfig);
  }

  protected getTaskKeys(): ICliSchemaTask_Keys {
    return {
      schemaId: "schema-id"
    }
  }

  protected async getFunc(cliTaskKeys: ICliSchemaTask_Keys): Promise<ICliSchemaTask_GetFuncResponse> {
    const funcName = 'getFunc';
    const logName = `${this.constructor.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      params: {
        schemaId: cliTaskKeys.schemaId
      }
    }}));

    const schemaResponse: SchemaResponse = await SchemasService.getSchema({
      id: cliTaskKeys.schemaId
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      schemaResponse: schemaResponse
    }}));

    throw new Error(`${logName}: check the response and continue `);

    // if(applicationDomainsResponse.data === undefined || applicationDomainsResponse.data.length === 0) return this.EmptyResponse;

    // const cliApplicationDomainsResponse: ICliApplicationDomainsResponse = {
    //   applicationDomain: applicationDomainsResponse.data[0],
    //   documentExists: true
    // };
    // return cliApplicationDomainsResponse;
  };

  protected async createFunc(): Promise<void> {
    const funcName = 'createFunc';
    const logName = `${this.constructor.name}.${funcName}()`;

    throw new Error(`${logName}: implement me `);

    // const applicationDomainName = this.get_CliAsyncApiDocument().getApplicationDomainName();

    // const create: ApplicationDomain = {
    //   ...this.DefaultApplicationDomainParams,
    //   name: applicationDomainName
    // }

    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
    //   document: create
    // }}));

    // const applicationDomainResponse: ApplicationDomainResponse = await ApplicationDomainsService.create9({
    //   requestBody: create
    // });

    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_CREATE, details: {
    //   applicationDomainResponse: applicationDomainResponse
    // }}));

  }


}
