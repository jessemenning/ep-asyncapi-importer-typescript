import { Message, Schema } from '@asyncapi/parser';
import { CliAsyncApiSpecError, CliError } from '../CliError';
import { CliLogger, ECliStatusCodes } from '../CliLogger';
import { E_ASYNC_API_SPEC_CONTENNT_TYPES } from './CliAsyncApiDocument';

enum E_EP_Message_Extensions {
};

export class CliMessageDocument {
  private key: string;
  private asyncApiMessage: Message;

  private extractMessageKey(asyncApiMessage: Message): string {
    const funcName = 'extractMessageKey';
    const logName = `${CliMessageDocument.name}.${funcName}()`;
    // 2.4.0
    if(asyncApiMessage.name()) return asyncApiMessage.name();
    // 2.0.0
    if(asyncApiMessage.hasExt('x-parser-message-name')) return asyncApiMessage.ext('x-parser-message-name');
    throw new CliAsyncApiSpecError(logName, 'unable to find message key', {
      asyncApiMessage: asyncApiMessage
    });
  }

  constructor(asyncApiMessage: Message, key?: string) {
    this.key = key ? key : this.extractMessageKey(asyncApiMessage);
    this.asyncApiMessage = asyncApiMessage;
  }

  public getMessageKey(): string { return this.key; }

  public getMessageName(): string {
    const funcName = 'getMessageName';
    const logName = `${CliMessageDocument.name}.${funcName}()`;
    
    // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.INFO, details: {
    //   messageName: this.asyncApiMessage.name() ? this.asyncApiMessage.name() : 'undefined',
    //   messageId: this.asyncApiMessage.id() ? this.asyncApiMessage.id() : 'undefined',
    //   title: this.asyncApiMessage.title() ? this.asyncApiMessage.title() : 'undefined',
    //   key: this.key
    // }}));

    let name: string = this.key;
    if(this.asyncApiMessage.name() !== undefined) name = this.asyncApiMessage.name();
    return name;
  }

  public getContentType(): E_ASYNC_API_SPEC_CONTENNT_TYPES {
    const contentType: string = this.asyncApiMessage.contentType();
    return  contentType as E_ASYNC_API_SPEC_CONTENNT_TYPES;
  }

  public getPayloadSchema(): Schema {
    return this.asyncApiMessage.payload();
  }

  public getPayloadSchemaAsString(): string {
    const schema: Schema = this.asyncApiMessage.payload();
    return JSON.stringify(schema.json());
  }

  public getDescription(): string {
    const description: string | null = this.asyncApiMessage.description();
    const summary: string | null = this.asyncApiMessage.summary();
    if(description) return description;
    if(summary) return summary;
    return '';
  }

  public getMessageNameAsFilePath(): string {
    return this.asyncApiMessage.name();
  }

  public getSchemaFileName(): string {
    if(this.getContentType() === E_ASYNC_API_SPEC_CONTENNT_TYPES.APPLICATION_JSON) return `${this.getMessageNameAsFilePath()}.${"json"}`;
    return `${this.getMessageNameAsFilePath()}.${"xxx"}`
  }

  public getSchemaAsSanitizedJson(): any {
    const schema: Schema = this.asyncApiMessage.payload();
    const sanitized = JSON.parse(JSON.stringify(schema.json(), (k,v) => {
      if(k.startsWith("x-parser")) return undefined;
      return v;
    }));

    return sanitized;
  }



}
