import { CliLogger, ECliStatusCodes } from './CliLogger';
import { 
  OpenAPI 
} from './_generated/@solace-iot-team/sep-openapi-node';


export class EPClient {

  public static initialize = (token: string) => {
    const funcName = 'initialize';
    const logName = `${EPClient.name}.${funcName}()`;
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING } ));

    // const base: URL = new URL(OpenAPI.BASE, `${ServerClient.protocol}://${ServerClient.host}:${ServerClient.expressServerConfig.port}${OpenAPI.BASE}`);
    // ServerLogger.trace(ServerLogger.createLogEntry(logName, { code: EServerStatusCodes.INFO, details: { base: base.toString() } } ));
    // OpenAPI.BASE = base.toString();
    // initialize with service account token for bootstrap calls
    OpenAPI.WITH_CREDENTIALS = true;
    OpenAPI.CREDENTIALS = "include";
    OpenAPI.TOKEN = token;

    const _log = {
      ...OpenAPI,
      TOKEN: "***"
    };
    CliLogger.debug(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZED, details: { OpenAPI: _log } } ));
  }

}


