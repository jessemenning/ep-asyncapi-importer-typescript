import pino from 'pino';
import { CliConfig, EEnvVars, TCliLoggerConfig } from './CliConfig';


// level: 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'

export enum ECliStatusCodes {
  INFO = "INFO",
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  INITIALIZING = 'INITIALIZING',
  INITIALIZE_ERROR = 'INITIALIZE_ERROR',
  INITIALIZED = 'INITIALIZED',
  
  VALIDATING_SPEC = "VALIDATING_SPEC",
  VALIDATED_SPEC = "VALIDATED_SPEC",
  
  IMPORTING = 'IMPORTING',
  IMPORTING_ERROR = "IMPORTING_ERROR",
  IMPORTED = "IMPORTED",

  IMPORTING_EVENT_API = 'IMPORTING_EVENT_API',
  IMPORTING_EVENT_API_VERSION = 'IMPORTING_EVENT_API_VERSION',
  IMPORTED_EVENT_API_VERSION = 'IMPORTED_EVENT_API_VERSION',

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
  SERVICE_CREATE = "SERVICE_CREATE"
  
}

export type TCliStatus = {
  code: ECliStatusCodes,
  message?: string, 
  details?: any
}

export type TCliLogEntry = {
  name: string;
} & TCliStatus;

export class CliLogger {

  public static L = pino({
    name: process.env.CLI_APP_ID || "sep-async-api-importer",
    level: process.env.CLI_LOGGER_LOG_LEVEL || "info",
  });

  public static initialize = (config: TCliLoggerConfig): void => {
    CliLogger.L = pino({
      name: config.appId,
      level: config.level
    });
  }

  public static createLogEntry = (componentName: string, cliStatus: TCliStatus): TCliLogEntry => {
    return {
      name: componentName,
      ...cliStatus
    };
  }

  public static fatal = (logEntry: TCliLogEntry): void => {
    CliLogger.L.fatal(logEntry);
  }

  public static error = (logEntry: TCliLogEntry): void => {
    CliLogger.L.error(logEntry);
  }

  public static warn = (logEntry: TCliLogEntry): void => {
    CliLogger.L.warn(logEntry);
  }

  public static info = (logEntry: TCliLogEntry): void => {
    CliLogger.L.info(logEntry);
  }

  public static debug = (logEntry: TCliLogEntry): void => {
    CliLogger.L.debug(logEntry);
  }

  public static trace = (logEntry: TCliLogEntry): void => {
    CliLogger.L.trace(logEntry);
  }

}


