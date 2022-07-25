import { Channel, ChannelParameter, Message, PublishOperation, Schema, SubscribeOperation } from '@asyncapi/parser';
import { CliError } from '../CliError';
import { CliChannelParameterDocumentMap, CliMessageDocumentMap } from './CliAsyncApiDocument';
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

  public getCliMessageDocument(): CliMessageDocument {
    const funcName = 'getCliMessageDocument';
    const logName = `${CliChannelPublishOperation.name}.${funcName}()`;
    const messageList: Array<Message>  = this.subscribeOperation.messages();
    if(messageList.length !== 1) throw new CliError(logName, 'messageList.length !== 1');

    // const message: Message = messageList[0];
    // if(message.hasExt('x-parser-message-name') === false) throw new CliError(logName, "message.hasExt('x-parser-message-name') === false");
    // const key: any = message.ext('x-parser-message-name');
    // if(key === undefined) throw new CliError(logName, "key === undefined");

    return new CliMessageDocument(messageList[0]);
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

  public getCliMessageDocument(): CliMessageDocument {
    const funcName = 'getCliMessageDocument';
    const logName = `${CliChannelPublishOperation.name}.${funcName}()`;
    const messageList: Array<Message>  = this.publishOperation.messages();
    if(messageList.length !== 1) throw new CliError(logName, 'messageList.length !== 1');
    return new CliMessageDocument(messageList[0]);
  }

}

export class CliChannelParameterDocument {
  private channelParameterName: string;
  private asyncApiChannelParameter: ChannelParameter;

  constructor(channelParameterName: string, asyncApiChannelParameter: ChannelParameter) {
    this.channelParameterName = channelParameterName;
    this.asyncApiChannelParameter = asyncApiChannelParameter;
  }

  public getChannelParameter(): ChannelParameter { return this.asyncApiChannelParameter; }

  public getDescription(): string {
    const description: string | null = this.asyncApiChannelParameter.description();
    if(description) return description;
    return '';
  }

  public getDisplayName(): string { return this.channelParameterName; }

  public getParameterEnumValueList(): Array<string> {
    const schema: Schema = this.asyncApiChannelParameter.schema();
    const enumList: Array<string> | undefined = schema.enum();
    if(enumList === undefined) return [];
    return enumList;
  }

}

export class CliChannelDocument {
  private asyncApiChannel: Channel;

  constructor(asyncApiChannel: Channel) {
    this.asyncApiChannel = asyncApiChannel;
  }

  public getChannel(): Channel { return this.asyncApiChannel; }

  public getChannelParameters(): CliChannelParameterDocumentMap | undefined {
    if(!this.asyncApiChannel.hasParameters()) return undefined;
    
    const paramRecords: Record<string, ChannelParameter> = this.asyncApiChannel.parameters();
    const cliChannelParameterDocumentMap: CliChannelParameterDocumentMap = new Map<string, CliChannelParameterDocument>();
    for(const [name, parameter] of Object.entries(paramRecords)) {
      const cliChannelParameterDocument = new CliChannelParameterDocument(name, parameter);
      cliChannelParameterDocumentMap.set(name, cliChannelParameterDocument);
    }
    return cliChannelParameterDocumentMap;
  }

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
