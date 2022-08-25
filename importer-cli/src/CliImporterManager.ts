import { EpAsyncApiDocument } from "@solace-labs/ep-asyncapi";
import { CliInternalCodeInconsistencyError } from "./CliError";
import CliRunContext, { ECliRunContext_RunMode } from "./CliRunContext";
import CliRunSummary, { ECliRunSummary_Type } from "./CliRunSummary";
import { CliUtils } from "./CliUtils";
import { CliApplicationImporter, ICliApplicationImporterRunReturn } from "./importers/CliApplicationImporter";
import { CliEventApiImporter, ICliEventApiImporterRunReturn } from "./importers/CliEventApiImporter";
import { ICliImporterOptions } from "./importers/CliImporter";
import CliApplicationDomainsService from "./services/CliApplicationDomainsService";
import CliAsyncApiDocumentService from "./services/CliAsyncApiDocumentService";

export enum ECliImporterManagerMode {
  RELEASE_MODE = "release_mode",
  TEST_MODE = "test_mode",
  TEST_MODE_KEEP = "test_mode_keep"
}
export const getCliImporterManagerModeObjectValues4Config = (): Array<string> => {
  return [
    ECliImporterManagerMode.RELEASE_MODE,
    ECliImporterManagerMode.TEST_MODE
  ]
}

export interface ICliImporterManagerOptions {
  appName: string;
  runId: string;
  cliImporterManagerMode: ECliImporterManagerMode;
  asyncApiFileList: Array<string>;
  applicationDomainName?: string;
  cliImporterOptions: ICliImporterOptions;
  createEventApiApplication: boolean;
};

export class CliImporterManager {
  private cliImporterManagerOptions: ICliImporterManagerOptions;

  constructor(cliImporterManagerOptions: ICliImporterManagerOptions) { 
    this.cliImporterManagerOptions = cliImporterManagerOptions;
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
    const logName = `${CliImporterManager.name}.${funcName}()`;

    const applicationDomainNamePrefix = CliImporterManager.createApplicationDomainPrefix({ 
      appName: this.cliImporterManagerOptions.appName,
      runId: this.cliImporterManagerOptions.runId
    });

    const applicationDomainNameList: Array<string> = [];
    try {
      // test first pass
      CliRunContext.setRunContext({ 
        runContext: {
          runId: this.cliImporterManagerOptions.runId,
          runMode: ECliRunContext_RunMode.TEST_PASS_1
        }
      });
      CliRunSummary.startRun({ cliRunSummary_StartRun: { 
        type: ECliRunSummary_Type.StartRun,
        runMode: ECliRunContext_RunMode.TEST_PASS_1,
      }});
      // get a list of application domain names
      for(const asyncApiFile of this.cliImporterManagerOptions.asyncApiFileList) {
        CliRunSummary.validatingApi({ cliRunSummary_ValidatingApi: { 
          type: ECliRunSummary_Type.ValidatingApi,
          apiFile: asyncApiFile
        }});
        const epAsyncApiDocument: EpAsyncApiDocument = await CliAsyncApiDocumentService.parse_and_validate({
          apiFile: asyncApiFile,
          applicationDomainName: this.cliImporterManagerOptions.applicationDomainName,
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
  
      for(const asyncApiFile of this.cliImporterManagerOptions.asyncApiFileList) {
        const cliEventApiImporter = new CliEventApiImporter(this.cliImporterManagerOptions.cliImporterOptions);
        const cliEventApiImporterRunReturn: ICliEventApiImporterRunReturn = await cliEventApiImporter.run({ cliImporterRunOptions: {
          apiFile: asyncApiFile,
          applicationDomainName: this.cliImporterManagerOptions.applicationDomainName,
          applicationDomainNamePrefix: applicationDomainNamePrefix,
          checkmode: false
        }});
        if(cliEventApiImporterRunReturn.error !== undefined) throw cliEventApiImporterRunReturn.error;
        if(cliEventApiImporterRunReturn.applicationDomainName === undefined) throw new CliInternalCodeInconsistencyError(logName, "cliEventApiImporterRunReturn.applicationDomainName === undefined");
        // create application
        if(this.cliImporterManagerOptions.createEventApiApplication) {
          const cliApplicationImporter = new CliApplicationImporter({
            ...this.cliImporterManagerOptions.cliImporterOptions,
            applicationDomainName: cliEventApiImporterRunReturn.applicationDomainName
          });
          const cliApplicationImporterRunReturn: ICliApplicationImporterRunReturn = await cliApplicationImporter.run({ cliImporterRunOptions: {
            apiFile: asyncApiFile,
            applicationDomainName: this.cliImporterManagerOptions.applicationDomainName,
            applicationDomainNamePrefix: applicationDomainNamePrefix,
            checkmode: false
          }});
          if(cliApplicationImporterRunReturn.error !== undefined) throw cliApplicationImporterRunReturn.error;            
        }    
      }

      // test second pass
      CliRunContext.setRunContext({ 
        runContext: {
          runId: this.cliImporterManagerOptions.runId,
          runMode: ECliRunContext_RunMode.TEST_PASS_2
        }
      });  
      CliRunSummary.startRun({ cliRunSummary_StartRun: { 
        type: ECliRunSummary_Type.StartRun,
        runMode: ECliRunContext_RunMode.TEST_PASS_2,
      }});
      for(const asyncApiFile of this.cliImporterManagerOptions.asyncApiFileList) {
        const cliEventApiImporter = new CliEventApiImporter(this.cliImporterManagerOptions.cliImporterOptions);
        const cliEventApiImporterRunReturn: ICliEventApiImporterRunReturn = await cliEventApiImporter.run({ cliImporterRunOptions: {
          apiFile: asyncApiFile,
          applicationDomainName: this.cliImporterManagerOptions.applicationDomainName,
          applicationDomainNamePrefix: applicationDomainNamePrefix,
          checkmode: true
        }});
        if(cliEventApiImporterRunReturn.error !== undefined) throw cliEventApiImporterRunReturn.error;
        if(cliEventApiImporterRunReturn.applicationDomainName === undefined) throw new CliInternalCodeInconsistencyError(logName, "cliEventApiImporterRunReturn.applicationDomainName === undefined");
        // create application
        if(this.cliImporterManagerOptions.createEventApiApplication) {
          const cliApplicationImporter = new CliApplicationImporter({
            ...this.cliImporterManagerOptions.cliImporterOptions,
            applicationDomainName: cliEventApiImporterRunReturn.applicationDomainName,
          });
          const cliApplicationImporterRunReturn: ICliApplicationImporterRunReturn = await cliApplicationImporter.run({ cliImporterRunOptions: {
            apiFile: asyncApiFile,
            applicationDomainName: this.cliImporterManagerOptions.applicationDomainName,
            applicationDomainNamePrefix: applicationDomainNamePrefix,
            checkmode: true
          }});
          if(cliApplicationImporterRunReturn.error !== undefined) throw cliApplicationImporterRunReturn.error;            
        }
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
    const logName = `${CliImporterManager.name}.${funcName}()`;

    await this.run_test_mode({ 
      cleanUp: true 
    });

    CliRunContext.setRunContext({ 
      runContext: {
        runId: this.cliImporterManagerOptions.runId,
        runMode: ECliRunContext_RunMode.RELEASE,
      }
    });  

    CliRunSummary.startRun({ cliRunSummary_StartRun: { 
      type: ECliRunSummary_Type.StartRun,
      runMode: ECliRunContext_RunMode.RELEASE,
    }});

    for(const asyncApiFile of this.cliImporterManagerOptions.asyncApiFileList) {
      const cliEventApiImporter = new CliEventApiImporter(this.cliImporterManagerOptions.cliImporterOptions);
      const cliEventApiImporterRunReturn: ICliEventApiImporterRunReturn = await cliEventApiImporter.run({ cliImporterRunOptions: {
        apiFile: asyncApiFile,
        applicationDomainName: this.cliImporterManagerOptions.applicationDomainName,
        applicationDomainNamePrefix: undefined,
        checkmode: false
      }});
      if(cliEventApiImporterRunReturn.error !== undefined) throw cliEventApiImporterRunReturn.error;
      if(cliEventApiImporterRunReturn.applicationDomainName === undefined) throw new CliInternalCodeInconsistencyError(logName, "cliEventApiImporterRunReturn.applicationDomainName === undefined");
      // create application
      if(this.cliImporterManagerOptions.createEventApiApplication) {
        const cliApplicationImporter = new CliApplicationImporter({
          ...this.cliImporterManagerOptions.cliImporterOptions,
          applicationDomainName: cliEventApiImporterRunReturn.applicationDomainName,
        });
        const cliApplicationImporterRunReturn: ICliApplicationImporterRunReturn = await cliApplicationImporter.run({ cliImporterRunOptions: {
          apiFile: asyncApiFile,
          applicationDomainName: this.cliImporterManagerOptions.applicationDomainName,
          applicationDomainNamePrefix: undefined,
          checkmode: false
        }});
        if(cliApplicationImporterRunReturn.error !== undefined) throw cliApplicationImporterRunReturn.error;            
      }          
    }
  }

  public run = async(): Promise<void> => {
    const funcName = 'run';
    const logName = `${CliImporterManager.name}.${funcName}()`;

    switch(this.cliImporterManagerOptions.cliImporterManagerMode) {
      case ECliImporterManagerMode.TEST_MODE:
      case ECliImporterManagerMode.TEST_MODE_KEEP:
        await this.run_test_mode({ 
          cleanUp: this.cliImporterManagerOptions.cliImporterManagerMode ===  ECliImporterManagerMode.TEST_MODE
        });
        break;
      case ECliImporterManagerMode.RELEASE_MODE:
        await this.run_release_mode({});
        break;
      default:
        CliUtils.assertNever(logName, this.cliImporterManagerOptions.cliImporterManagerMode);
    }

  }

}

