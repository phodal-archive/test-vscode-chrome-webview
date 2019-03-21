import * as path from 'path';
import * as vscode from 'vscode';
import {LunaProjectHelper} from './utils/LunaProjectHelper';
import {TsdHelper} from './utils/tsdHelper';
import {CatCodingPanel} from './CatCodingPanel';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((event) => onChangeWorkspaceFolders(context, event)));
  const workspaceFolders: vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;

  console.log('------------');
  console.log(workspaceFolders);
  if (workspaceFolders) {
    registerLunaCommands(context);
    workspaceFolders.forEach((folder: vscode.WorkspaceFolder) => {
      onFolderAdded(context, folder);
    });
  }

  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
        console.log(`Got state: ${state}`);
        CatCodingPanel.revive(webviewPanel, context.extensionPath);
      }
    });
  }
}

export function deactivate(): void {
  console.log('Extension has been deactivated');
}

function registerLunaCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('luna.start', () => {
    CatCodingPanel.createOrShow(context.extensionPath);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('luna.doRefactor', () => {
    if (CatCodingPanel.currentPanel) {
      CatCodingPanel.currentPanel.doRefactor();
    }
  }));
}

function onChangeWorkspaceFolders(context: vscode.ExtensionContext, event: vscode.WorkspaceFoldersChangeEvent) {
  console.log(event);
  if (event.removed.length) {
    event.removed.forEach((folder) => {
      onFolderRemoved(folder);
    });
  }

  if (event.added.length) {
    event.added.forEach((folder) => {
      onFolderAdded(context, folder);
    });
  }
}

function onFolderRemoved(folder: vscode.WorkspaceFolder): void {

}

function onFolderAdded(context: vscode.ExtensionContext, folder: vscode.WorkspaceFolder): void {
  const workspaceRoot = folder.uri.fsPath;
  const lunaProjectRoot = LunaProjectHelper.getLunaProjectRoot(workspaceRoot);

  console.log('aa');
  if (LunaProjectHelper.isLunaProject(lunaProjectRoot)) {
    console.log('aaaaa');
    let lunaTypings: string[] = [
      path.join('luna', 'luna.d.ts'),
    ];

    TsdHelper.installTypings(LunaProjectHelper.getOrCreateTypingsTargetPath(lunaProjectRoot), lunaTypings, lunaProjectRoot);
  }
}
