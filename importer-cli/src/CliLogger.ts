import pino from 'pino';
import { TCliLoggerConfig } from './CliConfig';
import CliRunContext, { ICliRunContext } from './CliRunContext';


// level: 'fatal', 'error', 'warn', 'info', 'debug', 'trace' or 'silent'

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

export type TCliStatus = {
  code: ECliStatusCodes,
  message?: string, 
  details?: any
}

export type TCliLogEntry = {
  name: string;
  runContext: ICliRunContext;
} & TCliStatus;

export class CliLogger {
  private static level: string;

  public static L = pino({
    name: process.env.CLI_APP_ID || "sep-async-api-importer",
    level: process.env.CLI_LOGGER_LOG_LEVEL || "info",
  });

  public static initialize = (config: TCliLoggerConfig): void => {
    CliLogger.level = config.level;
    CliLogger.L = pino({
      name: config.appId,
      level: config.level
    });
  }

  public static isLevelTrace = (): boolean => {
    return CliLogger.level === 'trace';
  }

  public static createLogEntry = (componentName: string, cliStatus: TCliStatus): TCliLogEntry => {
    return {
      name: componentName,
      runContext: CliRunContext.getContext(),
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


