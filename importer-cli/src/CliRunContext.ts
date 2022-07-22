import { ECliAssetsTargetState } from "./CliConfig";

export enum ECliChannelOperation {
  Publish = "publish",
  Subscribe = "subscribe"
}
export interface ICliRunContext {
  apiFile: string;
  targetState: ECliAssetsTargetState;
}
export interface ICliRunContext_State extends Partial<ICliRunContext> {
  apiTitle: string;
  apiVersion: string;
  epApplicationDomainName: string;
}
export interface ICliRunContext_EventApi extends Partial<ICliRunContext_State> {
  eventApiName: string;
  existingEventApiName?: string;
}
export interface ICliRunContext_EventApiVersion extends Partial<ICliRunContext_EventApi> {
  latestExistingEventApiVersion?: string;
  eventApiVersion: string;
}
export interface ICliRunContext_Channel extends Partial<ICliRunContext_State> {
  channelTopic: string;
}
export interface ICliRunContext_Channel_Parameter extends Partial<ICliRunContext_Channel> {
  parameter: string;
  parameterEnumList?: Array<string>;
}
export interface ICliRunContext_Channel_Operation extends Partial<ICliRunContext_Channel> {
  type: ECliChannelOperation;
}
export interface ICliRunContext_Channel_Operation_Message extends Partial<ICliRunContext_Channel_Operation> {
  messageName: string; 
}
export interface ICliRunContext_Channel_Event extends Partial<ICliRunContext_Channel> {
  messageName: string;
}


export class CliRunContext {
  private runContext: ICliRunContext; 

  private setContext = ({ runContext }: {
    runContext: ICliRunContext;
  }): ICliRunContext => {
    this.runContext = runContext;
    return runContext;
  }

  public setRunContext = ({ runContext }: {
    runContext: ICliRunContext;
  }): ICliRunContext => {
    this.runContext = runContext;
    return runContext;
  }

  public updateContext = ({ runContext }:{
    runContext: Partial<ICliRunContext>;
  }): ICliRunContext => {
    const newContext: ICliRunContext = {
      ...this.runContext,
      ...runContext
    };
    return this.setContext({ runContext: newContext });
  }

  public getContext = (): ICliRunContext => {
    return this.runContext;
  };

}

export default new CliRunContext();