// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for details.

import * as fs from 'fs';
import {
  CompletionItem, CompletionItemKind, CompletionItemProvider,
  DocumentSelector, SnippetString
} from 'vscode';

// Types to outline TextMate snippets format, used in this extension's snippet files
interface TMSnippet {
  prefix: string;
  body: string[];
  description: string;
}

interface TMSnippets {
  [name: string]: TMSnippet;
}

export class LunaCompletionProvider implements CompletionItemProvider {
  public static HTML_DOCUMENT_SELECTOR: DocumentSelector = 'html';
  public static JS_DOCUMENT_SELECTOR: DocumentSelector = 'javascript';
  public static TS_DOCUMENT_SELECTOR: DocumentSelector = 'typescript';

  private snippetCompletions: CompletionItem[];

  constructor(private completionsSource: string) {
  }

  public provideCompletionItems(): CompletionItem[] {

    if (this.snippetCompletions) {
      return this.snippetCompletions;
    }

    this.snippetCompletions = [];

    try {
      let rawSnippets: TMSnippets = JSON.parse(fs.readFileSync(this.completionsSource, 'utf8'));
      this.snippetCompletions = Object.keys(rawSnippets)
        .map(name => makeCompletionItem(rawSnippets[name]));

    } catch (err) {
      // Log error here and do not try to read snippets anymore
      console.warn(`Failed to read snippets from ${this.completionsSource}`);
    }

    return this.snippetCompletions;
  }
}

function makeCompletionItem(rawSnippet: TMSnippet): CompletionItem {
  const item = new CompletionItem(rawSnippet.prefix);
  item.documentation = rawSnippet.description;
  item.kind = CompletionItemKind.Snippet;
  item.insertText = new SnippetString(rawSnippet.body.join('\n'));

  return item;
}
