import fs from 'fs';
import { parse, AsyncAPIDocument, Message, Channel } from '@asyncapi/parser';
import { TCliAppConfig } from '../CliConfig';
import { AsyncApiSpecError, AsyncApiSpecXtensionError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import CliSemVerUtils from '../CliSemVerUtils';
import { CliMessageDocument } from './CliMessageDocument';
import { CliChannelDocument } from './CliChannelDocument';


enum E_EP_Extensions {
  X_APPLICATION_DOMAIN_NAME = "x-sep-application-domain-name",
};

export type CliMessageDocumentMap = Map<string, CliMessageDocument>;
export type CliChannelDocumentMap = Map<string, CliChannelDocument>;


export class CliAsyncApiDocument {
  private appConfig: TCliAppConfig;
  private asyncApiDocument: AsyncAPIDocument;
  private asyncApiDocumentJson: any;
  private applicationDomainName: string;

  private getJSON(asyncApiDocument: AsyncAPIDocument): any {
    const funcName = 'getJSON';
    const logName = `${CliAsyncApiDocument.name}.${funcName}()`;
    const anyDoc: any = asyncApiDocument;
    if(anyDoc["_json"] === undefined) throw new AsyncApiSpecError(logName, '_json not found in parse async api spec', {});
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
      appDomainName = this.get_X_ApplicationDomainName();
    }
    if(appDomainName === undefined) throw new AsyncApiSpecXtensionError(logName, "no application domain name defined, define either in spec or on command line", E_EP_Extensions.X_APPLICATION_DOMAIN_NAME);
    return appDomainName;
  }

  private validate(): void {
    const funcName = 'validate';
    const logName = `${CliAsyncApiDocument.name}.${funcName}()`;
    const versionStr: string = this.getVersion();
    // must be in SemVer format
    if(!CliSemVerUtils.isSemVerFormat({ versionString: versionStr })) {
      throw new AsyncApiSpecError(logName, "Please use semantic versioning format for API version.", { versionString: versionStr });
    }
  }
  /**
   * Factory method
   */
  public static createFromFile = async({ filePath, appConfig }:{
    filePath: string;
    appConfig: TCliAppConfig;
  }): Promise<CliAsyncApiDocument> => {
    const apiSpecString: string = fs.readFileSync(filePath).toString();
    const asyncApiDocument: AsyncAPIDocument = await parse(apiSpecString);
    const cliAsyncApiDocument: CliAsyncApiDocument = new CliAsyncApiDocument(asyncApiDocument, appConfig);
    // validate
    cliAsyncApiDocument.validate();
    return cliAsyncApiDocument;

    // try {
    // } catch(e: any) {
    //   const errors = e.validationErrors ? `, Errors: ${JSON.stringify(e.validationErrors)}` : '';

    //   return `${e.title}${errors}`;
    // }


  }

  constructor(asyncApiDocument: AsyncAPIDocument, appConfig: TCliAppConfig) {
    this.asyncApiDocument = asyncApiDocument;
    this.asyncApiDocumentJson = this.getJSON(asyncApiDocument);
    this.appConfig = appConfig;
    this.applicationDomainName = this.determineApplicationDomainName();
  }

  public getTitle(): string { return this.asyncApiDocument.info().title(); }

  public getVersion(): string { return this.asyncApiDocument.info().version(); }

  public getApplicationDomainName(): string { return this.applicationDomainName; }

  public getChannelDocuments(): CliChannelDocumentMap {

    const channels: Record<string, Channel> = this.asyncApiDocument.channels();

    const cliChannelDocumentMap: CliChannelDocumentMap = new Map<string, CliChannelDocument>();
    for(const [key, value] of Object.entries(channels)) {
      const cliChannelDocument = new CliChannelDocument(value);
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
      const cliMessageDocument = new CliMessageDocument(message);
      allCliMessageDocumentMap.set(key, cliMessageDocument);
    }
    return allCliMessageDocumentMap;
  }

  public getLogInfo(): any {
    return {
      title: this.getTitle(),
      version: this.getVersion(),
      applicationDomainName: this.getApplicationDomainName()
    };
  }


}
