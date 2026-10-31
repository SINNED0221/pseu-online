"use client";

import MonacoEditor from "@monaco-editor/react";

type EditorProps = {
    filename: string
    fileContent: string
    updateFileContent: (file: string) => void
} 

export default function Editor(props: EditorProps) {
    return (
        <section className="editor">
            <h3>{props.filename}</h3>
            <MonacoEditor 
            className="code" 
            height="100%"
            language="python"
            theme="vs-dark"
            value={props.fileContent}
            onChange={(value) => props.updateFileContent(value ?? " ")}
            options={{
                fontSize: 16,
                lineNumbers: "on",
                minimap: { enabled: true },
                tabSize: 4,
                scrollBeyondLastLine: false,
            }}
            />
        </section>
    )
}