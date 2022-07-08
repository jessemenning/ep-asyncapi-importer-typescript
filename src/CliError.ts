// import { EServerStatusCodes, ServerLogger } from "./ServerLogger";
import CliConfig from "./CliConfig";
import { CliLogger, ECliStatusCodes } from "./CliLogger";
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

// export class ServerFatalError extends ServerError {
//   private originalError: {
//     name: string,
//     errors: any,
//     status: number
//   }
//   constructor(originalError: any, internalLogName: string) {
//     super(internalLogName, originalError.message);
//     this.originalError = {
//       name: originalError.name,
//       errors: originalError.errors || [{ message: originalError.message }],
//       status: originalError.status
//     }
//   }
// }
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

export class AsyncApiSpecError extends CliError {
  private error: any;
  constructor(internalLogName: string, internalMessage: string, error: any) {
    super(internalLogName, internalMessage);
    this.error = error;
  }
}

export class AsyncApiSpecXtensionError extends CliError {
  private xtension: any;
  constructor(internalLogName: string, internalMessage: string, xtension: string) {
    super(internalLogName, internalMessage);
    this.xtension = xtension;
  }
}

export class AbstractMethodError extends CliError {
  private className: string;
  private methodName: string;
  constructor(internalLogName: string, className: string, methodName: string) {
    super(internalLogName, "abstract method called");
    this.className = className;
    this.methodName = methodName;
  }
}
