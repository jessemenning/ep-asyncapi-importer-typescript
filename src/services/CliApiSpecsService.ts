import { parse, AsyncAPIDocument } from '@asyncapi/parser';
import fs from 'fs';
import { TCliAppConfig } from '../CliConfig';
import { CliAsyncApiDocument } from './CliAsyncApiDocument';


class CliApiSpecService {

  public createFromFile = async({ filePath, appConfig }:{
    filePath: string;
    appConfig: TCliAppConfig;
  }): Promise<CliAsyncApiDocument> => {
    const apiSpecString: string = fs.readFileSync(filePath).toString();
    const asyncApiDocument: AsyncAPIDocument = await parse(apiSpecString);
    return new CliAsyncApiDocument(asyncApiDocument, appConfig);

    // try {
    // } catch(e: any) {
    //   const errors = e.validationErrors ? `, Errors: ${JSON.stringify(e.validationErrors)}` : '';

    //   return `${e.title}${errors}`;
    // }


  }

}

export default new CliApiSpecService();
