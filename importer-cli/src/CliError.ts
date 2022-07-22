// import { EServerStatusCodes, ServerLogger } from "./ServerLogger";
import CliConfig from "./CliConfig";
import { CliLogger, ECliStatusCodes } from "./CliLogger";
import { ApiError } from "./_generated/@solace-iot-team/sep-openapi-node";
// import ServerStatus from "./ServerStatus";

export class CliErrorFactory {
  public static createCliError = (e: any, logName: string): CliError => {
    let cliError: CliError;
    if (e instanceof CliError ) cliError = e;
    else cliError = new CliErrorFromError(e, logName);
    return cliError;
  }
}
export class CliError extends Error {
  private internalStack: Array<string>;
  private internalLogName: string;
  private internalMessage: string;
  protected appId: string;
  private readonly baseName: string = CliError.name;

  private createArrayFromStack = (stack: any): Array<string> => {
    return stack.split('\n');
  }

  constructor(internalLogName: string, internalMessage?: string) {
    super(internalMessage?internalMessage:internalLogName);
    this.name = this.constructor.name;
    this.internalLogName = internalLogName;
    this.internalStack = this.createArrayFromStack(this.stack);
    this.appId = CliConfig.getCliLoggerConfig().appId;
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
  private originalError: {
    name: string,
    errors: any,
    status: number
  }
  constructor(originalError: any, internalLogName: string) {
    super(internalLogName, originalError.message);
    this.originalError = {
      name: originalError.name,
      errors: originalError.errors || [{ message: originalError.message }],
      status: originalError.status
    }
  }
}

export class CliErrorFromSEPApiError extends CliError {
  protected static defaultDescription = 'SEP Api Error';
  private apiError: ApiError;
  constructor(internalLogName: string, internalMessage: string = CliErrorFromSEPApiError.defaultDescription, apiError: ApiError) {
    super(internalLogName, internalMessage);
    this.apiError = apiError;
  }
}

export class ConfigMissingEnvVarError extends CliError {
  private envVarName: string;
  constructor(internalLogName: string, internalMessage: string, envVarName: string) {
    super(internalLogName, `${internalMessage}: ${envVarName}`);
    this.envVarName = envVarName;
  }
}

export class InvalidFileConfigError extends CliError {
  private filePath: string;
  constructor(internalLogName: string, internalMessage: string, filePath: string) {
    super(internalLogName, `${internalMessage}: ${filePath}`);
    this.filePath = filePath;
  }
}

export class CliInvalidDirConfigEnvVarError extends CliError {
  private dir: string;
  private envVar: string;
  constructor(internalLogName: string, internalMessage: string, envVar: string, dir: string) {
    super(internalLogName, `${internalMessage}: ${envVar}=${dir}`);
    this.dir = dir;
    this.envVar = envVar;
  }
}

export class CliInvalidUrlConfigEnvVarError extends CliError {
  protected static defaultDescription = 'Invalid URL format';
  private url: string;
  private envVar: string;
  private error: any;
  constructor(internalLogName: string, internalMessage: string = CliInvalidUrlConfigEnvVarError.defaultDescription, envVar: string, url: string, error: Error) {
    super(internalLogName, `${internalMessage}: ${envVar}=${url}`);
    this.error = error;
    this.url = url;
    this.envVar = envVar;
  }
}

export class InvalidEnvVarValueFromListError extends CliError {
  private envVarName: string;
  private envVarValue: string;
  private allowedValues: string;
  constructor(internalLogName: string, internalMessage: string, envVarName: string, envVarValue: string, allowedValueList: Array<string>) {
    super(internalLogName, internalMessage);
    this.envVarName = envVarName;
    this.envVarValue = envVarValue;
    this.allowedValues = allowedValueList.join(', ');
  }
}

export class CliAsyncApiSpecError extends CliError {
  private error: any;
  constructor(internalLogName: string, internalMessage: string, error: any) {
    super(internalLogName, internalMessage);
    this.error = error;
  }
}

export class CliAsyncApiParserError extends CliError {
  protected static defaultDescription = 'Async Api Parser Error';
  private paserError: any;
  constructor(internalLogName: string, internalMessage: string = CliAsyncApiParserError.defaultDescription, paserError: any) {
    super(internalLogName, internalMessage);
    this.paserError = paserError;
  }
}


export class CliAsyncApiSpecBestPracticesError extends CliError {
  protected static defaultDescription = 'Async Api Best Practices Error';
  private bestPracticesValidationError: any;
  private value: any;
  constructor(internalLogName: string, internalMessage: string = CliAsyncApiSpecBestPracticesError.defaultDescription, bestPracticesValidationError: any, value: any) {
    super(internalLogName, internalMessage);
    this.bestPracticesValidationError = bestPracticesValidationError;
    this.value = value;
  }
}

export class CliAsyncApiSpecEPValidationError extends CliError {
  protected static defaultDescription = 'EP Async Api Spec Valiation Error';
  private epValidationError: any;
  private value: any;
  constructor(internalLogName: string, internalMessage: string = CliAsyncApiSpecEPValidationError.defaultDescription, error: any, value: any, ) {
    super(internalLogName, internalMessage);
    this.epValidationError = error;
    this.value = value;
  }
}

export class CliAsyncApiSpecNotSupportedError extends CliError {
  protected static defaultDescription = 'Async API Spec - Feature not supported';
  private error: any;
  private featureDescription: any;
  constructor(internalLogName: string, internalMessage: string = CliAsyncApiSpecNotSupportedError.defaultDescription, error: any, featureDescription: any, ) {
    super(internalLogName, internalMessage);
    this.error = error;
    this.featureDescription = featureDescription;
  }

}

export class CliAsyncApiSpecXtensionError extends CliError {
  protected static apiDefaultDescription = 'Async API Spec Xtension Error';
  private xtension: any;
  private asyncApiSpecFile: string;
  constructor(internalLogName: string, message: string = CliAsyncApiSpecXtensionError.apiDefaultDescription, asyncApiSpecFile: string, xtension: string) {
    super(internalLogName, message);
    this.xtension = xtension;
    this.asyncApiSpecFile = asyncApiSpecFile
  }
}

export class CliAbstractMethodError extends CliError {
  private className: string;
  private methodName: string;
  constructor(internalLogName: string, className: string, methodName: string) {
    super(internalLogName, "abstract method called");
    this.className = className;
    this.methodName = methodName;
  }
}

export class CliEPApiContentError extends CliError {
  protected static apiDefaultDescription = 'EP Api Content Error';
  private details: any;
  constructor(internalLogName: string, message: string, details: any) {
    super(internalLogName, message);
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
  protected static apiDefaultDescription = 'Importer Error';
  private details: any;
  constructor(internalLogName: string, message: string, details: any) {
    super(internalLogName, message);
    this.details = details;
  }
}

export class CliEPServiceError extends CliError {
  protected static apiDefaultDescription = 'EP Service Error';
  private details: any;
  constructor(internalLogName: string, message: string, details: any) {
    super(internalLogName, message);
    this.details = details;
  }
}

export class CliUsageError extends CliError {
  protected static apiDefaultDescription = 'CLI Usage Error';
  private details: any;
  constructor(internalLogName: string, message: string, details: any) {
    super(internalLogName, message);
    this.details = details;
  }
}
