import { loadPyodide } from "pyodide";

self.onmessage = async () => {
  const pyodide = await loadPyodide();

  pyodide.setStdout({
    batched: (text) => {
      self.postMessage({
        type: "output",
        text,
      });
    },
  });

  pyodide.runPython(`
print("Hello World")
print("Python is running in the browser!")
  `);

  self.postMessage({ type: "done" });
};