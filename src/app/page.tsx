"use client";

import { useEffect, useRef, useState } from "react";

import Header from "./components/Header";
import FileBar from "./components/FileBar";
import Editor from "./components/Editor";
import Terminal, { type TerminalHandle, } from "./components/Terminal";
import PythonRuntime from "@/lib/PythonRuntime";
import { downloadFile } from "@/lib/downloadFile";

import {
  createFile as createStoredFile,
  getAllFiles,
  saveFile as saveStoredFile,
  deleteFile as deleteStoredFile,
  renameFile as renameStoredFile,
  type ProjectFile,
} from "@/lib/fileStorage";

export default function Home() {
  const [files, setFiles] = useState<ProjectFile[]>([]);

  //const [selectedFileId, setSelectedFileId] = useState("");
  const [currentFile, setCurrentFile] = useState<ProjectFile | null>(null);

  const [fileLoaded, setFileLoaded] = useState(false);

  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function loadFiles() {
      try {
        let storedFiles = await getAllFiles();

        if (storedFiles.length === 0) {
          const defaultFile = await createStoredFile("test.pseu");

          await saveStoredFile({
            ...defaultFile,
            code: `DECLARE name : STRING
name ← "Alice"
OUTPUT name`,
          });

          storedFiles = await getAllFiles();
        }

        if (cancelled) return;

        setFiles(storedFiles);
        setCurrentFile(storedFiles[0] ?? null);
      } catch (error) {
        console.error("Failed to load files:", error);
      } finally {
        if (!cancelled) {
          setFileLoaded(true);
        }
      }
    }

    loadFiles();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateFileContent(newContent: string) {
    if (!currentFile) return;

    const updatedFile: ProjectFile = {
      ...currentFile,
      code: newContent,
      updatedAt: Date.now(),
    };

    setCurrentFile(updatedFile);

    setFiles((oldFiles) =>
      oldFiles.map((file) =>
        file.id === updatedFile.id ? updatedFile : file
      )
    );

    const oldTimer = saveTimers.current.get(updatedFile.id);

    if (oldTimer) {
      clearTimeout(oldTimer);
    }

    const timer = setTimeout(() => {
      saveStoredFile(updatedFile)
        .catch(console.error)
        .finally(() => {
          saveTimers.current.delete(updatedFile.id);
        });
    }, 500);

    saveTimers.current.set(updatedFile.id, timer);
  }

  async function generateNewFile() {
    let fileName = "untitled file.pseu"
    let i = 1;
    while (files.some((file) => file.name === fileName)) {
      fileName = `untitled file(${i}).pseu`;
      i++;
    }

    try {
      const newFile = await createStoredFile(fileName);
      setFiles((oldFiles) => [...oldFiles, newFile]);
      setCurrentFile(newFile);
    } catch (error) {
      console.error(error);
      addRedTerminal("Failed to create file");
    }
  }

  const [isRenaming, setIsRenaming] = useState(false);
  const [newFileName, setNewFileName] = useState("");

  function renameFile(newName: string): boolean {
    if (!currentFile) return false;

    const trimmedName = newName.trim();

    if (!trimmedName) return false;

    if (
      files.some(
        (file) =>
          file.id !== currentFile.id &&
          file.name === trimmedName
      )
    ) {
      return false;
    }

    const updatedFile = {
      ...currentFile,
      name: trimmedName,
      updatedAt: Date.now(),
    };

    setFiles((oldFiles) =>
      oldFiles.map((file) =>
        file.id === currentFile.id ? updatedFile : file
      )
    );

    setCurrentFile(updatedFile);

    renameStoredFile(currentFile.id, trimmedName)
      .catch(console.error);

    return true;
  }

  async function deleteFile() {
    if (!currentFile) return;

    const id = currentFile.id;

    const timer = saveTimers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
    }

    try {
      await deleteStoredFile(id);

      const newFiles = files.filter(
        (file) => file.id !== id
      );

      setFiles(newFiles);
      setCurrentFile(newFiles[0] ?? null);
    } catch (error) {
      console.error(error);
      addRedTerminal("Failed to delete file");
    }
  }

  const terminalRef = useRef<TerminalHandle | null>(null);

  function addLineTerminal(text: string) {
    terminalRef.current?.write(text + "\r\n");
  }
  function addGreenTerminal(text: string) {
    addLineTerminal("\x1b[92m" + text + "\x1b[0m")
  }
  function addRedTerminal(text: string) {
    addLineTerminal("\x1b[91m" + text + "\x1b[0m")
  }

  const [isReady, setIsReady] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  function onReady() {
    setIsReady(true)
  }

  function onInitError(text: string) {
    setIsReady(false);
    setIsRunning(false);
    addRedTerminal("Init fail: " + text);
  }

  function onRunning() {
    setIsRunning(true)
  }

  function onOutput(text: string) {
    // Python 的输出原样写入，不额外添加换行
    terminalRef.current?.write(
      text.replace(/\r?\n/g, "\r\n")
    );
  }

  function onError(text: string) {
    addRedTerminal(text)
  }

  function onDone() {
    setIsRunning(false)
    addGreenTerminal("DONE!\n")
  }

  const runtimeRef = useRef<PythonRuntime | null>(null)
  useEffect(() => {
    const runtime = new PythonRuntime({ onReady, onInitError, onRunning, onOutput, onError, onDone })
    runtimeRef.current = runtime

    return () => {
      runtime.terminate()
      runtimeRef.current = null
    }
  }, [])

  function clearTerminal() {
    terminalRef.current?.clear()
  }

  function run() {
    if (!isReady || isRunning) return;

    if (!currentFile?.name.toLowerCase().endsWith(".pseu")) {
        addRedTerminal("Only files with .pseu extension can be executed!");
        return;
    }

    const code = currentFile?.code;

    if (code === undefined) {
      addLineTerminal("No file selected!");
      return;
    }

    addGreenTerminal("Running: " + currentFile?.name);

    setIsRunning(true);
    runtimeRef.current?.run(code);
  }

  function stop() {
    if (!isReady || !isRunning) return

    runtimeRef.current?.stop()
    setIsReady(false);
    setIsRunning(false);

    addLineTerminal("Program interuptted by user input")
  }

  function downloadCurrentFile() {
    if (!currentFile) return;
    downloadFile(currentFile.name, currentFile.code);
  }

  useEffect(() => {
    terminalRef.current?.onInput((data) => {
      console.log("Sending input to Python:", JSON.stringify(data));
      runtimeRef.current?.sendInput(data);
    });
  }, []);

  return (
    <main className="app">
      <Header
        selectedFile={currentFile?.name ?? ""}
        generateNewFile={generateNewFile}
        deleteFile={deleteFile}
        isRenaming={isRenaming}
        setIsRenaming={setIsRenaming}
        setNewFilename={setNewFileName}
        run={run}
        stop={stop}
        isReady={isReady}
        isRunning={isRunning}
        clearTerminal={clearTerminal}
        downloadCurrentFile={downloadCurrentFile}
      />
      <div className="workspace">
        <FileBar
          title="My files"
          files={files}
          currentFile={currentFile}
          setCurrentFile={setCurrentFile}
          isRenaming={isRenaming}
          setIsRenaming={setIsRenaming}
          newFileName={newFileName}
          setNewFileName={setNewFileName}
          renameFile={renameFile}
        />
        <div className="textspace">
          <Editor
            filename={currentFile?.name ?? ""}
            fileContent={currentFile?.code ?? ""}
            updateFileContent={updateFileContent}
          />
          <section className="terminal-panel" aria-label="Program output terminal">
            <div className="terminal-toolbar">
              <div className="terminal-title">
                <span className="terminal-prompt" aria-hidden="true">&gt;_</span>
                <h2>Console</h2>
              </div>
              <span className="terminal-hint">Output and input</span>
            </div>
            <Terminal ref={terminalRef} />
          </section>
        </div>
      </div>
    </main>
  );
}
