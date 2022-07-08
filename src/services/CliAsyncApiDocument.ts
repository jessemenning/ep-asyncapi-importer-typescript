import { AsyncAPIDocument, Message } from '@asyncapi/parser';
import { TCliAppConfig } from '../CliConfig';
import { AsyncApiSpecError, AsyncApiSpecXtensionError } from '../CliError';


enum E_EP_Extensions {
  X_APPLICATION_DOMAIN_NAME = "x-sep-application-domain-name",
};


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


  constructor(asyncApiDocument: AsyncAPIDocument, appConfig: TCliAppConfig) {
    this.asyncApiDocument = asyncApiDocument;
    this.asyncApiDocumentJson = this.getJSON(asyncApiDocument);
    this.appConfig = appConfig;
    this.applicationDomainName = this.determineApplicationDomainName();

  }

  public getTitle(): string { return this.asyncApiDocument.info().title(); }

  public getVersion(): string { return this.asyncApiDocument.info().version(); }

  public getApplicationDomainName(): string { return this.applicationDomainName; }

  public getMessages(): Map<string, Message> {

    // define own message, add stuff like version & state to it

// or should we get the channels which have messages in them - maybe more efficient.

    for(let [key, message] of messageMap) {
      CliLogger.warn(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING, details: {
        key: key,
        message: message
      }}));

    return this.asyncApiDocument.allMessages();
  }

  public getLogInfo(): any {
    return {
      title: this.getTitle(),
      version: this.getVersion(),
      applicationDomainName: this.getApplicationDomainName()
    };
  }


}
