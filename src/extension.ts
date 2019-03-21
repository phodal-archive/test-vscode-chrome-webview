import * as path from 'path';
import * as vscode from 'vscode';
import {LunaProjectHelper} from './utils/LunaProjectHelper';
import {TsdHelper} from './utils/tsdHelper';

const cats = {
  'Coding Cat': 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif',
  'Compiling Cat': 'https://media.giphy.com/media/mlvseq9yvZhba/giphy.gif',
  'Testing Cat': 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif'
};

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.workspace.onDidChangeWorkspaceFolders((event) => onChangeWorkspaceFolders(context, event)));
  const workspaceFolders: vscode.WorkspaceFolder[] | undefined = vscode.workspace.workspaceFolders;
  // if (workspaceFolders) {
  //   registerCordovaCommands(context);
  //   workspaceFolders.forEach((folder: vscode.WorkspaceFolder) => {
  //     onFolderAdded(context, folder);
  //   });
  // }

  context.subscriptions.push(vscode.commands.registerCommand('luna.start', () => {
    CatCodingPanel.createOrShow(context.extensionPath);
  }));

  context.subscriptions.push(vscode.commands.registerCommand('luna.doRefactor', () => {
    if (CatCodingPanel.currentPanel) {
      CatCodingPanel.currentPanel.doRefactor();
    }
  }));

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

class CatCodingPanel {
  public static currentPanel: CatCodingPanel | undefined;
  public static readonly viewType = 'catCoding';

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionPath: string) {
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if (CatCodingPanel.currentPanel) {
      CatCodingPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(CatCodingPanel.viewType, 'Cat Coding', column || vscode.ViewColumn.One, {
      enableScripts: true,

      localResourceRoots: [
        vscode.Uri.file(path.join(extensionPath, 'media'))
      ]
    });

    CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath);
  }

  public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
    CatCodingPanel.currentPanel = new CatCodingPanel(panel, extensionPath);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionPath: string
  ) {
    this._panel = panel;
    this._extensionPath = extensionPath;

    this._update();

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.onDidChangeViewState(e => {
      if (this._panel.visible) {
        this._update();
      }
    }, null, this._disposables);

    this._panel.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'alert':
          vscode.window.showErrorMessage(message.text);
          return;
      }
    }, null, this._disposables);
  }

  public doRefactor() {
    this._panel.webview.postMessage({command: 'refactor'});
  }

  public dispose() {
    CatCodingPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {

    const z = 1 + 2;
    // Vary the webview's content based on where it is located in the editor.
    switch (this._panel.viewColumn) {
      case vscode.ViewColumn.Two:
        this._updateForCat('Compiling Cat');
        return;

      case vscode.ViewColumn.Three:
        this._updateForCat('Testing Cat');
        return;

      case vscode.ViewColumn.One:
      default:
        this._updateForCat('Coding Cat');
        return;
    }
  }

  private _updateForCat(catName: keyof typeof cats) {
    this._panel.title = catName;
    this._panel.webview.html = this._getHtmlForWebview(cats[catName]);
  }

  private _getHtmlForWebview(catGif: string) {

    // Local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.file(path.join(this._extensionPath, 'media', 'main.js'));

    // And the uri we use to load this script in the webview
    const scriptUri = scriptPathOnDisk.with({scheme: 'vscode-resource'});

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    // tslint:disable
    return`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';">

                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Cat Coding</title>
            </head>
            <body>
                <img src="${catGif}" width="300" />
                <h1 id="lines-of-code-counter">0</h1>

                <script nonce="${nonce}" src="${scriptUri}"></script>
            </body>
            </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
