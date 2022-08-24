import { EpAsyncApiDocument } from "@solace-labs/ep-asyncapi";
import { ICliAsyncApiFileImporterOptions } from "./CliAsyncApiFileImporter";
import { CliEventApiImporter, ICliEventApiImporterRunReturn } from "./CliEventApiImporter";
import { CliLogger, ECliStatusCodes } from "./CliLogger";
import CliRunContext, { ECliRunContext_RunMode } from "./CliRunContext";
import CliRunSummary, { ECliRunSummary_Type } from "./CliRunSummary";
import { CliUtils } from "./CliUtils";
import CliApplicationDomainsService from "./services/CliApplicationDomainsService";
import CliAsyncApiDocumentService from "./services/CliAsyncApiDocumentService";

export enum ECliImporterMode {
  RELEASE_MODE = "release_mode",
  TEST_MODE = "test_mode",
  TEST_MODE_KEEP = "test_mode_keep"
}
export const getCliImporterModeObjectValues4Config = (): Array<string> => {
  return [
    ECliImporterMode.RELEASE_MODE,
    ECliImporterMode.TEST_MODE
  ]
}

export interface ICliImporterOptions {
  appName: string;
  runId: string;
  cliImporterMode: ECliImporterMode;
  cliAsyncApiFileImporterOptions: ICliAsyncApiFileImporterOptions;
  asyncApiFileList: Array<string>;
  applicationDomainName?: string;
};

export class CliImporter {
  private cliImporterOptions: ICliImporterOptions;

  constructor(cliImporterOptions: ICliImporterOptions) { 
    this.cliImporterOptions = cliImporterOptions;
  }

  // expose for testing
  public static createApplicationDomainPrefix({ appName, runId }:{
    appName: string;
    runId: string;
  }): string {
    return `${appName}/test/${runId}`;
  }

  private run_test_mode = async({ cleanUp }:{
    cleanUp: boolean;
  }): Promise<void> => {
    const funcName = 'run_test_mode';
    const logName = `${CliImporter.name}.${funcName}()`;

    const applicationDomainNamePrefix = CliImporter.createApplicationDomainPrefix({ 
      appName: this.cliImporterOptions.appName,
      runId: this.cliImporterOptions.runId
    });

    const applicationDomainNameList: Array<string> = [];
    try {
      // test first pass
      CliRunContext.setRunContext({ 
        runContext: {
          runId: this.cliImporterOptions.runId,
          runMode: ECliRunContext_RunMode.TEST_PASS_1
        }
      });
      CliRunSummary.startRun({ cliRunSummary_StartRun: { 
        type: ECliRunSummary_Type.StartRun,
        runMode: ECliRunContext_RunMode.TEST_PASS_1,
      }});
      // get a list of application domain names
      for(const asyncApiFile of this.cliImporterOptions.asyncApiFileList) {
        CliRunSummary.validatingApi({ cliRunSummary_ValidatingApi: { 
          type: ECliRunSummary_Type.ValidatingApi,
          apiFile: asyncApiFile
        }});
        const epAsyncApiDocument: EpAsyncApiDocument = await CliAsyncApiDocumentService.parse_and_validate({
          apiFile: asyncApiFile,
          applicationDomainName: this.cliImporterOptions.applicationDomainName,
          applicationDomainNamePrefix: applicationDomainNamePrefix,
        });
        applicationDomainNameList.push(epAsyncApiDocument.getApplicationDomainName());  
      }

      // CliLogger.trace(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_START_TEST_MODE, details: {
      //   applicationDomainName: this.cliImporterOptions.applicationDomainName,
      //   applicationDomainNamePrefix: applicationDomainNamePrefix,
      //   applicationDomainNameList: applicationDomainNameList
      // }}));

      // clean application domains before test
      const xvoid: void = await CliApplicationDomainsService.absent_ApplicationDomains({ applicationDomainNameList: applicationDomainNameList });
  
      for(const asyncApiFile of this.cliImporterOptions.asyncApiFileList) {
        const cliEventApiImporter = new CliEventApiImporter(this.cliImporterOptions.cliAsyncApiFileImporterOptions);
        const cliEventApiImporterRunReturn: ICliEventApiImporterRunReturn = await cliEventApiImporter.run({ 
          apiFile: asyncApiFile,
          applicationDomainName: this.cliImporterOptions.applicationDomainName,
          applicationDomainNamePrefix: applicationDomainNamePrefix,
          checkmode: false
        });
        // if(cliEventApiImporterRunReturn.applicationDomainName !== undefined) applicationDomainNameList.push(cliEventApiImporterRunReturn.applicationDomainName);
        if(cliEventApiImporterRunReturn.error !== undefined) throw cliEventApiImporterRunReturn.error;
      }

      // test second pass
      CliRunContext.setRunContext({ 
        runContext: {
          runId: this.cliImporterOptions.runId,
          runMode: ECliRunContext_RunMode.TEST_PASS_2
        }
      });  
      CliRunSummary.startRun({ cliRunSummary_StartRun: { 
        type: ECliRunSummary_Type.StartRun,
        runMode: ECliRunContext_RunMode.TEST_PASS_2,
      }});
      for(const asyncApiFile of this.cliImporterOptions.asyncApiFileList) {
        const cliEventApiImporter = new CliEventApiImporter(this.cliImporterOptions.cliAsyncApiFileImporterOptions);
        const cliEventApiImporterRunReturn: ICliEventApiImporterRunReturn = await cliEventApiImporter.run({ 
          apiFile: asyncApiFile,
          applicationDomainName: this.cliImporterOptions.applicationDomainName,
          applicationDomainNamePrefix: applicationDomainNamePrefix,
          checkmode: true
        });
        // if(cliEventApiImporterRunReturn.applicationDomainName !== undefined) applicationDomainNameList.push(cliEventApiImporterRunReturn.applicationDomainName);
        if(cliEventApiImporterRunReturn.error !== undefined) throw cliEventApiImporterRunReturn.error;
      }
      // clean up if specified
      if(cleanUp) {
        const xvoid: void = await CliApplicationDomainsService.absent_ApplicationDomains({ applicationDomainNameList: applicationDomainNameList });
      }
    } catch(e) {
      if(cleanUp) {
        const xvoid: void = await CliApplicationDomainsService.absent_ApplicationDomains({ applicationDomainNameList: applicationDomainNameList });
      }
      // already logged
      // CliLogger.error(CliLogger.createLogEntry(logName, { code: ECliStatusCodes.IMPORTING_ERROR, details: {
      //   error: e
      // }}));
      throw e;
    }
  }

  private run_release_mode = async({  }:{
  }): Promise<void> => {
    const funcName = 'run_release_mode';
    const logName = `${CliImporter.name}.${funcName}()`;

    await this.run_test_mode({ 
      cleanUp: true 
    });

    CliRunContext.setRunContext({ 
      runContext: {
        runId: this.cliImporterOptions.runId,
        runMode: ECliRunContext_RunMode.RELEASE,
      }
    });  

    CliRunSummary.startRun({ cliRunSummary_StartRun: { 
      type: ECliRunSummary_Type.StartRun,
      runMode: ECliRunContext_RunMode.RELEASE,
    }});

    for(const asyncApiFile of this.cliImporterOptions.asyncApiFileList) {
      const cliEventApiImporter = new CliEventApiImporter(this.cliImporterOptions.cliAsyncApiFileImporterOptions);
      const cliEventApiImporterRunReturn: ICliEventApiImporterRunReturn = await cliEventApiImporter.run({ 
        apiFile: asyncApiFile,
        applicationDomainName: this.cliImporterOptions.applicationDomainName,
        applicationDomainNamePrefix: undefined,
        checkmode: false
      });
      if(cliEventApiImporterRunReturn.error !== undefined) throw cliEventApiImporterRunReturn.error;
    }
  }

  public run = async(): Promise<void> => {
    const funcName = 'run';
    const logName = `${CliImporter.name}.${funcName}()`;

    switch(this.cliImporterOptions.cliImporterMode) {
      case ECliImporterMode.TEST_MODE:
      case ECliImporterMode.TEST_MODE_KEEP:
        await this.run_test_mode({ 
          cleanUp: this.cliImporterOptions.cliImporterMode ===  ECliImporterMode.TEST_MODE
        });
        break;
      case ECliImporterMode.RELEASE_MODE:
        await this.run_release_mode({});
        break;
      default:
        CliUtils.assertNever(logName, this.cliImporterOptions.cliImporterMode);
    }

  }

}

