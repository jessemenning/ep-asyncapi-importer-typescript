import { CliLogger, ECliStatusCodes } from './CliLogger';
import { 
  OpenAPI 
} from './_generated/@solace-iot-team/sep-openapi-node';


export class EPClient {

  public static initialize = ({ token, baseUrl }:{
    token: string;
    baseUrl: string;
  }) => {
    const funcName = 'initialize';
    const logName = `${EPClient.name}.${funcName}()`;
    CliLogger.info(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INITIALIZING, details: {
      baseUrl: baseUrl
    }}));

    const base: URL = new URL(baseUrl);
    OpenAPI.BASE = baseUrl;
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


