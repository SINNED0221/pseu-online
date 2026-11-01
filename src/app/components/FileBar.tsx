
"use client";

import {type Dispatch, type SetStateAction, type JSX, useState} from "react";

import { type ProjectFile } from "@/lib/fileStorage";

type FileProps = {
  title: string;
  files: ProjectFile[];

  currentFile: ProjectFile | null;
  setCurrentFile: Dispatch<SetStateAction<ProjectFile | null>>;

  isRenaming: boolean;
  setIsRenaming: (b: boolean) => void;

  newFileName: string;
  setNewFileName: (s: string) => void;

  renameFile: (s: string) => boolean;
};

export default function FileBar(props: FileProps) {
  return (
    <aside className="filebar">
      <div className="filebar-heading">
        <h2>{props.title}</h2>
        <span className="file-count">{props.files.length}</span>
      </div>

      <nav className="file-list" aria-label="Project files">
        {props.files.map((file) => (
          <FileItem
            key={file.id}
            file={file}
            props={props}
          />
        ))}
      </nav>
    </aside>
  );
}

type FileItemProps = {
  file: ProjectFile;
  props: FileProps;
};

function FileItem({
  file,
  props,
}: FileItemProps): JSX.Element {
  const isCurrent = file.id === props.currentFile?.id;

  return (
    <div>
      {isCurrent && props.isRenaming ? (
        <RenameField props={props} />
      ) : (
        <button
          type="button"
          onClick={() => {
            props.setCurrentFile(file);
            props.setIsRenaming(false);
          }}
          className={`file-item${isCurrent ? " selected-file" : ""}`}
          aria-current={isCurrent ? "page" : undefined}
        >
          <span className="file-icon" aria-hidden="true">P</span>
          <span className="file-name">{file.name}</span>
        </button>
      )}
    </div>
  );
}

function RenameField({
  props,
}: {
  props: FileProps;
}): JSX.Element {
  const [error, setError] = useState("");

  return (
    <div className="rename-field">
      <input
        autoFocus
        aria-label="Rename file"
        value={props.newFileName}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          props.setNewFileName(event.target.value);
          setError("");
        }}
        onKeyDown={(event) => {
          event.stopPropagation();

          if (event.key === "Enter") {
            if (props.renameFile(props.newFileName)) {
              props.setIsRenaming(false);
              setError("");
            } else {
              setError("Invalid or duplicate filename!");
            }
          }

          if (event.key === "Escape") {
            props.setIsRenaming(false);
            setError("");
          }
        }}
      />

      {error && <p>{error}</p>}
    </div>
  );
}
