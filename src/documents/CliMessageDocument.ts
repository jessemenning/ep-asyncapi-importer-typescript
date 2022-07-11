import { Message, Schema } from '@asyncapi/parser';

enum E_EP_Message_Extensions {
};

export class CliMessageDocument {
  private asyncApiMessage: Message;

  constructor(asyncApiMessage: Message) {
    this.asyncApiMessage = asyncApiMessage;
  }

  public getMessage(): Message { return this.asyncApiMessage; }

  public getContentType(): string {
    return this.asyncApiMessage.contentType();
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

}
