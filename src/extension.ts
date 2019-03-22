import * as path from 'path';
import * as vscode from 'vscode';
import {LunaProjectHelper} from './utils/LunaProjectHelper';
import {TsdHelper} from './utils/tsdHelper';
import {CatCodingPanel} from './CatCodingPanel';
import {LunaCompletionProvider} from './extension/completionProviders';

let PLUGIN_TYPE_DEFS_FILENAME = 'pluginTypings.json';
let PLUGIN_TYPE_DEFS_PATH = path.resolve(__dirname, '..', PLUGIN_TYPE_DEFS_FILENAME);

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

  if (!LunaProjectHelper.isLunaProject(lunaProjectRoot)) {
    return;
  }

  let lunaTypings: string[] = [
    path.join('luna', 'luna.d.ts'),
  ];

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

  // install based typings
  TsdHelper.installTypings(LunaProjectHelper.getOrCreateTypingsTargetPath(lunaProjectRoot), lunaTypings, lunaProjectRoot);

  // install plugins
  addPluginTypeDefinitions(lunaProjectRoot);
}

function getPluginTypingsJson(): any {
  if (LunaProjectHelper.existsSync(PLUGIN_TYPE_DEFS_PATH)) {
    return require(PLUGIN_TYPE_DEFS_PATH);
  }

  console.error('Luna plugin type declaration mapping file \'pluginTypings.json\' is missing from the extension folder.');
  return null;
}

function addPluginTypeDefinitions(projectRoot: string): void {
  let pluginTypings = getPluginTypingsJson();
  if (!pluginTypings) {
    return;
  }

  let typingsToAdd = Object.keys(pluginTypings).map((pluginName: string) => {
    return pluginTypings[pluginName].typingFile;
  });

  TsdHelper.installTypings(LunaProjectHelper.getOrCreateTypingsTargetPath(projectRoot), typingsToAdd, projectRoot);
}
