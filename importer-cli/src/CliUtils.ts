import fs from 'fs';
import path from 'path';
import _ from "lodash";
import { v4 as uuidv4 } from 'uuid';


// export type APSOptional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export class CliUtils {

  public static getUUID = (): string => {
    return uuidv4();
  }

  public static sleep = async(millis = 500) => {
    if(millis > 0) await new Promise(resolve => setTimeout(resolve, millis));
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

  public static ensurePathExists = (dir: string) => {
    const absoluteFilePath = path.resolve(dir);
    if(!fs.existsSync(absoluteFilePath)) fs.mkdirSync(absoluteFilePath, { recursive: true });
    fs.accessSync(absoluteFilePath, fs.constants.W_OK);
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
  public static deepDiff(fromObject: any, toObject: any): any {
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

  
}