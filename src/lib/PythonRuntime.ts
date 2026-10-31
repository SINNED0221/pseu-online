type RuntimeCallbacks = {
  onReady: () => void;
  onInitError: (text: string) => void;
  onRunning: () => void;
  onOutput: (text: string) => void;
  onError: (text: string) => void;
  onDone: () => void;
};

const BUFFER_SIZE = 65536;

export default class PythonRuntime {
  private worker: Worker;
  private callbacks: RuntimeCallbacks;
  private sharedBuffer: SharedArrayBuffer;
  private shared: Int32Array;
  private bytes: Uint8Array;

  constructor(callbacks: RuntimeCallbacks) {
    this.callbacks = callbacks;

    this.sharedBuffer = new SharedArrayBuffer(
      BUFFER_SIZE * Int32Array.BYTES_PER_ELEMENT
    );
    this.shared = new Int32Array(this.sharedBuffer);
    this.bytes = new Uint8Array(this.sharedBuffer);

    this.worker = this.createWorker();
  }

  private createWorker(): Worker {
    const worker = new Worker("/python.worker.js", {
      type: "module",
    });

    worker.postMessage({
      type: "stdin-init",
      buffer: this.sharedBuffer,
    });

    worker.onmessage = (event: MessageEvent) => {
      const message = event.data;

      switch (message.type) {
        case "ready":
          this.callbacks.onReady();
          break;
        case "init-error":
          this.callbacks.onInitError(message.text);
          break;
        case "running":
          this.callbacks.onRunning();
          break;
        case "output":
          this.callbacks.onOutput(message.text);
          break;
        case "error":
          this.callbacks.onError(message.text);
          break;
        case "done":
          this.callbacks.onDone();
          break;
      }
    };

    return worker;
  }

  run(code: string) {
    this.worker.postMessage({ type: "run", code });
  }


  sendInput(text: string) {
    const encoded = new TextEncoder().encode(text + "\n");

    const capacity = this.shared.length * 4 - 12;

    if (encoded.length > capacity) {
      this.callbacks.onError("Input is too long.");
      return;
    }

    // 等待 Worker 完成上一行输入
    if (Atomics.load(this.shared, 0) !== 0) {
      console.warn("Previous input has not been consumed");
      return;
    }

    this.bytes.set(encoded, 12);

    Atomics.store(this.shared, 1, encoded.length);
    Atomics.store(this.shared, 2, 0);

    // 发布输入数据后再通知 Worker
    Atomics.store(this.shared, 0, 1);
    Atomics.notify(this.shared, 0);

    console.log(
      "buffer state:",
      Atomics.load(this.shared, 0),
      "length:",
      Atomics.load(this.shared, 1),
      "position:",
      Atomics.load(this.shared, 2)
    );

    console.log("Input submitted:", text);
  }

  terminate() {
    this.worker.terminate();
  }

  stop() {
    this.terminate();

    // 停止后重新建立 Worker 和共享输入缓冲区
    this.sharedBuffer = new SharedArrayBuffer(
      BUFFER_SIZE * Int32Array.BYTES_PER_ELEMENT
    );
    this.shared = new Int32Array(this.sharedBuffer);
    this.bytes = new Uint8Array(this.sharedBuffer);

    this.worker = this.createWorker();
  }
}