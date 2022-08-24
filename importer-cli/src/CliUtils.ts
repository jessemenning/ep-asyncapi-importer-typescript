import fs from 'fs';
import path from 'path';
import glob from 'glob';
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';
import { EEpSdkSchemaContentType } from '@solace-labs/ep-sdk';
import { CliInternalCodeInconsistencyError, CliUsageError } from './CliError';
import { E_EpAsyncApiContentTypes } from '@solace-labs/ep-asyncapi';


// export type APSOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type TDeepDiffFromTo = {
  from: any;
  to: any;
}
export interface IDeepCompareResult {
  isEqual: boolean;
  difference: Record<string, TDeepDiffFromTo> | undefined;
}


type DotPrefix<T extends string> = T extends "" ? "" : `.${T}`

type DotNestedKeys<T> = (T extends object ?
    { [K in Exclude<keyof T, symbol>]: `${K}${DotPrefix<DotNestedKeys<T[K]>>}` }[Exclude<keyof T, symbol>]
    : "") extends infer D ? Extract<D, string> : never;

export class CliUtils {

  public static nameOf = <T>(name: DotNestedKeys<T>) => name;

  public static getUUID = (): string => {
    return uuidv4();
  }

  public static sleep = async(millis = 500) => {
    if(millis > 0) await new Promise(resolve => setTimeout(resolve, millis));
  }
  
  public static createFileList = (filePattern: string): Array<string> => {
    const funcName = 'createFileList';
    const logName = `${CliUtils.name}.${funcName}()`;
    const fileList: Array<string> = glob.sync(filePattern);
    if(fileList.length === 0) throw new CliUsageError(logName, 'no files found for pattern', {
      filePattern: filePattern,
    });
    for(const filePath of fileList) {
      const x: string | undefined = CliUtils.validateFilePathWithReadPermission(filePath);
      if(x === undefined) throw new CliUsageError(logName, 'file does not have read permissions', {
        file: filePath,
      });
    }
    return fileList;
  }
  
  public static validateFilePathWithReadPermission = (filePath: string): string | undefined => {
    try {
      const absoluteFilePath = path.resolve(filePath);
      // console.log(`validateFilePathWithReadPermission: absoluteFilePath=${absoluteFilePath}`);
      fs.accessSync(absoluteFilePath, fs.constants.R_OK);
      return absoluteFilePath;
    } catch (e) {
      // console.log(`validateFilePathWithReadPermission: filePath=${filePath}`);
      // console.log(`e=${e}`);
      return undefined;
    }
  }

  public static ensureDirExists = (baseDir: string, subDir?: string): string => {
    const absoluteDir = subDir ? path.resolve(baseDir, subDir) : path.resolve(baseDir);
    if(!fs.existsSync(absoluteDir)) fs.mkdirSync(absoluteDir, { recursive: true });
    fs.accessSync(absoluteDir, fs.constants.W_OK);
    return absoluteDir;
  }

  public static ensureDirOfFilePathExists = (filePath: string): string => {
    const normalizedPath = path.normalize(filePath);
    const dirName = path.dirname(normalizedPath);
    const fileName = path.basename(normalizedPath)
    const absoluteDir = CliUtils.ensureDirExists(dirName);
    return `${absoluteDir}/${fileName}`;
  }

  public static convertStringToFilePath(str: string): string {
    return str.replaceAll(/[^0-9a-zA-Z\/\.]+/g, '-');
  }

  public static readFileContentsAsJson = (filePath: string): any => {
    const b: Buffer = fs.readFileSync(filePath);
    try {
      return JSON.parse(b.toString());
    } catch(e) {
      throw e;
    }
  }

  public static saveContents2File = ({ content, filePath}: {
    content: any;
    filePath: string;
  }) => {
    fs.writeFileSync(filePath, content, { encoding: "utf8"});
  }

  public static assertNever = (extLogName: string, x: never): never => {
    const funcName = 'assertNever';
    const logName = `${CliUtils.name}.${funcName}()`;
    throw new Error(`${logName}:${extLogName}: unexpected object: ${JSON.stringify(x)}`);
  }

  public static getPropertyNameString = <T extends Record<string, unknown>>(obj: T, selector: (x: Record<keyof T, keyof T>) => keyof T): keyof T => {
    const keyRecord = Object.keys(obj).reduce((res, key) => {
      const typedKey = key as keyof T
      res[typedKey] = typedKey
      return res
    }, {} as Record<keyof T, keyof T>)
    return selector(keyRecord)
  }

  public static isEqualDeep = (one: any, two: any): boolean => {
    return _.isEqual(one, two);
  }

  /**
   * Deep diff between two object-likes
   * @param  {Object} fromObject the original object
   * @param  {Object} toObject   the updated object
   * @return {Object}            a new object which represents the diff
   */
  public static deepDiff(fromObject: any, toObject: any): Record<string, TDeepDiffFromTo> {
    const changes: any = {};

    const buildPath = (obj: any, key: string, path?: string) => {
      obj;
      return _.isUndefined(path) ? key : `${path}.${key}`;
    }

    const walk = (fromObject: any, toObject: any, path?: string) => {
        for (const key of _.keys(fromObject)) {
            const currentPath = buildPath(fromObject, key, path);
            if (!_.has(toObject, key)) {
                changes[currentPath] = {from: _.get(fromObject, key)};
            }
        }

        for (const [key, to] of _.entries(toObject)) {
            const currentPath = buildPath(toObject, key, path);
            if (!_.has(fromObject, key)) {
                changes[currentPath] = {to};
            } else {
                const from = _.get(fromObject, key);
                if (!_.isEqual(from, to)) {
                    if (_.isObjectLike(to) && _.isObjectLike(from)) {
                        walk(from, to, currentPath);
                    } else {
                        changes[currentPath] = {from, to};
                    }
                }
            }
        }
    };

    walk(fromObject, toObject);

    return changes;
  }

  public static deepSortStringArraysInObject(obj: any): any {
    if(typeof(obj) !== 'object') throw new TypeError('expected obj to be an object');
    for(const key in obj) {
      const value = obj[key];
      if(typeof(value) === 'object') {
        obj[key] = CliUtils.deepSortStringArraysInObject(obj[key]);
      } else if(Array.isArray(value)) {
        if(value.length > 0 && typeof(value[0]) === 'string') {
          value.sort();
        }
        obj[key] = value;
      }
    }
    return obj;
  }

  public static prepareCompareObject4Output(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (_k,v) => {
      if(v === undefined) return 'undefined';
      return v;
    }));
  }

  private static createCleanCompareObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (_k, v) => {
      if(v === null) return undefined;
      return v;
    }));
  }

  public static deepCompareObjects({ existingObject, requestedObject }:{
    existingObject: any;
    requestedObject: any;
  }): IDeepCompareResult {
    const cleanExistingObject = CliUtils.createCleanCompareObject(existingObject);
    const cleanRequestedObject = CliUtils.createCleanCompareObject(requestedObject);
    const isEqual = CliUtils.isEqualDeep(cleanExistingObject, cleanRequestedObject);
    let deepDiffResult: Record<string, TDeepDiffFromTo> | undefined = undefined;
    if(!isEqual) {
      deepDiffResult = CliUtils.deepDiff(cleanExistingObject, cleanRequestedObject);
    }
    return {
      isEqual: isEqual,
      difference: deepDiffResult
    };
  }

  public static map_MessageDocumentContentType_To_EpSchemaContentType(messageContentType: E_EpAsyncApiContentTypes): EEpSdkSchemaContentType {
    const funcName = 'map_MessageDocumentContentType_To_EpSchemaContentType';
    const logName = `${CliUtils.name}.${funcName}()`;
    switch(messageContentType) {
      case E_EpAsyncApiContentTypes.APPLICATION_JSON:
        return EEpSdkSchemaContentType.APPLICATION_JSON;
      default:
        CliUtils.assertNever(logName, messageContentType);
    }
    throw new CliInternalCodeInconsistencyError(logName, {
      message: 'map message content type', 
      messageContentType: messageContentType 
    });
  }

}