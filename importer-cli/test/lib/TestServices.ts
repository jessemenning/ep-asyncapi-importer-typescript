import { EpAsyncApiDocument } from "@solace-labs/ep-asyncapi";
import CliApplicationDomainsService from "../../src/services/CliApplicationDomainsService";
import CliAsyncApiDocumentService from "../../src/services/CliAsyncApiDocumentService";

export type T_TestApiSpecRecord = {
  apiFile: string;
  epAsyncApiDocument: EpAsyncApiDocument;
}



export class TestServices {
  private static testApiSpecRecordList: Array<T_TestApiSpecRecord> = [];

  public static createTestApiSpecRecordList = async({ apiFileList, overrideApplicationDomainName, prefixApplicationDomainName }:{
    apiFileList: Array<string>;
    overrideApplicationDomainName: string;
    prefixApplicationDomainName: string;
  }): Promise<Array<T_TestApiSpecRecord>> => {
    const funcName = 'createTestApiSpecRecordList';
    const logName = `${TestServices.name}.${funcName}()`;

    TestServices.testApiSpecRecordList =[];
    for(const apiFile of apiFileList) {
      const epAsyncApiDocument: EpAsyncApiDocument = await CliAsyncApiDocumentService.parse_and_validate({
        apiFile: apiFile,
        applicationDomainName: overrideApplicationDomainName,
        applicationDomainNamePrefix: prefixApplicationDomainName,
      });
      TestServices.testApiSpecRecordList.push({
        apiFile: apiFile,
        epAsyncApiDocument: epAsyncApiDocument
      });
    }
    return TestServices.testApiSpecRecordList;
  }

  public static absent_ApplicationDomains = async(): Promise<void> => {
    const xvoid: void = await CliApplicationDomainsService.absent_ApplicationDomains({ 
      applicationDomainNameList: TestServices.testApiSpecRecordList.map( (testApiSpecRecord: T_TestApiSpecRecord) => {
        return testApiSpecRecord.epAsyncApiDocument.getApplicationDomainName();
      })
    });
  }

  public static getTestApiSpecRecordList(): Array<T_TestApiSpecRecord> { return TestServices.testApiSpecRecordList; }

  public static checkAssetsCreatedAsExpected = async(): Promise<boolean> => {
    const funcName = 'checkAssetsCreatedAsExpected';
    const logName = `${TestServices.name}.${funcName}()`;

    // run through all specs, check assets in EP?
    // does that really make sense?

    return true;

  }

}