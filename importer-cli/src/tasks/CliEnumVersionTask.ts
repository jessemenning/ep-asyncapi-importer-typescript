import _ from "lodash";
import { CliEPApiContentError, CliError } from "../CliError";
import { CliLogger, ECliStatusCodes } from "../CliLogger";
import { CliTask, ICliTaskKeys, ICliGetFuncReturn, ICliTaskConfig, ICliCreateFuncReturn, ICliTaskExecuteReturn, ICliUpdateFuncReturn } from "./CliTask";
import { 
  Enum,
  EnumsService, 
  EnumValue, 
  EnumVersion, 
  EnumVersionResponse, 
  VersionedObjectStateChangeRequest 
} from "../_generated/@solace-iot-team/sep-openapi-node";
import CliConfig from "../CliConfig";
import CliSemVerUtils from "../CliSemVerUtils";
import CliEPEnumVersionsService from "../services/CliEPEnumVersionsService";

type TCliEnumVersionTask_Settings = Required<Pick<EnumVersion, "description" | "displayName" | "stateId">>;
type TCliEnumVersionTask_CompareObject = Partial<TCliEnumVersionTask_Settings> & Pick<EnumVersion, "values">;

export interface ICliEnumVersionTask_Config extends ICliTaskConfig {
  applicationDomainId: string;
  enumId: string;
  baseVersionString: string;
  enumVersionSettings: TCliEnumVersionTask_Settings;
  parameterEnumValues: Array<string>;
}
export interface ICliEnumVersionTask_Keys extends ICliTaskKeys {
  applicationDomainId: string;
  enumId: string;
}
export interface ICliEnumVersionTask_GetFuncReturn extends ICliGetFuncReturn {
  enumVersionObject: EnumVersion | undefined;
}
export interface ICliEnumVersionTask_CreateFuncReturn extends ICliCreateFuncReturn {
  enumVersionObject: EnumVersion;
}
export interface ICliEnumVersionTask_UpdateFuncReturn extends ICliUpdateFuncReturn {
  enumVersionObject: EnumVersion;
}
export interface ICliEnumVersionTask_ExecuteReturn extends ICliTaskExecuteReturn {
  enumVersionObject: EnumVersion;
}

export class CliEnumVersionTask extends CliTask {
  private newVersionString: string;

  private readonly Empty_ICliEnumVersionTask_GetFuncReturn: ICliEnumVersionTask_GetFuncReturn = {
    documentExists: false,
    apiObject: undefined,
    enumVersionObject: undefined,
  };

  private readonly Default_TCliEnumVersionTask_Settings: Partial<TCliEnumVersionTask_Settings> = {
  }

  private getCliTaskConfig(): ICliEnumVersionTask_Config { return this.cliTaskConfig as ICliEnumVersionTask_Config; }

  private createEnumValueList(valueList: Array<string>): Array<EnumValue> {
    const enumValueList: Array<EnumValue> = [];
    valueList.forEach( (value: string) => {
      const enumValue: EnumValue = {
        label: value,
        value: value
      };
      enumValueList.push(enumValue);
    });
    return enumValueList;
  }

  private createObjectSettings(): Partial<EnumVersion> {
    return {
      ...this.Default_TCliEnumVersionTask_Settings,
      ...this.getCliTaskConfig().enumVersionSettings,
      values: this.createEnumValueList(this.getCliTaskConfig().parameterEnumValues)
    };
  }

  constructor(taskConfig: ICliEnumVersionTask_Config) {
    super(taskConfig);
    this.newVersionString = taskConfig.baseVersionString;
  }

  protected getTaskKeys(): ICliEnumVersionTask_Keys {
    return {
      enumId: this.getCliTaskConfig().enumId,
      applicationDomainId: this.getCliTaskConfig().applicationDomainId
    };
  }

  /**
   * Get the latest EnumVersion.
   */
  protected async getFunc(cliTaskKeys: ICliEnumVersionTask_Keys): Promise<ICliEnumVersionTask_GetFuncReturn> {
    const funcName = 'getFunc';
    const logName = `${CliEnumVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      cliTaskKeys: cliTaskKeys,
    }}));

    // get the latest enum version
    const enumVersion: EnumVersion | undefined = await CliEPEnumVersionsService.getLatestVersionById({
      applicationDomainId: cliTaskKeys.applicationDomainId,
      enumId: cliTaskKeys.enumId,
    });
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_GET, details: {
      enumVersion: enumVersion ? enumVersion : 'undefined'
    }}));
    if(enumVersion === undefined) return this.Empty_ICliEnumVersionTask_GetFuncReturn;
    const cliEnumVersionTask_GetFuncReturn: ICliEnumVersionTask_GetFuncReturn = {
      apiObject: enumVersion,
      enumVersionObject: enumVersion,
      documentExists: true,
    }
    return cliEnumVersionTask_GetFuncReturn;
  };

  private createCompareEnumValueList_From_SEP({ sepValueList}:{
    sepValueList?: Array<EnumValue>;
  }): Array<EnumValue> {
    if(sepValueList === undefined) return [];
    return sepValueList.map( (sepEnumValue: EnumValue) => {
      return {
        label: sepEnumValue.label,
        value: sepEnumValue.value
      }
    });
  }

  protected isUpdateRequired({ cliGetFuncReturn}: { 
    cliGetFuncReturn: ICliEnumVersionTask_GetFuncReturn; 
  }): boolean {
    const funcName = 'isUpdateRequired';
    const logName = `${CliEnumVersionTask.name}.${funcName}()`;
    if(cliGetFuncReturn.enumVersionObject === undefined) throw new CliError(logName, 'cliGetFuncReturn.enumVersionObject === undefined');
    let isUpdateRequired: boolean = false;

    const existingObject: EnumVersion = cliGetFuncReturn.enumVersionObject;
    const existingCompareObject: TCliEnumVersionTask_CompareObject = {
      description: existingObject.description,
      displayName: existingObject.displayName,
      stateId: existingObject.stateId,
      values: this.createCompareEnumValueList_From_SEP({ sepValueList: existingObject.values })
    };
    const requestedCompareObject: TCliEnumVersionTask_CompareObject = this.createObjectSettings();
    isUpdateRequired = !_.isEqual(existingCompareObject, requestedCompareObject);
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTING_TASK_IS_UPDATE_REQUIRED, details: {
      existingCompareObject: existingCompareObject,
      requestedCompareObject: requestedCompareObject,
      isUpdateRequired: isUpdateRequired
    }}));
    // if(isUpdateRequired) throw new Error(`${logName}: check updates requiired`);
    // throw new Error(`${logName}: check updates required result, isUpdateRequired=${isUpdateRequired}`);
    return isUpdateRequired;
  }

  private async createEnumVersion({ enumId, enumVersion, code, targetLifecycleStateId }:{
    enumId: string;
    enumVersion: EnumVersion;
    code: ECliStatusCodes;
    targetLifecycleStateId: string;
  }): Promise<EnumVersion> {
    const funcName = 'createEnumVersion';
    const logName = `${CliEnumVersionTask.name}.${funcName}()`;

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      document: enumVersion
    }}));

    const enumVersionResponse: EnumVersionResponse = await EnumsService.createEnumVersionForEnum({
      enumId: enumId,
      requestBody: enumVersion
    });

    CliLogger.trace(CliLogger.createLogEntry(logName, { code: code, details: {
      enumVersionResponse: enumVersionResponse
    }}));

    if(enumVersionResponse.data === undefined) throw new CliEPApiContentError(logName, 'enumVersionResponse.data === undefined', {
      enumVersionResponse: enumVersionResponse
    });
    const createdEnumVersion: EnumVersion = enumVersionResponse.data;

    if(createdEnumVersion.id === undefined || createdEnumVersion.stateId === undefined) throw new CliEPApiContentError(logName, 'createdEnumVersion.id === undefined || createdEnumVersion.stateId === undefined', {
      createdEnumVersion: createdEnumVersion
    });
    // check the target lifecycle state
    if(createdEnumVersion.stateId !== targetLifecycleStateId) {
      const versionedObjectStateChangeRequest: VersionedObjectStateChangeRequest = await EnumsService.updateEnumVersionStateForEnum({
        enumId: enumId,
        id: createdEnumVersion.id,
        requestBody: {
          stateId: targetLifecycleStateId
        }
      });
      const updatedEnumVersion: EnumVersion | undefined = await CliEPEnumVersionsService.getVersionByVersion({
        enumId: enumId,
        enumVersionString: this.newVersionString
      });
      if(updatedEnumVersion === undefined) throw new CliEPApiContentError(logName, 'updatedEnumVersion === undefined', {
        updatedEnumVersion: updatedEnumVersion
      });
      return updatedEnumVersion;
    }
    return createdEnumVersion;
  }
  /**
   * Create a new EnumVersion
   */
  protected async createFunc(): Promise<ICliEnumVersionTask_CreateFuncReturn> {
    const funcName = 'createFunc';
    const logName = `${CliEnumVersionTask.name}.${funcName}()`;

    const enumId: string = this.getCliTaskConfig().enumId;
    
    const create: EnumVersion = {
      ...this.createObjectSettings(),
      enumId: enumId,
      version: this.newVersionString,
    };
    const enumVersion: EnumVersion = await this.createEnumVersion({
      enumId: enumId,
      enumVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_CREATE,
      targetLifecycleStateId: this.getCliTaskConfig().enumVersionSettings.stateId,
    });
    return {
      enumVersionObject: enumVersion,
      apiObject: enumVersion
    };
  }

  /**
   * Creates a new EnumVersion with bumped version number.
   */
  protected async updateFunc(cliGetFuncReturn: ICliEnumVersionTask_GetFuncReturn): Promise<ICliEnumVersionTask_UpdateFuncReturn> {
    const funcName = 'updateFunc';
    const logName = `${CliEnumVersionTask.name}.${funcName}()`;

    cliGetFuncReturn;
    const enumId: string = this.getCliTaskConfig().enumId;

    const latestEnumVersionString: string | undefined = await CliEPEnumVersionsService.getLastestVersionString({ enumId: this.getCliTaskConfig().enumId });
    if(latestEnumVersionString === undefined) throw new CliError(logName, 'latestEnumVersionString === undefined');
    // bump version according to strategy
    const newEnumVersionString = CliSemVerUtils.createNextVersion({
      versionString: latestEnumVersionString,
      strategy: CliConfig.getCliAppConfig().assetImportTargetLifecycleState.versionStrategy,
    });

    const create: EnumVersion = {
      ...this.createObjectSettings(),
      enumId: enumId,
      version: newEnumVersionString,
    };
    const enumVersion: EnumVersion = await this.createEnumVersion({
      enumId: enumId,
      enumVersion: create,
      code: ECliStatusCodes.EXECUTING_TASK_UPDATE,
      targetLifecycleStateId: this.getCliTaskConfig().enumVersionSettings.stateId
    });

    const cliEnumVersionTask_UpdateFuncReturn: ICliEnumVersionTask_UpdateFuncReturn = {
      apiObject: enumVersion,
      enumVersionObject: enumVersion,
    };
    return cliEnumVersionTask_UpdateFuncReturn;
  }

  public async execute(): Promise<ICliEnumVersionTask_ExecuteReturn> { 
    const funcName = 'execute';
    const logName = `${CliEnumVersionTask.name}.${funcName}()`;

    const cliTaskExecuteReturn: ICliTaskExecuteReturn = await super.execute();
    if(cliTaskExecuteReturn.apiObject === undefined) throw new CliError(logName, 'cliTaskExecuteReturn.apiObject === undefined');

    const cliEnumVersionTask_ExecuteReturn: ICliEnumVersionTask_ExecuteReturn = {
      ...cliTaskExecuteReturn,
      apiObject: undefined,
      enumVersionObject: cliTaskExecuteReturn.apiObject,
    };
    CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.EXECUTED_TASK, details: {
      cliEnumVersionTask_ExecuteReturn: cliEnumVersionTask_ExecuteReturn,
    }}));
    return cliEnumVersionTask_ExecuteReturn;
  }

}
