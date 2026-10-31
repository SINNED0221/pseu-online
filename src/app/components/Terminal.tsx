"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export type TerminalHandle = {
  write: (text: string) => void;
  clear: () => void;
  onInput: (callback: (text: string) => void) => void;
};

const Terminal = forwardRef<TerminalHandle>(function Terminal(_, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);

  const inputBuffer = useRef("")

  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 18,
      fontFamily: "monospace",
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    const observer = new ResizeObserver(() => {
      fitAddon.fit();
    });
    observer.observe(containerRef.current);

    terminalRef.current = terminal;

    terminal.writeln("\x1b[92mTerminal Ready!\x1b[0m");

    return () => {
      observer.disconnect();
      terminal.dispose();
      terminalRef.current = null;
    };

  }, []);

  useImperativeHandle(ref, () => ({
    write(text: string) {
      terminalRef.current?.write(text);
    },
    clear() {
      terminalRef.current?.clear();
    },
    onInput(callback: (text: string) => void) {
      const terminal = terminalRef.current;
      if (!terminal) return;

      terminal.onData((data) => {
        if (data === "\r") {
          terminal.write("\r\n");
          callback(inputBuffer.current);
          inputBuffer.current = "";
        } else if (data === "\u007f") {
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = Array.from(
              inputBuffer.current
            ).slice(0, -1).join("");
            terminal.write("\b \b");
          }
        } else if (
          data >= " " &&
          data !== "\u007f" &&
          !data.startsWith("\u001b")
        ) {
          inputBuffer.current += data;
          terminal.write(data);
        }
      });
    }
  }), []);

  return <div ref={containerRef} className="terminal" />;
});

export default Terminal;
