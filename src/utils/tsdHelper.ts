// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as path from 'path';
import * as fs from 'fs';
import * as Q from 'q';
import {TelemetryHelper} from './telemetryHelper';
import {LunaProjectHelper} from './LunaProjectHelper';

export class TsdHelper {
  private static LUNA_TYPINGS_FOLDERNAME = 'LunaTypings';
  private static LUNA_TYPINGS_PATH = path.resolve(__dirname, '..', '..', TsdHelper.LUNA_TYPINGS_FOLDERNAME);
  private static USER_TYPINGS_FOLDERNAME = 'typings';

  /**
   *   Helper to install type defintion files for Luna plugins and Ionic projects.
   *   {typingsFolderPath} - the parent folder where the type definitions need to be installed
   *   {typeDefsPath} - the relative paths of all plugin type definitions that need to be
   *                    installed (relative to <project_root>\.vscode\typings)
   */
  public static installTypings(typingsFolderPath: string, typeDefsPath: string[], projectRoot?: string): void {
    let installedTypeDefs: string[] = [];

    TelemetryHelper.generate('addTypings', (generator) => {
      generator.add('addedTypeDefinitions', typeDefsPath, false);
      return Q.all(typeDefsPath.map((relativePath: string): Q.Promise<any> => {
        let src = path.resolve(TsdHelper.LUNA_TYPINGS_PATH, relativePath);
        let dest = path.resolve(typingsFolderPath, relativePath);

        // Check if we've previously copied these typings
        if (LunaProjectHelper.existsSync(dest)) {
          return Q.resolve(void 0);
        }

        // Check if the user has these typings somewhere else in his project
        if (projectRoot) {
          // We check for short path (e.g. projectRoot/typings/angular.d.ts) and long path (e.g. projectRoot/typings/angular/angular.d.ts)
          let userTypingsShortPath = path.join(projectRoot, TsdHelper.USER_TYPINGS_FOLDERNAME, path.basename(relativePath));
          let userTypingsLongPath = path.join(projectRoot, TsdHelper.USER_TYPINGS_FOLDERNAME, relativePath);

          if (LunaProjectHelper.existsSync(userTypingsShortPath) || LunaProjectHelper.existsSync(userTypingsLongPath)) {
            return Q.resolve(void 0);
          }
        }

        return TsdHelper.installTypeDefinitionFile(src, dest)
        // Save installed typedef to write them all at once later
          .then(() => installedTypeDefs.push(dest));
      }));
    })
      .finally(() => {
        if (installedTypeDefs.length === 0) {
          return;
        }

        let typingsFolder = path.resolve(projectRoot, TsdHelper.USER_TYPINGS_FOLDERNAME);
        let indexFile = path.resolve(typingsFolder, 'luna-typings.d.ts');

        // Ensure that the 'typings' folder exits; if not, create it
        if (!LunaProjectHelper.existsSync(typingsFolder)) {
          LunaProjectHelper.makeDirectoryRecursive(typingsFolder);
        }

        let references = LunaProjectHelper.existsSync(indexFile) ? fs.readFileSync(indexFile, 'utf8') : '';
        let referencesToAdd = installedTypeDefs
        // Do not add references to typedefs that are not exist,
        // this rarely happens if typedef file fails to copy
          .filter(typeDef => LunaProjectHelper.existsSync(typeDef))
          .map(typeDef => path.relative(typingsFolder, typeDef))
          // Avoid adding duplicates if reference already exist in index
          .filter(typeDef => references.indexOf(typeDef) < 0)
          .map(typeDef => `/// <reference path="${typeDef}"/>`);

        if (referencesToAdd.length === 0) {
          return;
        }

        fs.writeFileSync(indexFile, [references].concat(referencesToAdd).join('\n'), 'utf8');
      });
  }

  public static removeTypings(typingsFolderPath: string, typeDefsToRemove: string[], projectRoot: string): void {
    if (typeDefsToRemove.length === 0) {
      return;
    }

    typeDefsToRemove.forEach(typeDef => {
      fs.unlink(path.resolve(typingsFolderPath, typeDef), err => {
        if (err) {
          console.error(err);
        }
      });
    });

    let references = [];
    let indexFile = path.resolve(projectRoot, TsdHelper.USER_TYPINGS_FOLDERNAME, 'luna-typings.d.ts');
    try {
      references = fs.readFileSync(indexFile, 'utf8').split('\n');
    } catch (e) {
      // We failed to read index file - it might not exist of
      // blocked by other process - can't do anything here
      return;
    }

    let referencesToPersist = references.filter(ref =>
      // Filter out references that we need to delete
      ref && !typeDefsToRemove.some(typedef => ref.indexOf(typedef) >= 0));

    referencesToPersist.length === 0 ?
      fs.unlinkSync(indexFile) :
      // Write filtered references back to index file
      fs.writeFileSync(indexFile, referencesToPersist.join('\n'), 'utf8');
  }

  private static installTypeDefinitionFile(src: string, dest: string): Q.Promise<any> {
    // Ensure that the parent folder exits; if not, create the hierarchy of directories
    let parentFolder = path.resolve(dest, '..');
    if (!LunaProjectHelper.existsSync(parentFolder)) {
      LunaProjectHelper.makeDirectoryRecursive(parentFolder);
    }

    return LunaProjectHelper.copyFile(src, dest);
  }
}
