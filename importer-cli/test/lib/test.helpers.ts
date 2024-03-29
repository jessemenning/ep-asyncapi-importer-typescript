
import fetch, { RequestInit, HeadersInit, Response, Headers } from "node-fetch";
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import * as sinon from 'sinon';

import request from 'supertest';
import { customRequest } from './customOpenApiRequest';

import { ApiRequestOptions } from "@solace-labs/ep-openapi-node/dist/core/ApiRequestOptions";
import { 
  ApiError,
  OpenAPIConfig,
  CancelablePromise
} from "@solace-labs/ep-openapi-node";
import { ApiResult } from "@solace-labs/ep-openapi-node/dist/core/ApiResult";
import * as __requestLib from '@solace-labs/ep-openapi-node/dist/core/request';

import { CliError } from "../../src/CliError";
import { 
  EpSdkError 
} from "@solace-labs/ep-sdk";
import { TestEnv } from "../setup.spec";


export const getUUID = (): string => {
  return uuidv4();
}

export const testHelperSleep = async(millis = 500) => {
  if(millis > 0) await new Promise(resolve => setTimeout(resolve, millis));
}

export function getOptionalEnvVarValue(envVar: string): string | undefined {
    return process.env[envVar];
}
export function getMandatoryEnvVarValue(scriptName: string, envVar: string): string {
    const value: string | undefined = process.env[envVar];
    if (!value) throw new Error(`>>> ERROR: ${scriptName} - missing env var: ${envVar}`);
    return value;
}
export const getOptionalEnvVarValueAsBoolean = (_scriptName: string, envVarName: string, defaultValue: boolean): boolean => {
  const value: string | undefined = process.env[envVarName];
  if(!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const getMandatoryEnvVarValueAsNumber = (scriptName: string, envVarName: string): number => {
  const value: string = getMandatoryEnvVarValue(scriptName, envVarName);
  const valueAsNumber: number = parseInt(value);
  if (Number.isNaN(valueAsNumber)) throw new Error(`>>> ERROR: ${scriptName} - env var type is not a number: ${envVarName}=${value}`);
  return valueAsNumber;
};
export function getBaseUrl(serverProtocol: string, serverHost: string, serverPort: number, apiBase: string): string {
    return `${serverProtocol}://${serverHost}:${serverPort}${apiBase}`;
}
// export function getRequestAuthHeader(usr: string, pwd: string): string {
//     return "Basic " + Buffer.from(usr + ":" + pwd).toString("base64");
// }

export class TestLogger {
    private static do_log: boolean = true;
    public static setLogging = (do_log: boolean) => { TestLogger.do_log = do_log; }
    public static logResponse = (msg: string, response: ServerResponseHelper) => {
        if(TestLogger.do_log) console.log(`[response] - ${msg}:\n${response.toJson()}`);
    }
    // public static cloneWithHidenSecrets = (config: any) => _.transform(config, (r:any, v:any, k:string) => {
    //     if(_.isObject(v)) {
    //         r[k] = TestLogger.cloneWithHidenSecrets(v)
    //     } else if(typeof k === 'string') {
    //         let _k = k.toLowerCase();
    //         if( _k.includes('token')        ||
    //             _k.includes('pwd')          ||
    //             _k.includes('service_id')   ||
    //             _k.includes('portal_url')   ||
    //             _k.includes('admin_user')   ||
    //             _k.includes('password')     ) {
    //                 r[k] = '***';
    //         } else {
    //             r[k] = v;
    //         }
    //     } else {
    //         r[k] = v;
    //     }            
    // })
    public static logTestEnv = (component: string, testEnv: any) => {
        if(!TestLogger.do_log) return;
        // let te = TestLogger.cloneWithHidenSecrets(testEnv);
        let te = testEnv;
        console.log(`[${component}] - testEnv=${JSON.stringify(te, null, 2)}`);
    }
    public static logMessage = (component: string, msg: string) => {
        if(TestLogger.do_log) console.log(`[${component}] - ${msg}`);
    }
    public static logMessageWithId = (message: string) => {
      if(TestLogger.do_log) console.log(TestLogger.createLogMessage(message));
    }
    public static getLoggingApiRequestOptions = (options: ApiRequestOptions): string => {
        // let logOptions:any = TestLogger.cloneWithHidenSecrets(options);
        let logOptions:any = options;
        // if(logOptions.path.includes('token')) {
        //     logOptions.body = "***";
        // }
        return JSON.stringify(logOptions, null, 2);
    }
    public static getLoggingApiResult = (result: ApiResult): string => {
        // let logResult:any = TestLogger.cloneWithHidenSecrets(result);
        let logResult:any = result;
        // if(logResult && logResult.url && logResult.url.includes('token')) {
        //     logResult.body = "***";
        // }
        return JSON.stringify(logResult, null, 2);
    }
    public static logApiRequestOptions = (id: string, options: ApiRequestOptions) => {
        if(!TestLogger.do_log) return;
        console.log(`[${id}]: ApiRequestOptions=\n${TestLogger.getLoggingApiRequestOptions(options)}\n`);
    }
    public static logApiResult = (id: string, result: ApiResult) => {
        if(!TestLogger.do_log) return;
        console.log(`[${id}]: ApiResult=\n${TestLogger.getLoggingApiResult(result)}\n`);
    }
    public static logApiError = (id: string, apiError: ApiError) => {
        if(!TestLogger.do_log) return;
        console.log(`[${id}]: ApiError=\n${JSON.stringify(apiError, null, 2)}\n`);
    }
    public static createLogMessage = (message: string, obj?: any) : string => {
      return `[${TestContext.getItId()}]: ${message}\nobj=${JSON.stringify(obj, null, 2)}`;
    }
    public static createTestFailMessage = (message: string): string => {
        return `[${TestContext.getItId()}]: ${message}\napiRequestOptions=${TestLogger.getLoggingApiRequestOptions(TestContext.getApiRequestOptions())}\napiResult=${TestLogger.getLoggingApiResult(TestContext.getApiResult())}\napiError=${JSON.stringify(TestContext.getApiError(), null, 2)}\n`;
    }
    public static createTestFailMessageWithCliError = (message: string, e: CliError): string => {
      return `[${TestContext.getItId()}]: ${message}\napiRequestOptions=${TestLogger.getLoggingApiRequestOptions(TestContext.getApiRequestOptions())}\napiResult=${TestLogger.getLoggingApiResult(TestContext.getApiResult())}\napiError=${JSON.stringify(TestContext.getApiError(), null, 2)}\ncliError=${JSON.stringify(e, null, 2)}\n`;
    }
    public static createNotApiErrorMesssage = (message: string): string => {
        return `[${TestContext.getItId()}]: error is not an instance of ApiError, error=${message}`;
    }
    public static createNotCliErrorMesssage = (message: string): string => {
      return `[${TestContext.getItId()}]: error is not an instance of CliError, error=${message}`;
    }
    public static createWrongEpSdkErrorMesssage = (epSdkError: EpSdkError): string => {
      return `[${TestContext.getItId()}]: wrong epSdkError instance, epSdkError=\n${epSdkError.toString()}`;
    }
    public static createEpSdkTestFailMessage = (message: string, epSdkError: EpSdkError): string => {
      return `[${TestContext.getItId()}]: message=${message}, epSdkError=${epSdkError}`;
    }
  
}

type THeaders = Array<{ key: string, value: string}>;;
export class ServerResponseHelper {
    public status: number;
    public statusText: string;
    public url: string;
    public body: string;
    public responseHeaders: Headers;
    public headers: THeaders;

    constructor(fetchResponse: Response, body: string) {
        this.status = fetchResponse.status;
        this.statusText = fetchResponse.statusText;
        this.url = fetchResponse.url;
        this.body = body;
        this.responseHeaders = fetchResponse.headers;
    }
    public static create = async(fetchResponse: Response) => {
        // const isContentTypeJson: boolean = (fetchResponse.headers.has('content-type') && fetchResponse.headers.get('content-type').toLowerCase().includes('json') ? true : false);
        let isContentTypeJson: boolean = false;
        if (fetchResponse.headers.has('content-type')) {
          const contentType: string | null = fetchResponse.headers.get('content-type');
          if(contentType !== null) isContentTypeJson = contentType.toLowerCase().includes('json');
        }
        const bodyText: string | null = await fetchResponse.text();
        let bodyJson: string;
        if (isContentTypeJson && bodyText !== null) {
            try {
                bodyJson = JSON.parse(bodyText);
            } catch (err) {
                throw new Error(`error parsing response text as json: ${err}, text=${bodyText}`);
            }
        } else {
            bodyJson = JSON.parse(JSON.stringify({ raw: bodyText }));
        }
        return new ServerResponseHelper(fetchResponse, bodyJson);
    }
    toJson = (): string => {
      this.responseHeaders.forEach( (key: string, value: string) => {
        this.headers.push({key: key, value: value});
      });
      return JSON.stringify(this, null, 2);
    }
}

export class ServerRequestHelper {
    public static ContentTypeApplicationJson = "application/json";
    public static ContentTypeTextPlain = "text/plain";

    private baseUrl: string;
    private headers: HeadersInit;

    constructor(serverProtocol: string, serverHost: string, serverPort: number, apiBase: string) {
        this.baseUrl = getBaseUrl(serverProtocol, serverHost, serverPort, apiBase);
        // let pw : string = null;
        // if (typeof platformAdminPassword === 'string' || platformAdminPassword instanceof String){
        //   pw = platformAdminPassword as string;
        // } else {
        //   pw = platformAdminPassword.password;
        // }
        
        // this.headers = {
        //     Authorization: getRequestAuthHeader(platformAdminUser, pw)
        //     // "Content-Type": "application/json"
        // }
        this.headers = {};
    }
    fetch = async(apiPath: string, requestInit: RequestInit, contentType: string = ServerRequestHelper.ContentTypeApplicationJson): Promise<ServerResponseHelper> => {
        let uri = this.baseUrl + "/" + apiPath;
        requestInit.headers = this.headers;
        requestInit.headers["Content-Type"] = contentType;
        let fetchResponse: Response = await fetch(uri, requestInit);
        let response: ServerResponseHelper = await ServerResponseHelper.create(fetchResponse);
        return response;
    } 
}

export function _getObjectDifferences(object: any, base: any): any {
	function changes(object: any, base: any): any {
		return _.transform(object, function(result, value, key) {
			if (!_.isEqual(value, base[key])) {
				result[key] = (_.isObject(value) && _.isObject(base[key])) ? changes(value, base[key]) : value;
			}
		});
	}
    let _changes = changes(object, base);
        // check for empty keys
	return changes(object, base);
}

export function getObjectDifferences(object: any, base: any): any {
    let leftDiff: any = _getObjectDifferences(object, base);
    let rightDiff: any = _getObjectDifferences(base, object);
    // warning: overrides arrays
    return _.merge(leftDiff, rightDiff);
}

export type ExpectDiff = {
    diff: any,
    message: string
}
export function getExpectEqualDiff(expected: any, received: any): ExpectDiff {
    let diff = getObjectDifferences(expected, received);
    let message = `\nexpected response=${JSON.stringify(expected, null, 2)}, \nactual response=${JSON.stringify(received, null, 2)}, \ndiff=${JSON.stringify(diff, null, 2)}`;
    return { diff: diff, message: message };
}
export function getExpectContainedDiff(containedObject: any, object: any): ExpectDiff {
    let compositeObject = _.merge(_.cloneDeep(containedObject), object);
    let diff = getObjectDifferences(compositeObject, object);
    let message = `\nexpected response contained=${JSON.stringify(containedObject, null, 2)}, \nactual response=${JSON.stringify(object, null, 2)}, \ndiff not contained in response=${JSON.stringify(diff, null, 2)}`;
    return { diff: diff, message: message };
}

export type TTestEnv = {
  projectRootDir: string;
  enableLogging: boolean,
  enableApiLogging: boolean;
  testApiSpecsDir: string;
  // globalDomainNamePrefix: string;
  createdAppDomainNameList: Array<string>;
  testRunId: string;
}

export class TestContext {

    private static itId: string;
    private static apiRequestOptions: ApiRequestOptions;
    private static apiResult: ApiResult;
    private static apiError: ApiError;
    private static testEnv: TTestEnv;

    public static newItId() {
        TestContext.itId = uuidv4().replace(/-/g, '_');
    }
    public static getItId(): string {
        return TestContext.itId;
    }
    public static setFromSuperTestRequestResponse(res: request.Response) {
      const response: any = JSON.parse(JSON.stringify(res));
      TestContext.apiRequestOptions = {
        method: response.req.method,
        // path: response.req.url,
        headers: response.req.headers,
        url: response.req.url,
      };
      let body:any = res.text;
      let isBodyJSON = false;
      try {
        body = JSON.parse(res.text)
        isBodyJSON = true;
      } catch(e) {
        body = res.text
      }
      TestContext.apiResult = {
        status: response.status,
        ok: response.status === 200 ? true : false,
        url: response.req.url,
        statusText: '?',
        body: body
      };
      if (isBodyJSON && typeof body === 'object' && 'errorId' in body) {
        TestContext.apiError = {
          name: body.errorId,
          message: body.description,
          status: response.status,
          statusText: '?',
          url: response.req.url,
          body: body
        }  
      } else TestContext.apiError = undefined;
    }
    public static setApiRequestOptions(options: ApiRequestOptions) {
        TestContext.apiRequestOptions = options;
    }
    public static getApiRequestOptions(): ApiRequestOptions {
        return TestContext.apiRequestOptions;
    }
    public static setApiResult(result: ApiResult) {
        TestContext.apiResult = result;
    }
    public static getApiResult(): ApiResult {
        return TestContext.apiResult;
    }
    public static setApiError(error: ApiError) {
        TestContext.apiError = error;
    }
    public static getApiError(): ApiError {
        return TestContext.apiError;
    }
    public static setTestEnv = (testEnv: TTestEnv) => {
      TestContext.testEnv = testEnv;
    }
    public static getTestEnv = (): TTestEnv => {
      return TestContext.testEnv;
    } 
    // public static getApiBase = (): string => {
    //   return TestContext.testEnv.apiBase;
    // }
}

// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Stubbing global request from openapi
// export const request = <T>(config: OpenAPIConfig, options: ApiRequestOptions): CancelablePromise<T> => {
  const stub = sinon.stub(__requestLib, 'request');
  stub.callsFake((config: OpenAPIConfig, options: ApiRequestOptions): CancelablePromise<ApiResult> => {
  
      TestContext.setApiRequestOptions(options);
      if(TestEnv.enableApiLogging) TestLogger.logApiRequestOptions(TestContext.getItId(), options);
  
      TestContext.setApiResult(undefined);
      TestContext.setApiError(undefined);

      // const cancelablePromise = stub.wrappedMethod(config, options) as CancelablePromise<ApiResult>;
      // call my own request
      
      const cancelablePromise = customRequest(config, options) as CancelablePromise<ApiResult>;

      cancelablePromise.then((value: ApiResult) => {
          TestContext.setApiResult(value);
          if(TestEnv.enableApiLogging) TestLogger.logApiResult(TestContext.getItId(), TestContext.getApiResult());
      }, (reason) => {
          TestContext.setApiError(reason);
          TestLogger.logApiError(TestContext.getItId(), TestContext.getApiError());
      });
  
      return cancelablePromise;
  });
  