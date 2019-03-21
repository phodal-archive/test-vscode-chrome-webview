import * as path from 'path';
import * as vscode from 'vscode';
import {LunaProjectHelper} from './utils/LunaProjectHelper';
import {TsdHelper} from './utils/tsdHelper';
import {CatCodingPanel} from './CatCodingPanel';
import {LunaCompletionProvider} from './extension/completionProviders';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((event) => onChangeWorkspaceFolders(context, event)));
  const workspaceFolders: vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;

  if (workspaceFolders) {
    registerLunaCommands(context);
    workspaceFolders.forEach((folder: vscode.WorkspaceFolder) => {
      onFolderAdded(context, folder);
    });
  }

  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer(CatCodingPanel.viewType, {
      async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
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

  if (LunaProjectHelper.isLunaProject(lunaProjectRoot)) {
    let lunaTypings: string[] = [
      path.join('luna', 'luna.d.ts'),
    ];

    if (LunaProjectHelper.isLunaProject(lunaProjectRoot)) {
      context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
          LunaCompletionProvider.HTML_DOCUMENT_SELECTOR,
          new LunaCompletionProvider(path.resolve(__dirname, '../snippets/luna.html.snippets.json'))));
      context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
          LunaCompletionProvider.JS_DOCUMENT_SELECTOR,
          new LunaCompletionProvider(path.resolve(__dirname, '../snippets/luna.js.snippets.json'))));
      context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
          LunaCompletionProvider.TS_DOCUMENT_SELECTOR,
          new LunaCompletionProvider(path.resolve(__dirname, '../snippets/luna.ts.snippets.json'))));
    }

    TsdHelper.installTypings(LunaProjectHelper.getOrCreateTypingsTargetPath(lunaProjectRoot), lunaTypings, lunaProjectRoot);
  }
}
