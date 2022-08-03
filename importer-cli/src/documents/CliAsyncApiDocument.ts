import yaml from "js-yaml";

import { AsyncAPIDocument, Message, Channel } from '@asyncapi/parser';
import { TCliAppConfig } from '../CliConfig';
import { 
  CliAsyncApiSpecBestPracticesError, 
  CliAsyncApiSpecError, 
  CliAsyncApiSpecXtensionError
} from '../CliError';
import CliSemVerUtils from '../CliSemVerUtils';
import { CliMessageDocument } from './CliMessageDocument';
import { CliChannelDocument, CliChannelParameterDocument, CliChannelPublishOperation, CliChannelSubscribeOperation } from './CliChannelDocument';
import EpSdkEventApiVersionsService from '@solace-iot-team/ep-sdk/services/EpSdkEventApiVersionsService';

enum E_EP_Extensions {
  X_APPLICATION_DOMAIN_NAME = "x-sep-application-domain-name",
};

export enum E_ASYNC_API_SPEC_CONTENNT_TYPES {
  APPLICATION_JSON = "application/json"
}

export type CliMessageDocumentMap = Map<string, CliMessageDocument>;
export type CliChannelDocumentMap = Map<string, CliChannelDocument>;
export type CliChannelParameterDocumentMap = Map<string, CliChannelParameterDocument>;
export type CliEventNames = {
  publishEventNames: Array<string>;
  subscribeEventNames: Array<string>;
}

export class CliAsyncApiDocument {
  private appConfig: TCliAppConfig;
  private asyncApiDocument: AsyncAPIDocument;
  private asyncApiDocumentJson: any;
  private applicationDomainName: string;

  private getJSON(asyncApiDocument: AsyncAPIDocument): any {
    const funcName = 'getJSON';
    const logName = `${CliAsyncApiDocument.name}.${funcName}()`;
    const anyDoc: any = asyncApiDocument;
    if(anyDoc["_json"] === undefined) throw new CliAsyncApiSpecError(logName, '_json not found in parse async api spec', {});
    return anyDoc["_json"];
  }

  private get_X_ApplicationDomainName(): string | undefined {
    // TODO: there should be a parser method to get this
    return this.asyncApiDocumentJson[E_EP_Extensions.X_APPLICATION_DOMAIN_NAME];
  }

  private determineApplicationDomainName(): string {
    const funcName = 'determineApplicationDomainName';
    const logName = `${CliAsyncApiDocument.name}.${funcName}()`;

    let appDomainName: string | undefined = this.appConfig.domainName;
    if(appDomainName === undefined) {
      const specAppDomainName = this.get_X_ApplicationDomainName();
      if(specAppDomainName === undefined) appDomainName = undefined;
      else if(this.appConfig.prefixDomainName !== undefined) appDomainName = `${this.appConfig.prefixDomainName}/${specAppDomainName}`;
      else appDomainName = specAppDomainName;
    }
    if(appDomainName === undefined) throw new CliAsyncApiSpecXtensionError(logName, "no application domain name defined, define either in spec or on command line", this.appConfig.asyncApiFileName, E_EP_Extensions.X_APPLICATION_DOMAIN_NAME);

    return appDomainName;
  }

  private validate_EP(): void {
    
    EpSdkEventApiVersionsService.validateDisplayName({ displayName: this.getTitle() });

  }

  private validate_BestPractices(): void {
    const funcName = 'validate_BestPractices';
    const logName = `${CliAsyncApiDocument.name}.${funcName}()`;

    // version must be in SemVer format
    const versionStr: string = this.getVersion();
    if(!CliSemVerUtils.isSemVerFormat({ versionString: versionStr })) {
      throw new CliAsyncApiSpecBestPracticesError(logName, undefined, "Please use semantic versioning format for API version.", { versionString: versionStr });
    }
    // check that all channels have a message - must not be inline
    // validate channel param schemas - must be unique

    // TODO
  }

  
  constructor(asyncApiDocument: AsyncAPIDocument, appConfig: TCliAppConfig) {
    this.asyncApiDocument = asyncApiDocument;
    this.asyncApiDocumentJson = this.getJSON(asyncApiDocument);
    this.appConfig = appConfig;
    this.applicationDomainName = this.determineApplicationDomainName();
  }

  public getAsyncApiVersion(): string { return this.asyncApiDocument.version(); }

  public getTitle(): string { return this.asyncApiDocument.info().title(); }

  public getVersion(): string { return this.asyncApiDocument.info().version(); }

  public getDescription(): string { 
    const descr: string | null = this.asyncApiDocument.info().description();
    if(descr) return descr;
    return '';
  }

  public getApplicationDomainName(): string { return this.applicationDomainName; }

  public getTitleAsFilePath(): string {
    return this.getTitle();
  }

  public getTitleAsFileName(ext: string): string {
    return `${this.getTitle()}.${ext}`;
  }

  public getSpecAsSanitizedJson(): any {
    // not deep
    // const sanitized = _.omitBy(this.asyncApiDocumentJson, (value, key) => {
    //   value;
    //   if(key.startsWith("x-parser")) return false;
    //   return true;
    // });

    const sanitized = JSON.parse(JSON.stringify(this.asyncApiDocumentJson, (k,v) => {
      if(k.startsWith("x-parser")) return undefined;
      return v;
    }));

    return sanitized;
  }

  public getSpecAsSanitizedYamlString(): string {
    const json = this.getSpecAsSanitizedJson();
    return yaml.dump(json);
  }

  public getEventNames(): CliEventNames {
    const cliEventNames: CliEventNames = {
      publishEventNames: [],
      subscribeEventNames: [],
    };
    const cliChannelDocumentMap: CliChannelDocumentMap = this.getChannelDocuments();
    for(const [topic, cliChannelDocument] of cliChannelDocumentMap) {
      const cliChannelPublishOperation: CliChannelPublishOperation | undefined = cliChannelDocument.getChannelPublishOperation();
      if(cliChannelPublishOperation !== undefined) {
        const cliMessageDocument: CliMessageDocument = cliChannelPublishOperation.getCliMessageDocument()
        cliEventNames.publishEventNames.push(cliMessageDocument.getMessageName());
      }
      const cliChannelSubscribeOperation: CliChannelSubscribeOperation | undefined = cliChannelDocument.getChannelSubscribeOperation();
      if(cliChannelSubscribeOperation !== undefined) {
        const cliMessageDocument: CliMessageDocument = cliChannelSubscribeOperation.getCliMessageDocument()
        cliEventNames.subscribeEventNames.push(cliMessageDocument.getMessageName());
      }
    }
    return cliEventNames;
  }

  public getChannelDocuments(): CliChannelDocumentMap {

    const channels: Record<string, Channel> = this.asyncApiDocument.channels();

    const cliChannelDocumentMap: CliChannelDocumentMap = new Map<string, CliChannelDocument>();
    for(const [key, value] of Object.entries(channels)) {
      const cliChannelDocument = new CliChannelDocument(this, value);
      cliChannelDocumentMap.set(key, cliChannelDocument);
    }
    return cliChannelDocumentMap;
  }

  public getMessageDocuments(): CliMessageDocumentMap {
    // const funcName = 'getMessageDocuments';
    // const logName = `${CliAsyncApiDocument.name}.${funcName}()`;

    const allMessages: Map<string, Message> = this.asyncApiDocument.allMessages();

    const allCliMessageDocumentMap: CliMessageDocumentMap = new Map<string, CliMessageDocument>();
    
    for(let [key, message] of allMessages) {
      // // switch off
      // CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, details: {
      //   key: key,
      //   message: message
      // }}));
      const cliMessageDocument = new CliMessageDocument(this, undefined, message, key);
      allCliMessageDocumentMap.set(key, cliMessageDocument);
    }
    return allCliMessageDocumentMap;
  }

  public getSupportedContentTypes(): Array<string> {
    return Object.values(E_ASYNC_API_SPEC_CONTENNT_TYPES);
  }

  public getDefaultContentType(): string | undefined {
    const defaultContentType: string | null = this.asyncApiDocument.defaultContentType();
    if(defaultContentType === null) return undefined;
    return defaultContentType;
  }

  public validate(): void {
    this.validate_BestPractices();
    this.validate_EP();
  }
  
  public getLogInfo(): any {
    return {
      title: this.getTitle(),
      version: this.getVersion(),
      applicationDomainName: this.getApplicationDomainName()
    };
  }


}
