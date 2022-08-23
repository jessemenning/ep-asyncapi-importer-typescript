import { 
  CliConfigInvalidEnvVarValueOptionError,
  CliConfigInvalidUrlEnvVarError,
  CliConfigMissingEnvVarError,
  CliConfigNotInitializedError, 
  CliError, 
  CliErrorFromError, 
  CliInternalCodeInconsistencyError, 
} from './CliError';
import { 
  CliLogger, 
  ECliLogger_LogLevel, 
  ECliLogger_EpSdkLogLevel, 
  ECliStatusCodes, 
  ICliLoggerOptions, 
  ObjectValues_TCliLogger_EpSdkLogLevel, 
  TCliLogger_EpSdkLogLevel } from './CliLogger';
import { EpSdkClient } from '@solace-labs/ep-sdk';
import { DefaultAppName } from './consts';
import { ECliImporterMode, getCliImporterModeObjectValues4Config, ICliImporterOptions } from './CliImporter';
import { ECliAssetImport_TargetLifecycleState } from './services/CliEPStatesService';
import { ECliAssetImport_TargetVersionStrategy } from './CliAsyncApiFileImporter';
import { CliUtils } from './CliUtils';


enum ECliConfigBooleanOptions {
  TRUE = "true",
  FALSE = "false",
}
export enum ECliConfigRunIdGeneration {
  AUTO = "auto",
  CUSTOM = "custom-run-id"
}

export type TCliConfigEnvVarConfig = {
  envVarName: ECliConfigEnvVarNames;
  description: string;
  format?: string;
  default?: string;
  required: boolean;
  options?: Array<string>;
  hidden?: boolean; // placeholder, to hide a config option 
}

enum ECliConfigEnvVarNames {
  CLI_SOLACE_CLOUD_TOKEN = "CLI_SOLACE_CLOUD_TOKEN",

  CLI_APP_NAME = 'CLI_APP_NAME',
  CLI_MODE = "CLI_MODE",
  CLI_RUN_ID = "CLI_RUN_ID",
  CLI_EP_API_BASE_URL = "CLI_EP_API_BASE_URL",

  CLI_LOGGER_LOG_LEVEL = 'CLI_LOGGER_LOG_LEVEL',
  CLI_LOGGER_LOG_FILE = "CLI_LOGGER_LOG_FILE", 
  // CLI_LOGGER_LOG_DIR = "CLI_LOGGER_LOG_DIR",
  CLI_LOGGER_LOG_TO_STDOUT = "CLI_LOGGER_LOG_TO_STDOUT",
  CLI_LOGGER_EP_SDK_LOG_LEVEL = "CLI_LOGGER_EP_SDK_LOG_LEVEL",
  CLI_LOGGER_PRETTY_PRINT = "CLI_LOGGER_PRETTY_PRINT",

  CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE = "CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE",
  CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY = "CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY",
  CLI_IMPORT_ASSETS_OUTPUT_DIR = "CLI_IMPORT_ASSETS_OUTPUT_DIR",
};

const DEFAULT_CLI_MODE = ECliImporterMode.RELEASE_MODE;
const DEFAULT_CLI_RUN_ID = ECliConfigRunIdGeneration.AUTO;
const DEFAULT_CLI_EP_API_BASE_URL = EpSdkClient.DEFAULT_EP_API_BASE_URL;

const DEFAULT_CLI_LOGGER_LOG_LEVEL = ECliLogger_LogLevel.INFO;
const DEFAULT_CLI_LOGGER_LOG_FILE = `./tmp/logs/${DefaultAppName}.log`;
// const DEFAULT_CLI_LOGGER_LOG_DIR = `./tmp/logs`;
const DEFAULT_CLI_LOGGER_LOG_TO_STDOUT = false;
const DEFAULT_CLI_LOGGER_EP_SDK_LOG_LEVEL = ECliLogger_EpSdkLogLevel.SILENT;
const DEFAULT_CLI_LOGGER_PRETTY_PRINT = false;

const DEFAULT_CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE = ECliAssetImport_TargetLifecycleState.RELEASED;
const DEFAULT_CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY = ECliAssetImport_TargetVersionStrategy.BUMP_PATCH;
const DEFAULT_CLI_IMPORT_ASSET_OUTPUT_DIR = "./tmp/output";

const CliConfigEnvVarConfigList: Array<TCliConfigEnvVarConfig> = [
  {
    envVarName: ECliConfigEnvVarNames.CLI_SOLACE_CLOUD_TOKEN,
    description: 'Solace Cloud API Token.',
    required: true
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_APP_NAME,
    description: 'The application name of the importer. Used for logging and testing.',
    required: false,
    default: DefaultAppName,
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_MODE,
    description: 'The operations mode for the app.',
    required: false,
    default: DEFAULT_CLI_MODE,
    options: getCliImporterModeObjectValues4Config()
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_RUN_ID,
    description: 'Specify the run id. "auto": importer generates a run id, "{string}": importer uses the custom run id.',
    required: false,
    default: DEFAULT_CLI_RUN_ID,
    options: Object.values(ECliConfigRunIdGeneration),
    hidden: true
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_EP_API_BASE_URL,
    description: 'The base url for the Event Portal Api.',
    required: false,
    default: DEFAULT_CLI_EP_API_BASE_URL,
    format: 'Url format.'
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_LOGGER_LOG_LEVEL,
    description: 'The log level.',
    required: false,
    default: DEFAULT_CLI_LOGGER_LOG_LEVEL,
    options: Object.values(ECliLogger_LogLevel)
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_LOGGER_LOG_FILE,
    description: `The log file including absolute or relative path. Example: ./tmp/logs/ep-importer.log`,
    required: false,
    default: DEFAULT_CLI_LOGGER_LOG_FILE,
  },
  // {
  //   envVarName: ECliConfigEnvVarNames.CLI_LOGGER_LOG_DIR,
  //   description: `The logs directory. Log files: '{application name}.log' & '{application name}.summary.log'. Examples: './tmp/logs/${DefaultAppName}.log' and './tmp/logs/${DefaultAppName}.summary.log'.`,
  //   required: false,
  //   default: DEFAULT_CLI_LOGGER_LOG_DIR,
  // },
  {
    envVarName: ECliConfigEnvVarNames.CLI_LOGGER_LOG_TO_STDOUT,
    description: 'Flag to log to stdout as well as to the log file.',
    required: false,
    default: String(DEFAULT_CLI_LOGGER_LOG_TO_STDOUT),
    options: Object.values(ECliConfigBooleanOptions),
    hidden: true
  },  
  {
    envVarName: ECliConfigEnvVarNames.CLI_LOGGER_EP_SDK_LOG_LEVEL,
    description: 'Log level for the Event Portal SDK.',
    required: false,
    default: String(DEFAULT_CLI_LOGGER_EP_SDK_LOG_LEVEL),
    options: ObjectValues_TCliLogger_EpSdkLogLevel
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_LOGGER_PRETTY_PRINT,
    description: 'Pretty print the log output. Convenience for visual debugging.',
    required: false,
    default: String(DEFAULT_CLI_LOGGER_PRETTY_PRINT),
    options: Object.values(ECliConfigBooleanOptions)
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE,
    description: 'The target lifecycle state of the imported assets.',
    required: false,
    default: DEFAULT_CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE,
    options: Object.values(ECliAssetImport_TargetLifecycleState)
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY,
    description: 'The versioning strategy for imported assets.',
    required: false,
    default: (DEFAULT_CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY as unknown) as string,
    options: Object.values(ECliAssetImport_TargetVersionStrategy) as Array<string>
  },
  {
    envVarName: ECliConfigEnvVarNames.CLI_IMPORT_ASSETS_OUTPUT_DIR,
    // description: 'The output directory for assets generated after import. A sub-dir is created with a unique run-id at startup. Example: ./tmp/output/2022-08-19-12-01-243',
    description: 'The output directory for assets generated after import. Example: ./tmp/output/{output files}',
    required: false,
    default: DEFAULT_CLI_IMPORT_ASSET_OUTPUT_DIR,
  },
];

export type TCliLoggerConfig = ICliLoggerOptions;
export type TCliImporterConfig = ICliImporterOptions;

export type TCliConfig = {
  appName: string;
  runId: string;
  epApiBaseUrl: string;
  cliLoggerConfig: TCliLoggerConfig;
  cliImporterConfig: TCliImporterConfig;
};

export class CliConfig {
  private config: TCliConfig;
  private solaceCloudToken: string;

  public validate_CliConfigEnvVarConfigList = () => {
    const funcName = 'validate_CliConfigEnvVarConfigList';
    const logName = `${CliConfig.name}.${funcName}()`;

    for(const envVarName of Object.values(ECliConfigEnvVarNames)) {
      const found: TCliConfigEnvVarConfig | undefined = CliConfigEnvVarConfigList.find( (cliConfigEnvVarConfig: TCliConfigEnvVarConfig) => {
        return cliConfigEnvVarConfig.envVarName === envVarName;
      });
      if(found === undefined) throw new CliInternalCodeInconsistencyError(logName, {
        error: 'cannot find env var details in list',
        envVarName: envVarName,
        CliConfigEnvVarConfigList: JSON.stringify(CliConfigEnvVarConfigList, null, 2)
      });
    }
  }

  private assertIsInitialized = () => {
    if(!this.config || !this.solaceCloudToken) throw new CliConfigNotInitializedError(CliConfig.name);
  }

  private generatedRunId = () => {
    const pad = (n: number, pad?: number): string => { return String(n).padStart(pad ? pad : 2, '0'); }
    const d = new Date();
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}-${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}-${pad(d.getUTCSeconds())}-${pad(d.getUTCMilliseconds(),3)}`;
  }

  public get_CliConfigEnvVarConfigList4HelpDisplay = (): Array<TCliConfigEnvVarConfig> => {
    this.validate_CliConfigEnvVarConfigList();
    return CliConfigEnvVarConfigList.filter( (cliConfigEnvVarConfig: TCliConfigEnvVarConfig) => {
      return !cliConfigEnvVarConfig.hidden;
    });
  }
  private getOptionalEnvVarValueAsUrlWithDefault = (envVarName: string, defaultValue: string): string => {
    const funcName = 'getOptionalEnvVarValueAsUrlWithDefault';
    const logName = `${CliConfig.name}.${funcName}()`;
    const value: string | undefined = process.env[envVarName];
    if(!value) return defaultValue;
    // check if value is a valid Url
    try {
      const valueUrl: URL = new URL(value);
      return value;
    } catch(e: any) {
      throw new CliConfigInvalidUrlEnvVarError(logName, envVarName, value, e);
    }
  }

  private getMandatoryEnvVarValueAsString = (envVarName: string): string => {
    const funcName = 'getMandatoryEnvVarValueAsString';
    const logName = `${CliConfig.name}.${funcName}()`;
    const value: string | undefined = process.env[envVarName];
    if (!value) throw new CliConfigMissingEnvVarError(logName, envVarName);    
    return value;
  };

  private getOptionalEnvVarValueAsStringWithDefault = (envVarName: string, defaultValue: string): string => {
    const value: string | undefined = process.env[envVarName];
    if(value === undefined) return defaultValue;
    return value;    
  }

  private getOptionalEnvVarValueAsString_From_Options_WithDefault = (envVarName: string, options: Array<string>, defaultValue: string): string => {
    const funcName = 'getOptionalEnvVarValueAsString_From_Options_WithDefault';
    const logName = `${CliConfig.name}.${funcName}()`;
    const value: string | undefined = process.env[envVarName];
    if(value === undefined) return defaultValue;
    if(!options.includes(value.toLowerCase())) throw new CliConfigInvalidEnvVarValueOptionError(logName, envVarName, value, options);    
    return value.toLowerCase();
  };

  private getOptionalEnvVarValueAsBoolean_WithDefault = (envVarName: string, defaultValue: boolean): boolean => {
    const funcName = 'getOptionalEnvVarValueAsBoolean_WithDefault';
    const logName = `${CliConfig.name}.${funcName}()`;
    const value: string | undefined = process.env[envVarName];
    if(value === undefined) return defaultValue;
    const options: Array<string> = Object.values(ECliConfigBooleanOptions);
    if(!options.includes(value.toLowerCase())) throw new CliConfigInvalidEnvVarValueOptionError(logName, envVarName, value, options);    
    return value.toLowerCase() === ECliConfigBooleanOptions.TRUE;
  };

  public initialize = ({ defaultAppName, fileList, applicationDomainName }: {
    defaultAppName: string;
    fileList: Array<string>;
    applicationDomainName?: string;
  }): void => {
    const funcName = 'initialize';
    const logName = `${CliConfig.name}.${funcName}()`;
    try {
      // handle solace cloud token separately
      this.solaceCloudToken = this.getMandatoryEnvVarValueAsString(ECliConfigEnvVarNames.CLI_SOLACE_CLOUD_TOKEN);
      const appName: string = this.getOptionalEnvVarValueAsStringWithDefault(ECliConfigEnvVarNames.CLI_APP_NAME, defaultAppName);
      const runIdGeneration: ECliConfigRunIdGeneration | string = this.getOptionalEnvVarValueAsStringWithDefault(ECliConfigEnvVarNames.CLI_RUN_ID, DEFAULT_CLI_RUN_ID);
      let runId: string;
      if(runIdGeneration === ECliConfigRunIdGeneration.AUTO) runId = this.generatedRunId();
      else runId = runIdGeneration;
      // const logDirEnvVarValue = this.getOptionalEnvVarValueAsStringWithDefault(ECliConfigEnvVarNames.CLI_LOGGER_LOG_DIR, DEFAULT_CLI_LOGGER_LOG_DIR);
      // const logDir = CliUtils.ensureDirExists(logDirEnvVarValue);
      // const logFile = `${logDir}/${appName}.log`;
      // const summaryLogFile = `${logDir}/${appName}.summary.log`;
      const logFileEnvVarValue = this.getOptionalEnvVarValueAsStringWithDefault(ECliConfigEnvVarNames.CLI_LOGGER_LOG_FILE, DEFAULT_CLI_LOGGER_LOG_FILE);
      const logFile = CliUtils.ensureDirOfFilePathExists(logFileEnvVarValue);

      const importAssetOutputDirEnvVarValue = this.getOptionalEnvVarValueAsStringWithDefault(ECliConfigEnvVarNames.CLI_IMPORT_ASSETS_OUTPUT_DIR, DEFAULT_CLI_IMPORT_ASSET_OUTPUT_DIR);
      // const importAssetOutputDir = this.initializeDir(importAssetOutputDirEnvVarValue, runId);
      const importAssetOutputDir = CliUtils.ensureDirExists(importAssetOutputDirEnvVarValue);

      this.config = {
        appName: appName,
        runId: runId,
        epApiBaseUrl: this.getOptionalEnvVarValueAsUrlWithDefault(ECliConfigEnvVarNames.CLI_EP_API_BASE_URL, DEFAULT_CLI_EP_API_BASE_URL),
        cliLoggerConfig: {
          appName: appName,
          level: this.getOptionalEnvVarValueAsString_From_Options_WithDefault(ECliConfigEnvVarNames.CLI_LOGGER_LOG_LEVEL, Object.values(ECliLogger_LogLevel), DEFAULT_CLI_LOGGER_LOG_LEVEL) as ECliLogger_LogLevel,
          logFile: logFile,
          log2Stdout: this.getOptionalEnvVarValueAsBoolean_WithDefault(ECliConfigEnvVarNames.CLI_LOGGER_LOG_TO_STDOUT, DEFAULT_CLI_LOGGER_LOG_TO_STDOUT),
          cliLogger_EpSdkLogLevel: this.getOptionalEnvVarValueAsString_From_Options_WithDefault(ECliConfigEnvVarNames.CLI_LOGGER_EP_SDK_LOG_LEVEL, ObjectValues_TCliLogger_EpSdkLogLevel, DEFAULT_CLI_LOGGER_EP_SDK_LOG_LEVEL) as TCliLogger_EpSdkLogLevel,
          prettyPrint: this.getOptionalEnvVarValueAsBoolean_WithDefault(ECliConfigEnvVarNames.CLI_LOGGER_PRETTY_PRINT, DEFAULT_CLI_LOGGER_PRETTY_PRINT),
        },
        cliImporterConfig: {
          appName: appName,
          runId: runId,
          asyncApiFileList: fileList,
          cliImporterMode: this.getOptionalEnvVarValueAsString_From_Options_WithDefault(ECliConfigEnvVarNames.CLI_MODE, Object.values(ECliImporterMode), DEFAULT_CLI_MODE) as ECliImporterMode,
          applicationDomainName: applicationDomainName,
          cliAsyncApiFileImporterOptions: {
            runId: runId,
            cliAssetImport_TargetLifecycleState: this.getOptionalEnvVarValueAsString_From_Options_WithDefault(ECliConfigEnvVarNames.CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE, Object.values(ECliAssetImport_TargetLifecycleState), DEFAULT_CLI_IMPORT_ASSETS_TARGET_LIFECYLE_STATE) as ECliAssetImport_TargetLifecycleState,
            cliAssetImport_TargetVersionStrategy: this.getOptionalEnvVarValueAsString_From_Options_WithDefault(ECliConfigEnvVarNames.CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY, Object.values(ECliAssetImport_TargetVersionStrategy) as Array<string>, DEFAULT_CLI_IMPORT_ASSETS_TARGET_VERSION_STRATEGY as unknown as string) as unknown as ECliAssetImport_TargetVersionStrategy,
            assetOutputDir: importAssetOutputDir,
          }
        }
      }
    } catch(e) {
      if(e instanceof CliError) {
        const cliError: CliError = e as CliError;
        CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'config', details: cliError.toObject() }));
      } else {
        CliLogger.fatal(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'config', details: (e as Error).toString() }));
      }
      throw new CliErrorFromError(logName, e as Error);
    }
  }

  public logConfig = (): void => {
    const funcName = 'logConfig';
    const logName = `${CliConfig.name}.${funcName}()`;
    this.assertIsInitialized();
    console.log(`Log file: ${this.config.cliLoggerConfig.logFile}\n`);
    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, message: 'config', details: this.config }));
  }

  public getAppName = (): string => {
    if(this.config) return this.config.appName;
    return DefaultAppName;
  }
  public getCliConfig = (): TCliConfig => {
    this.assertIsInitialized();
    return this.config;
  }
  public getDefaultLoggerOptions = (): ICliLoggerOptions => {
    // don't use a log file at startup - could be empty if different logfile provided in config which leads to confusion.
    // const logFile = this.initializeDirOfFilePath(DEFAULT_CLI_LOGGER_LOG_FILE);
    return {
      appName: DefaultAppName,
      level: DEFAULT_CLI_LOGGER_LOG_LEVEL,
      // logFile: logFile,
      log2Stdout: true,
      cliLogger_EpSdkLogLevel: DEFAULT_CLI_LOGGER_EP_SDK_LOG_LEVEL,
      prettyPrint: true,
    }
  }
  public getCliLoggerOptions = (): ICliLoggerOptions => {
    this.assertIsInitialized();
    return this.config.cliLoggerConfig;
  }
  public getCliImporterOptions = (): ICliImporterOptions => {
    this.assertIsInitialized();
    return this.config.cliImporterConfig;

  }
  public getSolaceCloudToken = (): string => {
    this.assertIsInitialized();
    return this.solaceCloudToken;
  }
  public getEpApiBaseUrl = (): string => {
    this.assertIsInitialized();
    return this.config.epApiBaseUrl;
  }
}

export default new CliConfig();
