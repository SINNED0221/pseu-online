"use client";


type FileItemProps = {
    file: string
    selectedFile: string;
    setSelectedFile: (file: string) => void
    isRenaming: boolean
    setIsRenaming: (b: boolean) => void
    newFileName: string
    setNewFileName: (s: string) => void
    renameFile: (s: string) => boolean
}

export default function FileItem(props: FileItemProps) {
    return <div 
          key={props.file}
          onClick={() => props.setSelectedFile(props.file)}
          >
          {props.file === props.selectedFile ? 
          (props.isRenaming ?
            (<div>
              <input 
                value={props.newFileName}
                onFocus={() => {
                  setError("")
                }}
                onChange={(event) => {
                  props.setNewFileName(event.target.value)
                  setError("")
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    if (props.renameFile(props.newFileName)){
                      props.setIsRenaming(false)
                    } else {
                      setError("props.file already exists!")
                    }
                  } else if (event.key === "Escape") {
                    props.setIsRenaming(false)
                  }
                }}
              />
              {error && <p>{error}</p>}
            </div>) :
            (<b>{props.file}</b>)) : 
          props.file}</div>
}