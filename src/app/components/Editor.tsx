"use client";

import MonacoEditor, { type OnMount } from "@monaco-editor/react";
import { setupTextMate } from "@/lib/textmate/setupTextmate";

type EditorProps = {
    filename: string;
    fileContent: string;
    updateFileContent: (file: string) => void;
};


const handleEditorMount: OnMount = async (editor, monaco) => {
  monaco.editor.defineTheme("caie-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "keyword.control.caie",
        foreground: "C586C0",
      },
      {
        token: "storage.type.caie",
        foreground: "4EC9B0",
      },
      {
        token: "string.quoted.double.caie",
        foreground: "CE9178",
      },
      {
        token: "comment.line.double-slash.caie",
        foreground: "6A9955",
      },
      {
        token: "invalid.illegal.caie",
        foreground: "F44747",
      },
      {
        token: "keyword.operator.caie",
        foreground: "D4D4D4",
      },
    ],
    colors: {
      "editor.background": "#101722",
      "editor.lineHighlightBackground": "#17212d",
      "editorLineNumber.foreground": "#64748b",
      "editorLineNumber.activeForeground": "#c5d2e0",
      "editorGutter.background": "#101722",
      "editorCursor.foreground": "#73e0b2",
      "editor.selectionBackground": "#294c42",
    },
  });

  monaco.editor.setTheme("caie-dark");

  try {
    await setupTextMate(monaco);

    const model = editor.getModel();

    if (model) {
      monaco.editor.setModelLanguage(model, "caie-pseudocode");
    }

    console.log("Editor language:", editor.getModel()?.getLanguageId());
  } catch (error) {
    console.error("TextMate initialization failed:", error);
  }
};

export default function Editor(props: EditorProps) {
    return (
        <section className="editor" aria-label="Pseudocode editor">
            <div className="editor-toolbar">
                <div className="editor-file">
                    <span className="file-icon" aria-hidden="true">P</span>
                    <div className="editor-file-copy">
                        <h2>{props.filename || "No file selected"}</h2>
                        <p>Workspace / {props.filename || "Untitled"}</p>
                    </div>
                </div>
                <span className="language-badge">PSEUDOCODE</span>
            </div>

            <MonacoEditor
                className="code"
                height="100%"
                language={props.filename.endsWith("pseu") ? "caie-pseudocode" : "plaintext"}
                theme="caie-dark"
                value={props.fileContent}
                onMount={handleEditorMount}
                onChange={(value) =>
                    props.updateFileContent(value ?? "")
                }
                options={{
                    fontSize: 16,
                    lineNumbers: "on",
                    minimap: { enabled: true },
                    tabSize: 4,
                    scrollBeyondLastLine: false,
                }}
            />
        </section>
    );
}