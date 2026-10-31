
"use client";

import { useEffect, useRef } from "react";

type PythonRunnerProps = {
  code: string;
  onOutput: (text: string) => void;
};

export default function PythonRunner({
  code,
  onOutput,
}: PythonRunnerProps) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const worker = new Worker("/python.worker.js", {
      type: "module",
    });

    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;

      if (message.type === "output") {
        onOutput(message.text);
      }

      if (message.type === "error") {
        onOutput(`Error: ${message.text}\n`);
      }

      if (message.type === "done") {
        onOutput("\n[Execution finished]\n");
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [onOutput]);

  function runCode() {
    workerRef.current?.postMessage({
      type: "run",
      code,
    });
  }

  return (
    <button onClick={runCode}>
      Run Python
    </button>
  );
}

