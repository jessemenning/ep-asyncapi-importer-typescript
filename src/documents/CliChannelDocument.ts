import { Channel, Message, PublishOperation, SubscribeOperation } from '@asyncapi/parser';
import { CliMessageDocumentMap } from './CliAsyncApiDocument';
import { CliMessageDocument } from './CliMessageDocument';

enum E_EP_Channel_Extensions {
};

class CliChannelOperation {

  constructor() {}

  protected getCliMessageDocumentMapByMessageList(messageList: Array<Message>): CliMessageDocumentMap {
    const cliMessageDocumentMap: CliMessageDocumentMap = new Map<string, CliMessageDocument>();
    for(const message of messageList) {
      const cliMessageDocument = new CliMessageDocument(message);
      cliMessageDocumentMap.set(message.name(), cliMessageDocument);
    }
    return cliMessageDocumentMap;
  }

}
export class CliChannelSubscribeOperation extends CliChannelOperation {
  private subscribeOperation: SubscribeOperation;

  constructor(subscribeOperation: SubscribeOperation) {
    super();
    this.subscribeOperation = subscribeOperation;
  }

  public getCliMessageDocumentMap(): CliMessageDocumentMap {
    const messageList: Array<Message>  = this.subscribeOperation.messages();
    return this.getCliMessageDocumentMapByMessageList(messageList);
  }
}

export class CliChannelPublishOperation extends CliChannelOperation {
  private publishOperation: PublishOperation;

  constructor(publishOperation: PublishOperation) {
    super();
    this.publishOperation = publishOperation;
  }

  public getCliMessageDocumentMap(): CliMessageDocumentMap {
    const messageList: Array<Message>  = this.publishOperation.messages();
    return this.getCliMessageDocumentMapByMessageList(messageList);
  }
}

export class CliChannelDocument {
  private asyncApiChannel: Channel;

  constructor(asyncApiChannel: Channel) {
    this.asyncApiChannel = asyncApiChannel;
  }

  public getChannel(): Channel { return this.asyncApiChannel; }

  public getChannelPublishOperation(): CliChannelPublishOperation | undefined {
    if(this.asyncApiChannel.hasPublish()) {
      return new CliChannelPublishOperation(this.asyncApiChannel.publish())
    }
    return undefined;
  }
  public getChannelSubscribeOperation(): CliChannelSubscribeOperation | undefined {
    if(this.asyncApiChannel.hasSubscribe()) {
      return new CliChannelSubscribeOperation(this.asyncApiChannel.subscribe())
    }
    return undefined;
  }
  // public getDescription(): string {
  //   const description: string | null = this.asyncApiMessage.description();
  //   if(description !== null) return description;    
  //   return '';
  // }

  // public getDisplayName(): string {
  //   return this.asyncApiMessage.name();
  // }

}
