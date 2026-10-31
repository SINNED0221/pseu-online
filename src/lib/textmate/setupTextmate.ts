import type * as Monaco from "monaco-editor";
import { Registry } from "monaco-textmate";
import { loadWASM } from "onigasm";
import { wireTmGrammars } from "monaco-editor-textmate";
import grammar from "./pseudo.tmLanguage.json";

let setupPromise: Promise<void> | null = null;

async function initializeTextMate(
  monaco: typeof Monaco
): Promise<void> {
  const registeredLanguages = monaco.languages
    .getLanguages()
    .map((language) => language.id);

  if (!registeredLanguages.includes("caie-pseudocode")) {
    monaco.languages.register({
      id: "caie-pseudocode",
      extensions: [".pseu"],
      aliases: ["CAIE Pseudocode", "pseudocode"],
    });
  }

  const response = await fetch("/onigasm.wasm");

  if (!response.ok) {
    throw new Error(`Failed to load onigasm.wasm: ${response.status}`);
  }

  await loadWASM(await response.arrayBuffer());

  const registry = new Registry({
    getGrammarDefinition: async (scopeName) => {
      if (scopeName !== "source.caie") {
        throw new Error(`Unknown grammar scope: ${scopeName}`);
      }

      return {
        format: "json",
        content: JSON.stringify(grammar),
      };
    },
  });

  const grammars = new Map<string, string>();
  grammars.set("caie-pseudocode", "source.caie");

  await wireTmGrammars(monaco, registry, grammars);

  console.log("TextMate grammar loaded successfully");
}

export function setupTextMate(
  monaco: typeof Monaco
): Promise<void> {
  if (!setupPromise) {
    setupPromise = initializeTextMate(monaco).catch((error) => {
      setupPromise = null;
      throw error;
    });
  }

  return setupPromise;
}