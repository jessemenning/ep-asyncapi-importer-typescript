import { SemVer, coerce as SemVerCoerce, valid as SemVerValid } from "semver";
import { ECliAssetImportTargetLifecycleState_VersionStrategy } from "./CliConfig";
import { CliUtils } from "./CliUtils";

export class CliSemVerUtils {

  public isSemVerFormat({ versionString }:{
    versionString: string;
  }): boolean {
    try {
      const s: string | null = SemVerValid(versionString);
      if(s === null) return false;
      return true;
    } catch(e) {
      return false;
    }
  }

  public createNextVersion({ versionString, strategy }:{
    versionString: string;
    strategy: ECliAssetImportTargetLifecycleState_VersionStrategy;
  }): string {
    const funcName = 'createNextVersion';
    const logName = `${CliSemVerUtils.name}.${funcName}()`;

    const versionSemVer = new SemVer(versionString);
    switch(strategy) {
      case ECliAssetImportTargetLifecycleState_VersionStrategy.BUMP_MINOR:
        versionSemVer.inc("minor");
        break;
      case ECliAssetImportTargetLifecycleState_VersionStrategy.BUMP_PATCH:
        versionSemVer.inc("patch");
        break;
      default:
        CliUtils.assertNever(logName, strategy);
    }
    return versionSemVer.format();
  }

  public is_NewVersion_GreaterThan_OldVersion({ newVersion, oldVersion }:{
    oldVersion: string;
    newVersion: string;
  }): boolean {
    const oldVersionSemVer = new SemVer(oldVersion);
    if(oldVersionSemVer.compare(newVersion) === -1) return true;
    return false;
  }

}
export default new CliSemVerUtils();
