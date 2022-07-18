import { Message, Schema } from '@asyncapi/parser';
import { E_ASYNC_API_SPEC_CONTENNT_TYPES } from './CliAsyncApiDocument';

enum E_EP_Message_Extensions {
};

export class CliMessageDocument {
  private asyncApiMessage: Message;

  constructor(asyncApiMessage: Message) {
    this.asyncApiMessage = asyncApiMessage;
  }

  public getMessage(): Message { return this.asyncApiMessage; }

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

  public getDisplayName(): string {
    return this.asyncApiMessage.name();
  }

  public getSchemaFileName(): string {
    if(this.getContentType() === E_ASYNC_API_SPEC_CONTENNT_TYPES.APPLICATION_JSON) return `${this.getDisplayName()}.${"json"}`;
    return `${this.getDisplayName()}.${"xxx"}`
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
