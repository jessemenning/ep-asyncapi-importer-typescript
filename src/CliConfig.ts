import { CliError, ConfigMissingEnvVarError, InvalidEnvVarValueFromListError, InvalidFileConfigError } from './CliError';
import { CliLogger, ECliStatusCodes } from './CliLogger';
import { Command, OptionValues } from 'commander';
import { CliUtils } from './CliUtils';

export enum ECliAssetImportMode {
  STANDARD = "standard",
  APIM = "apim",
}
const ValidEnvAssetImportMode = {
  STANDARD: ECliAssetImportMode.STANDARD,
  APIM: ECliAssetImportMode.APIM,
}
export type TAssetImportMode_Standard = {
  type: ECliAssetImportMode.STANDARD;
}
export type TAssetImportMode_Apim = {
  type: ECliAssetImportMode.APIM;
  bumpVersionStrategy: "minor" | "patch";
}
export type TAssetImportMode = TAssetImportMode_Standard | TAssetImportMode_Apim;

export type TCliLoggerConfig = {
  appId: string,
  level: string
};
export type TCliAppConfig = {
  assetImportMode: TAssetImportMode;
  asyncApiSpecFileName: string;
  domainName?: string;
  // domainId?: string;  - where would we get this from?
}
export type TCliConfig = {
  appId: string;
  cliLoggerConfig: TCliLoggerConfig;
  appConfig: TCliAppConfig;
};

export enum EEnvVars {
  CLI_APP_ID = 'CLI_APP_ID',
  CLI_SOLACE_CLOUD_TOKEN = "CLI_SOLACE_CLOUD_TOKEN",
  CLI_LOGGER_LOG_LEVEL= 'CLI_LOGGER_LOG_LEVEL',
  CLI_ASSET_IMPORT_MODE = 'CLI_ASSET_IMPORT_MODE',
};


export class CliConfig {
  private static Program = new Command();
  private config: TCliConfig;
  private solaceCloudToken: string;
  public static DEFAULT_APP_ID = "@solace-iot-team/sep-async-api-importer";
  public static DEFAULT_LOGGER_LOG_LEVEL = "info";
  private static DEFAULT_ASSET_IMPORT_MODE = ValidEnvAssetImportMode.APIM;

  private static DefaultCliLoggerConfig: TCliLoggerConfig = {
    appId: CliConfig.DEFAULT_APP_ID,
    level: CliConfig.DEFAULT_LOGGER_LOG_LEVEL,
  };

  private getOptionalEnvVarValueAsString_From_List_WithDefault = (envVarName: string, list: Array<string>, defaultValue: string): string => {
    const funcName = 'getOptionalEnvVarValueAsString_From_List_WithDefault';
    const logName = `${CliConfig.name}.${funcName}()`;
    const value: string | undefined = process.env[envVarName];
    if(!value) return defaultValue;
    if(!list.includes(value.toLowerCase())) throw new InvalidEnvVarValueFromListError(logName, 'invalid value', envVarName, value, list);    
    return value.toLowerCase();
  };

  // private getMandatoryEnvVarValueAsString_From_List = (envVarName: string, list: Array<string>): string => {
  //   const funcName = 'getMandatoryEnvVarValueAsString_From_List';
  //   const logName = `${CliConfig.name}.${funcName}()`;
  //   const value: string | undefined = process.env[envVarName];
  //   if (!value) throw new ConfigMissingEnvVarServerError(logName, 'mandatory env var missing', envVarName);    
  //   if(!list.includes(value.toLowerCase())) throw new ConfigInvalidEnvVarValueFromListServerError(logName, 'invalid value', envVarName, value, list);    
  //   return value.toLowerCase();
  // };

  private getMandatoryEnvVarValueAsString = (envVarName: string): string => {
    const funcName = 'getMandatoryEnvVarValueAsString';
    const logName = `${CliConfig.name}.${funcName}()`;
    const value: string | undefined = process.env[envVarName];
    if (!value) throw new ConfigMissingEnvVarError(logName, 'mandatory env var missing', envVarName);    
    return value;
  };

  // private getOptionalEnvVarValueAsString = (envVarName: string): string | undefined => {
  //   return process.env[envVarName];
  // }

  private getOptionalEnvVarValueAsStringWithDefault = (envVarName: string, defaultValue: string): string => {
    const value: string | undefined = process.env[envVarName];
    if(value === undefined) return defaultValue;
    return value;    
  }
  
  // private getOptionalEnvVarValueAsBoolean = (envVarName: string, defaultValue: boolean): boolean => {
  //   const value: string | undefined = process.env[envVarName];
  //   if(!value) return defaultValue;
  //   return value.toLowerCase() === 'true';
  // };

  // private getMandatoryEnvVarValueAsNumber = (envVarName: string): number => {
  //   const funcName = 'getMandatoryEnvVarValueAsNumber';
  //   const logName = `${CliConfig.name}.${funcName}()`;
  //   const value: string = this.getMandatoryEnvVarValueAsString(envVarName);
  //   const valueAsNumber: number = parseInt(value);
  //   if (Number.isNaN(valueAsNumber)) throw new ConfigEnvVarNotANumberServerError(logName, 'env var type is not a number', envVarName, value);
  //   return valueAsNumber;
  // };

  // private getOptionalEnvVarValueAsPathWithReadPermissions = (envVarName: string): string | undefined => {
  //   const value = this.getOptionalEnvVarValueAsString(envVarName);
  //   if(!value) return undefined;
  //   return ServerUtils.validateFilePathWithReadPermission(value);
  // }

  // constructor() { }

  private initializeAssetImportMode = (): TAssetImportMode => {
    const funcName = 'initializeAssetImportMode';
    const logName = `${CliConfig.name}.${funcName}()`;
    const assetImportMode: ECliAssetImportMode = this.getOptionalEnvVarValueAsString_From_List_WithDefault(EEnvVars.CLI_ASSET_IMPORT_MODE, Object.values(ValidEnvAssetImportMode), CliConfig.DEFAULT_ASSET_IMPORT_MODE) as ECliAssetImportMode;
    switch(assetImportMode) {
      case ECliAssetImportMode.STANDARD:
        const assetImportMode_Standard: TAssetImportMode_Standard = {
          type: ECliAssetImportMode.STANDARD,
        };
        return assetImportMode_Standard;
      case ECliAssetImportMode.APIM:
        const assetImportMode_Apim: TAssetImportMode_Apim = {
          type: ECliAssetImportMode.APIM,
          bumpVersionStrategy: 'patch',
        };
        return assetImportMode_Apim;
      default:
        CliUtils.assertNever(logName, assetImportMode);
    }
    // should never get here
    throw new CliError(logName, "internal error");
  }

  public initialize = (packageJson: any): void => {
    const funcName = 'initialize';
    const logName = `${CliConfig.name}.${funcName}()`;

    // TODO: make the options typesafe
    CliConfig.Program
    .name(`npx ${packageJson.name}`)
    .description(`${packageJson.description}`)
    .version(`${packageJson.version}`, '-v, --version')
    .usage('[OPTIONS]...')
    .requiredOption('-f, --file <value>', 'Required: Path to AsyncAPI spec file')
    .option('-d, --domain  <value>', 'Application Domain Name. If not passed, name extracted from x-domain-name in spec file')
    // where would you get this from?
    // .option('-dID, --domainId <value>', 'Application Domain ID. If not passed, ID extracted from x-domain-id in spec file')
    .parse(process.argv);
  
    const options: OptionValues = CliConfig.Program.opts();    
    // console.log(`${logName}: options=${JSON.stringify(options, null, 2)}`);
  
    try {

      // handle solace cloud token separately
      this.solaceCloudToken = this.getMandatoryEnvVarValueAsString(EEnvVars.CLI_SOLACE_CLOUD_TOKEN);

      const asyncApiSpecFileName: string | undefined = CliUtils.validateFilePathWithReadPermission(options.file);
      if(asyncApiSpecFileName === undefined) {
        throw new InvalidFileConfigError(logName, 'cannot read asyncApiSpecFile', options.file);    
      }

      const appId: string = this.getOptionalEnvVarValueAsStringWithDefault(EEnvVars.CLI_APP_ID, CliConfig.DEFAULT_APP_ID);

      this.config = {
        appId: appId,
        cliLoggerConfig: {
          appId: appId,
          level: this.getOptionalEnvVarValueAsStringWithDefault(EEnvVars.CLI_LOGGER_LOG_LEVEL, CliConfig.DEFAULT_LOGGER_LOG_LEVEL),
        },
        // TODO: use the typesafe options
        appConfig: {
          asyncApiSpecFileName: asyncApiSpecFileName,
          domainName: options.domain ? options.domain : undefined,
          // domainId: options.domainId ? options.domainId : undefined,
          assetImportMode: this.initializeAssetImportMode(),
        }
      };
    } catch(e) {
      if(e instanceof CliError) {
        const se: CliError = e as CliError;
        CliLogger.fatal(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'env', details: se.toObject() }));
      }
      throw e;
    }
  }

  public logConfig = (): void => {
    const funcName = 'logConfig';
    const logName = `${CliConfig.name}.${funcName}()`;
    // CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'environment', details: process.env }));
    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'config', details: this.config }));
  }

  public getConfig = (): TCliConfig => {
    return this.config;
  };

  public getCliLoggerConfig = (): TCliLoggerConfig => {
    if(this.config && this.config.cliLoggerConfig) return this.config.cliLoggerConfig;
    else return CliConfig.DefaultCliLoggerConfig;
  }

  public getCliAppConfig = (): TCliAppConfig => {
    return this.config.appConfig;
  }

  public getSolaceCloudToken = (): string => {
    return this.solaceCloudToken;
  }
}

export default new CliConfig();