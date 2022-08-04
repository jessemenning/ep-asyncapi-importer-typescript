import pino from 'pino';
import { TCliLoggerConfig } from './CliConfig';
import CliRunContext, { ICliRunContext } from './CliRunContext';
import { 
  EEpSdkLogLevel, 
  EpSdkLogger, 
  IEpSdkLogEntry, 
  IEpSdkLoggerInstance 
} from "@solace-iot-team/ep-sdk";

// import { EEpSdkLogLevel, EpSdkLogger, IEpSdkLogEntry, IEpSdkLoggerInstance } from "@solace-iot-team/ep-sdk/EpSdkLogger";

export enum ECliStatusCodes {
  INFO = "INFO",
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INITIALIZING = 'INITIALIZING',
  INITIALIZE_ERROR = 'INITIALIZE_ERROR',
  INITIALIZED = 'INITIALIZED',
  
  VALIDATING_SPEC = "VALIDATING_SPEC",
  VALIDATED_SPEC = "VALIDATED_SPEC",
  
  CHECK_EVENT_API = "CHECK_EVENT_API",
  CHECK_EVENT_API_VERSION = "CHECK_EVENT_API_VERSION",
  CHECK_EVENT = "CHECK_EVENT",
  CHECK_EVENT_VERSION = "CHECK_EVENT_VERSION",
  
  IMPORTING = 'IMPORTING',
  IMPORTING_ERROR = "IMPORTING_ERROR",
  IMPORTED = "IMPORTED",

  IMPORTING_EVENT_API = 'IMPORTING_EVENT_API',
  IMPORTING_EVENT_API_VERSION = 'IMPORTING_EVENT_API_VERSION',
  IMPORTED_EVENT_API_VERSION = 'IMPORTED_EVENT_API_VERSION',
  SKIPPING_IMPORTING_EVENT_API_VERSION = 'SKIPPING_IMPORTING_EVENT_API_VERSION',

  IMPORTING_SCHEMA_VERSION = 'IMPORTING_SCHEMA_VERSION',
  IMPORTING_SCHEMA_VERSION_ERROR = "IMPORTING_SCHEMA_VERSION_ERROR",

  IMPORTING_EVENT_VERSION = 'IMPORTING_EVENT_VERSION',
  IMPORTING_EVENT_VERSION_ERROR = "IMPORTING_EVENT_VERSION_ERROR",

  IMPORTING_CHANNEL_PARAMETERS = 'IMPORTING_CHANNEL_PARAMETERS',
  
  IMPORTING_ENUM_VERSION = 'IMPORTING_ENUM_VERSION',
  IMPORTING_ENUM_VERSION_ERROR = "IMPORTING_ENUM_VERSION_ERROR",

  EXECUTING_TASK = "EXECUTING_TASK",
  EXECUTED_TASK = "EXECUTED_TASK",
  EXECUTING_TASK_ERROR = "EXECUTING_TASK_ERROR",
  EXECUTING_TASK_GET = "EXECUTING_TASK_GET",
  EXECUTING_TASK_CREATE = "EXECUTING_TASK_CREATE",
  EXECUTING_TASK_UPDATE = "EXECUTING_TASK_UPDATE",
  EXECUTING_TASK_DELETE = "EXECUTING_TASK_DELETE",
  EXECUTING_TASK_IS_UPDATE_REQUIRED = "EXECUTING_TASK_IS_UPDATE_REQUIRED",

  SERVICE = "SERVICE",
  SERVICE_CREATE = "SERVICE_CREATE",

  GENERATING_ASSETS = "GENERATING_ASSETS"
  
}

// export interface IEpSdkLogDetails {
//   module: string;
//   code: string;
//   message?: string;
//   details?: any;
// }

export interface ICliLogDetails {
  code: string;
  message?: string;
  details?: any;
}

export interface ICliLogEntry extends IEpSdkLogEntry {
  runContext: ICliRunContext;
}

class CliPinoLogger implements IEpSdkLoggerInstance {
  appId: string;
  epSdkLogLevel: EEpSdkLogLevel;

  constructor(appId: string) {
    this.appId = appId;
  }

  public setLogLevel: (epSdkLogLevel: EEpSdkLogLevel) => void;

  public createLogEntry = (logName: string, details: ICliLogDetails): ICliLogEntry => {
    return CliLogger.createLogEntry(logName, details);
  }

  public fatal = (logEntry: IEpSdkLogEntry): void => {
    CliLogger.fatal(CliLogger.createLogEntry(logEntry.logName, logEntry));
  }

  public error = (logEntry: IEpSdkLogEntry): void => {
    CliLogger.error(CliLogger.createLogEntry(logEntry.logName, logEntry));
  }

  public warn = (logEntry: IEpSdkLogEntry): void => {
    CliLogger.warn(CliLogger.createLogEntry(logEntry.logName, logEntry));
  }

  public info = (logEntry: IEpSdkLogEntry): void => {
    CliLogger.info(CliLogger.createLogEntry(logEntry.logName, logEntry));
  }

  public debug = (logEntry: IEpSdkLogEntry): void => {
    CliLogger.debug(CliLogger.createLogEntry(logEntry.logName, logEntry));
  }

  public trace = (logEntry: IEpSdkLogEntry): void => {
    CliLogger.trace(CliLogger.createLogEntry(logEntry.logName, logEntry));
  }

}


export class CliLogger {
  private static appId: string;

  public static L = pino({
    name: process.env.CLI_APP_ID || "sep-async-api-importer",
    level: process.env.CLI_LOGGER_LOG_LEVEL || "info",
  });

  public static initialize = (config: TCliLoggerConfig): void => {

    CliLogger.appId = config.appId;
    // setup epSdk logger with a pino logger
    const cliPinoLogger: CliPinoLogger = new CliPinoLogger(config.appId);
    EpSdkLogger.initialize({ epSdkLoggerInstance: cliPinoLogger });

    CliLogger.L = pino({
      name: config.appId,
      level: config.level
    });
  }

  public static createLogEntry = (logName: string, cliLogDetails: ICliLogDetails): ICliLogEntry => {
    const d = new Date();
    return {
      logger: CliPinoLogger.name,
      module: logName,
      appId: this.appId,
      logName: logName,
      timestamp: d.toUTCString(),
      runContext: CliRunContext.getContext(),
      ...cliLogDetails
    };
  }

  public static fatal = (logEntry: ICliLogEntry): void => {
    CliLogger.L.fatal(logEntry);
  }

  public static error = (logEntry: ICliLogEntry): void => {
    CliLogger.L.error(logEntry);
  }

  public static warn = (logEntry: ICliLogEntry): void => {
    CliLogger.L.warn(logEntry);
  }

  public static info = (logEntry: ICliLogEntry): void => {
    CliLogger.L.info(logEntry);
  }

  public static debug = (logEntry: ICliLogEntry): void => {
    CliLogger.L.debug(logEntry);
  }

  public static trace = (logEntry: ICliLogEntry): void => {
    CliLogger.L.trace(logEntry);
  }

}


