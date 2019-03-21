import * as fs from 'fs';
import * as path from 'path';
import * as Q from 'q';

export interface IPluginDetails {
  PluginId: string;
  PluginType: string;
  Version: string;
}

export class LunaProjectHelper {
  private static Luna_PROJECT_FILE = 'luna.project';
  private static VSCODE_DIR = '.vscode';
  private static PROJECT_TYPINGS_FOLDERNAME = 'typings';
  private static PROJECT_TYPINGS_PLUGINS_FOLDERNAME = 'plugins';

  public static isLunaProject(projectRoot: string): boolean {
    if (fs.existsSync(path.join(projectRoot, LunaProjectHelper.Luna_PROJECT_FILE))) {
      return true;
    }
  }

  public static getLunaProjectRoot(workspaceRoot: string): string {
    const projectRoot: string = workspaceRoot;

    return projectRoot;
  }

  /**
   *  Helper function check if a file exists.
   */
  public static existsSync(path1: string): boolean {
    try {
      // Attempt to get the file stats
      fs.statSync(path1);
      return true;
    } catch (error) {
      return false;
    }
  }


  /**
   *  Helper (synchronous) function to create a directory recursively
   */
  public static makeDirectoryRecursive(dirPath: string): void {
    let parentPath = path.dirname(dirPath);
    if (!LunaProjectHelper.existsSync(parentPath)) {
      LunaProjectHelper.makeDirectoryRecursive(parentPath);
    }

    fs.mkdirSync(dirPath);
  }


  /**
   *  Helper function to asynchronously copy a file
   */
  public static copyFile(from: string, to: string, encoding?: string): Q.Promise<any> {
    let deferred: Q.Deferred<any> = Q.defer();
    let destFile: fs.WriteStream = fs.createWriteStream(to, {encoding: encoding});
    let srcFile: fs.ReadStream = fs.createReadStream(from, {encoding: encoding});
    destFile.on('finish', function (): void {
      deferred.resolve({});
    });

    destFile.on('error', function (e: Error): void {
      deferred.reject(e);
    });

    srcFile.on('error', function (e: Error): void {
      deferred.reject(e);
    });

    srcFile.pipe(destFile);
    return deferred.promise;
  }


  /**
   *  Helper function to get the target path for the type definition files (to be used for Cordova plugin intellisense).
   *  Creates the target path if it does not exist already.
   */
  public static getOrCreateTypingsTargetPath(projectRoot: string): string {
    if (projectRoot) {
      let targetPath = path.resolve(projectRoot, LunaProjectHelper.VSCODE_DIR, LunaProjectHelper.PROJECT_TYPINGS_FOLDERNAME);
      if (!LunaProjectHelper.existsSync(targetPath)) {
        LunaProjectHelper.makeDirectoryRecursive(targetPath);
      }

      return targetPath;
    }

    return null;
  }

  public static getInstalledPluginDetails(projectRoot: string, pluginId: string): IPluginDetails {
    return null;
  }

  /**
   *  Helper function to get the path to Ionic plugin type definitions folder
   */
  public static getLunaPluginTypeDefsPath(projectRoot: string): string {
    return path.resolve(LunaProjectHelper.getOrCreateTypingsTargetPath(projectRoot),
      LunaProjectHelper.PROJECT_TYPINGS_PLUGINS_FOLDERNAME);
  }
}
