
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
      <h1>{props.title}</h1>

      {props.files.map((file) => (
        <FileItem
          key={file.id}
          file={file}
          props={props}
        />
      ))}
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
    <div
      onClick={() => {
        props.setCurrentFile(file);
        props.setIsRenaming(false);
      }}
      className={isCurrent ? "selected-file" : ""}
    >
      {isCurrent && props.isRenaming ? (
        <RenameField props={props} />
      ) : (
        isCurrent ? <b>{file.name}</b> : file.name
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
    <div>
      <input
        autoFocus
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
