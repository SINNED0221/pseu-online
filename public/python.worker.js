
import { loadPyodide } from
  "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

let pyodide = null;
let isRunning = false;
let shared = null;
let bytes = null;

const initPromise = (async () => {
  try {
    pyodide = await loadPyodide({
      indexURL:
        "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/",
    });

    await loadInterpreterFiles();

    const decoder = new TextDecoder();

    pyodide.setStdout({
      raw: (byte) => {
        const text = decoder.decode(
          new Uint8Array([byte]),
          { stream: true }
        );

        if (text) {
          self.postMessage({ type: "output", text });
        }
      },
    });




    pyodide.setStdin({
      read(buffer) {
        if (!shared || !bytes) {
          throw new Error("stdin buffer is not initialized");
        }

        while (Atomics.load(shared, 0) === 0) {
          Atomics.wait(shared, 0, 0);
        }

        const length = Atomics.load(shared, 1);
        const index = Atomics.load(shared, 2);
        const remaining = length - index;

        if (remaining <= 0) {
          return 0;
        }

        const count = Math.min(buffer.length, remaining);

        buffer.set(bytes.subarray(12 + index, 12 + index + count));

        const nextIndex = index + count;
        Atomics.store(shared, 2, nextIndex);

        if (nextIndex >= length) {
          Atomics.store(shared, 0, 0);
          Atomics.store(shared, 1, 0);
          Atomics.store(shared, 2, 0);
          Atomics.notify(shared, 0);
        }

        return count;
      },
      isatty: true,
    });

    self.postMessage({ type: "ready" });
  } catch (error) {
    self.postMessage({
      type: "init-error",
      text: String(error),
    });
  }
})();

self.onmessage = async (event) => {
  const message = event.data;

  if (message.type === "stdin-init") {
    shared = new Int32Array(message.buffer);
    bytes = new Uint8Array(message.buffer);
    return;
  }

  if (message.type !== "run" || isRunning) return;

  await initPromise;
  if (!pyodide) return;

  isRunning = true;
  self.postMessage({ type: "running" });

  try {
    //await pyodide.runPythonAsync(message.code);
    pyodide.globals.set("pseuCode", message.code);
    pyodide.runPython(`
    inter = pci.interpreter()
    inter.initRun(pseuCode)
    `);
    self.postMessage({ type: "done" });
  } catch (error) {
    self.postMessage({
      type: "error",
      text: String(error),
    });
  } finally {
    isRunning = false;
  }
};

async function loadInterpreterFiles() {
  const files = [
    "pci.py",
    "builtinFunction.py",
    "settings.py",
  ];

  pyodide.FS.mkdirTree("/home/pyodide/interpreter");
  pyodide.FS.chdir("/home/pyodide/interpreter");

  for (const file of files) {
    const response = await fetch(`/python/${file}`);

    if (!response.ok) {
      throw new Error(`Failed to load ${file}: ${response.status}`);
    }

    const content = await response.text();
    pyodide.FS.writeFile(file, content);
  }

  pyodide.runPython(`
import sys
sys.path.insert(0, "/home/pyodide/interpreter")
import pci
`);
}