import CliConfig from "./CliConfig";
import { CliLogger, ECliStatusCodes } from "./CliLogger";
import { ApiError } from "@solace-labs/ep-openapi-node";
import { EpSdkError } from "@solace-labs/ep-sdk";
import { EpAsyncApiError, EpAsyncApiParserError } from "@solace-labs/ep-asyncapi";

export class CliErrorFactory {
  public static createCliError = ({ logName, e}: {
    logName: string;
    e: Error;
  }): CliError => {
    let cliError: CliError;
    if(e instanceof CliError) {
      return e;
    } else if(e instanceof EpAsyncApiError) {
      cliError = new CliErrorFromEpAsyncApiError(logName, e);
    } else if(e instanceof EpAsyncApiParserError) {
      cliError = new CliAsyncApiParserError(logName, e);
    } else if(e instanceof EpSdkError) {
      cliError = new CliErrorFromEpSdkError(logName, e);
    } else if(e instanceof ApiError) {
      cliError = new CliErrorFromEPApiError(logName, e);
    } else {
      cliError = new CliErrorFromError(logName, e);
    }
    return cliError;
  }
}
export class CliError extends Error {
  private internalStack: Array<string>;
  private internalLogName: string;
  private internalMessage: string;
  protected appName: string;
  private readonly baseName: string = CliError.name;

  private createArrayFromStack = (stack: any): Array<string> => {
    return stack.split('\n');
  }

  constructor(internalLogName: string, internalMessage?: string) {
    super(internalMessage?internalMessage:internalLogName);
    this.name = this.constructor.name;
    this.internalLogName = internalLogName;
    this.internalStack = this.createArrayFromStack(this.stack);
    this.appName = CliConfig.getAppName();
  }

  public toString = (): string => {
    return JSON.stringify(this.toObject(), null, 2);
  }

  public toObject = (): any => {
    const funcName = 'toObject';
    const logName = `${CliError.name}.${funcName}()`;
    try {
      return JSON.parse(JSON.stringify(this));
    } catch (e: any) {
      CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INTERNAL_ERROR, message: `JSON.parse error`, details: { name: e.name, message: e.message } }));    
      return {
        internalLogName: this.internalLogName,
        internalMessage: this.internalMessage ? this.internalMessage : `JSON.parse error: ${e.name}: ${e.message}`,
        internalStack: this.internalStack
      }
    }
  }
}

export class CliErrorFromError extends CliError {
  private originalError: any;
  constructor(internalLogName: string, originalError: Error) {
    super(internalLogName, originalError.message);
    this.originalError = `${originalError.name}: ${originalError.message}`;
  }
}

export class CliErrorFromEpSdkError extends CliError {
  protected static DefaultDescription = 'EP SDK Error';
  public epSdkError: EpSdkError;
  constructor(internalLogName: string, epSdkError: EpSdkError) {
    super(internalLogName, CliErrorFromEpSdkError.DefaultDescription);
    this.epSdkError = epSdkError;
  }
}

export class CliErrorFromEpAsyncApiError extends CliError {
  protected static DefaultDescription = 'EP AsyncAPI Error';
  public epAsyncApiError: EpAsyncApiError;
  constructor(internalLogName: string, epAsyncApiError: EpAsyncApiError) {
    super(internalLogName, CliErrorFromEpAsyncApiError.DefaultDescription);
    this.epAsyncApiError = epAsyncApiError;
  }
}

export class CliErrorFromEPApiError extends CliError {
  protected static DefaultDescription = 'Event Portal Api Error';
  private apiError: ApiError;
  constructor(internalLogName: string, apiError: ApiError) {
    super(internalLogName, CliErrorFromEPApiError.DefaultDescription);
    this.apiError = apiError;
  }
}

export class CliConfigNotInitializedError extends CliError {
  private static DefaultDescription = 'CliConfig not Initialized Error';
  constructor(internalLogName: string) {
    super(internalLogName, CliConfigNotInitializedError.DefaultDescription);
  }
}

export class CliConfigMissingEnvVarError extends CliError {
  private static DefaultDescription = 'Missing Environment Variable Error';
  private envVarName: string;
  constructor(internalLogName: string, envVarName: string) {
    super(internalLogName, CliConfigMissingEnvVarError.DefaultDescription);
    this.envVarName = envVarName;
  }
}

export class CliConfigInvalidDirEnvVarError extends CliError {
  private static DefaultDescription = 'Invalid Directory Error';
  private dir: string;
  private envVar: string;
  private cause: string;
  constructor(internalLogName: string, envVar: string, dir: string, cause: string) {
    super(internalLogName, CliConfigInvalidDirEnvVarError.DefaultDescription);
    this.dir = dir;
    this.envVar = envVar;
    this.cause = cause;
  }
}

export class CliConfigInvalidUrlEnvVarError extends CliError {
  private static DefaultDescription = 'Invalid URL format';
  private url: string;
  private envVar: string;
  private error: any;
  constructor(internalLogName: string, envVar: string, url: string, error: Error) {
    super(internalLogName, CliConfigInvalidUrlEnvVarError.DefaultDescription);
    this.error = error;
    this.url = url;
    this.envVar = envVar;
  }
}

export class CliConfigInvalidEnvVarValueOptionError extends CliError {
  private static DefaultDescription = 'Invalid Environment Variable Option Error';
  private envVarName: string;
  private envVarValue: string;
  private options: string;
  constructor(internalLogName: string, envVarName: string, envVarValue: string, options: Array<string>) {
    super(internalLogName, CliConfigInvalidEnvVarValueOptionError.DefaultDescription);
    this.envVarName = envVarName;
    this.envVarValue = envVarValue;
    this.options = options.join(', ');
  }
}

export class CliAsyncApiParserError extends CliError {
  protected static DefaultDescription = 'Async Api Parser Error';
  private parserError: any;
  constructor(internalLogName: string, parserError: any) {
    super(internalLogName, CliAsyncApiParserError.DefaultDescription);
    this.parserError = parserError;
  }
}

export class CliAsyncApiSpecFeatureNotSupportedError extends CliError {
  protected static DefaultDescription = 'Async API Spec - Feature not supported';
  private featureDescription: any;
  constructor(internalLogName: string, message: string, featureDescription: any, ) {
    super(internalLogName, `${CliAsyncApiSpecFeatureNotSupportedError.DefaultDescription}: ${message}`);
    this.featureDescription = featureDescription;
  }
}

export class CliAbstractMethodError extends CliError {
  protected static DefaultDescription = 'Abstract Method Error';
  private className: string;
  private methodName: string;
  constructor(internalLogName: string, className: string, methodName: string) {
    super(internalLogName, CliAbstractMethodError.DefaultDescription);
    this.className = className;
    this.methodName = methodName;
  }
}

export class CliInternalCodeInconsistencyError extends CliError {
  protected static DefaultDescription = 'Internal Code Inconsistency Error';
  private details: any;
  constructor(internalLogName: string, details: any) {
    super(internalLogName, CliInternalCodeInconsistencyError.DefaultDescription);
    this.details = details;
  }
}

export class CliEPApiContentError extends CliError {
  protected static DefaultDescription = 'Event Portal Api Content Error';
  private details: any;
  constructor(internalLogName: string, message: string, details: any) {
    super(internalLogName, `${CliEPApiContentError.DefaultDescription}: ${message}`);
    this.details = details;
  }
}

export class EPApiResponseApiError extends CliError {
  protected static apiDefaultDescription = 'EP Api Error';
  private apiError: ApiError;
  constructor(apiError: ApiError, internalLogName: string, internalMessage: string) {
    super(internalLogName, internalMessage);
    this.apiError = apiError;
  }
}

export class CliImporterError extends CliError {
  protected static DefaultDescription = 'Importer Error';
  private details: any;
  constructor(internalLogName: string, cause: string, details: any) {
    super(internalLogName, `${CliImporterError.DefaultDescription}: ${cause}`);
    this.details = details;
  }
}

export class CliImporterFeatureNotSupportedError extends CliError {
  protected static DefaultDescription = 'Importer Error - Feature not supported';
  private error: any;
  private featureDescription: any;
  constructor(internalLogName: string, error: any, featureDescription: any, ) {
    super(internalLogName, CliImporterFeatureNotSupportedError.DefaultDescription);
    this.error = error;
    this.featureDescription = featureDescription;
  }
}

export class CliImporterTestRunAssetsInconsistencyError extends CliError {
  protected static DefaultDescription = 'Importer Test Run Assets Inconsistency Error';
  private details: any;
  constructor(internalLogName: string, details: any) {
    super(internalLogName, CliImporterTestRunAssetsInconsistencyError.DefaultDescription);
    this.details = details;
  }
}

export class CliUsageError extends CliError {
  protected static DefaultDescription = 'CLI Usage Error';
  private details: any;
  constructor(internalLogName: string, message: string, details: any) {
    super(internalLogName, `${CliUsageError.DefaultDescription}: ${message}`);
    this.details = details;
  }
}
