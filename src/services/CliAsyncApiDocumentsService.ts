import fs from 'fs';
import { parse, AsyncAPIDocument } from '@asyncapi/parser';
import { TCliAppConfig } from '../CliConfig';
import { CliAsyncApiDocument, CliChannelDocumentMap } from '../documents/CliAsyncApiDocument';
import { CliChannelDocument } from '../documents/CliChannelDocument';
import isEqual from 'lodash.isequal';

export enum TCliActionType {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  REMOVE = "REMOVE"
}

export interface ICliImportAction {
  type: TCliActionType;
  details: any;
}
export type TCliImportActionList = Array<ICliImportAction>;

export class CliAsyncApiDocumentsService {
  // private appConfig: TCliAppConfig;
  // private asyncApiDocument: AsyncAPIDocument;
  // private asyncApiDocumentJson: any;
  // private applicationDomainName: string;

  public createFromFile = async({ filePath, appConfig }:{
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

  public createFromAny = async({ anySpec, appConfig }:{
    anySpec: any;
    appConfig: TCliAppConfig;
  }): Promise<CliAsyncApiDocument> => {
    const asyncApiDocument: AsyncAPIDocument = await parse(anySpec);
    const cliAsyncApiDocument: CliAsyncApiDocument = new CliAsyncApiDocument(asyncApiDocument, appConfig);
    cliAsyncApiDocument.validate();
    return cliAsyncApiDocument;
  }


  public createDiffActionList = ({ existingAsyncApiDocument, newAsyncApiDocument }:{
    existingAsyncApiDocument: CliAsyncApiDocument;
    newAsyncApiDocument: CliAsyncApiDocument;
  }): TCliImportActionList => {

    const cliImportActionList: TCliImportActionList = [];
    // check channels
    const existing_CliChannelDocumentMap: CliChannelDocumentMap = existingAsyncApiDocument.getChannelDocuments();
    const new_CliChannelDocumentMap: CliChannelDocumentMap = newAsyncApiDocument.getChannelDocuments();
    for(const [existing_topic, existing_channelDocument] of existing_CliChannelDocumentMap) {
      const new_CliChannelDocument: CliChannelDocument | undefined = new_CliChannelDocumentMap.get(existing_topic);

      // TODO: would have to check the reverse as well to be accurate

      if(new_CliChannelDocument === undefined) {
        const importAction: ICliImportAction = {
          type: TCliActionType.REMOVE,
          details: {
            existingChannel: existing_topic,
            newChannel: 'undefined'
          }
        }
        cliImportActionList.push(importAction);
      } else {
        // check channel parameters
        if(!isEqual(existing_channelDocument.getChannelParameters(), new_CliChannelDocument.getChannelParameters())) {
          const importAction: ICliImportAction = {
            type: TCliActionType.UPDATE,
            details: {
              existingChannelParameters: existing_channelDocument.getChannelParameters(),
              newChannelParameters: new_CliChannelDocument.getChannelParameters() 
            }
          }
          cliImportActionList.push(importAction);
        }
        // check publish operation
        if(!isEqual(existing_channelDocument.getChannelPublishOperation(), new_CliChannelDocument.getChannelPublishOperation())) {
          const importAction: ICliImportAction = {
            type: TCliActionType.UPDATE,
            details: {
              existingChannelPublishOperation: existing_channelDocument.getChannelPublishOperation(),
              newChannelParametersPublishOperation: new_CliChannelDocument.getChannelPublishOperation()
            }
          }
          cliImportActionList.push(importAction);
        }
        // check subscribe operation
        if(!isEqual(existing_channelDocument.getChannelSubscribeOperation(), new_CliChannelDocument.getChannelSubscribeOperation())) {
          const importAction: ICliImportAction = {
            type: TCliActionType.UPDATE,
            details: {
              existingChannelSubscribeOperation: existing_channelDocument.getChannelSubscribeOperation(),
              newChannelParametersSubscribeOperation: new_CliChannelDocument.getChannelSubscribeOperation()
            }
          }
          cliImportActionList.push(importAction);
        }
      }
    }
    // check messages
    if(!isEqual(existingAsyncApiDocument.getMessageDocuments(), newAsyncApiDocument.getMessageDocuments())) {
      const importAction: ICliImportAction = {
        type: TCliActionType.UPDATE,
        details: {
          existingMessages: existingAsyncApiDocument.getMessageDocuments(),
          newMessages: newAsyncApiDocument.getMessageDocuments()
        }
      }
      cliImportActionList.push(importAction);
    }
    return cliImportActionList;
  }

}

export default new CliAsyncApiDocumentsService();
