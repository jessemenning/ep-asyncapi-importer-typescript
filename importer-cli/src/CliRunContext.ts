
export enum ECliChannelOperation {
  Publish = "publish",
  Subscribe = "subscribe"
}
// - runMode = test_pass_1, test_pass_2, release
export enum ECliRunContext_RunMode {
  TEST_PASS_1 = "test_pass_1",
  TEST_PASS_2 = "test_pass_2",
  RELEASE = "release"
}
export interface ICliRunContext {
  runId: string;
  runMode: ECliRunContext_RunMode;
}
export interface ICliAsyncApiRunContext extends Partial<ICliRunContext> {
  apiFile: string;
}
export interface ICliAsyncApiRunContext_State extends Partial<ICliAsyncApiRunContext> {
  apiTitle: string;
  apiVersion: string;
  epApplicationDomainName: string;
}
export interface ICliAsyncApiRunContext_EventApi extends Partial<ICliAsyncApiRunContext_State> {
  epEventApiName: string;
  // existingEventApiName?: string;
}
export interface ICliAsyncApiRunContext_EventApiVersion extends Partial<ICliAsyncApiRunContext_State> {
  epLatestExistingEventApiVersion?: string;
  epTargetEventApiVersion: string;
}
export interface ICliAsyncApiRunContext_ApplicationVersion extends Partial<ICliAsyncApiRunContext_State> {
  epLatestExistingApplicationVersion?: string;
  epTargetApplicationVersion: string;
}
export interface ICliAsyncApiRunContext_Channel extends Partial<ICliAsyncApiRunContext_State> {
  channelTopic: string;
}
export interface ICliAsyncApiRunContext_Channel_Parameter extends Partial<ICliAsyncApiRunContext_Channel> {
  parameter: string;
  parameterEnumList?: Array<string>;
}
export interface ICliAsyncApiRunContext_Channel_Operation extends Partial<ICliAsyncApiRunContext_Channel> {
  type: ECliChannelOperation;
}
export interface ICliAsyncApiRunContext_Channel_Operation_Message extends Partial<ICliAsyncApiRunContext_Channel_Operation> {
  messageName: string; 
}
export interface ICliAsyncApiRunContext_Channel_Event extends Partial<ICliAsyncApiRunContext_Channel> {
  messageName: string;
}
export interface ICliAsyncApiRunContext_Application extends Partial<ICliAsyncApiRunContext_State> {
  epApplicationName: string;
}
export interface ICliAsyncApiRunContext_ApplicationVersion extends Partial<ICliAsyncApiRunContext_State> {
  epLatestExistingApplicationVersion?: string;
  epTargetApplicationVersion: string;
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

  // public getCliAsyncApiRunContext_State = (): ICliAsyncApiRunContext_State => {
  //   return this.runContext as ICliAsyncApiRunContext_State;
  // }

}

export default new CliRunContext();