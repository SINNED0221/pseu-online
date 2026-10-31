type HeaderProps = {
    selectedFile: string
    generateNewFile: () => void
    deleteFile: () => void
    isRenaming: boolean
    setIsRenaming: (b: boolean) => void
    setNewFilename: (s: string) => void
    run: () => void
    stop: () => void
    isReady: boolean
    isRunning: boolean
    clearTerminal: () => void
    downloadCurrentFile: () => void
}

export default function Header(props: HeaderProps) {
    const barButton = "barbutton"
    const selectedBarButton = "selectedbarbutton"
    return (
        <header>
            <h1 className="title">Pseudocode Interpreter</h1>
            <button className={barButton} onClick={props.generateNewFile}>New file</button>
            <button className={barButton} onClick={props.deleteFile}>Delete file</button>
            {
                props.isRenaming ? 
                <button className={selectedBarButton} onClick={() => props.setIsRenaming(false)}>Done</button> :
                <button className={barButton} onClick={() => {
                    props.setIsRenaming(true)
                    props.setNewFilename(props.selectedFile)
                }}>Rename</button>
            }
            {
                props.isRunning ? 
                <button className={selectedBarButton} onClick={() => props.stop()}>Stop</button> :
                <button className={barButton} 
                onClick={() => {props.run()}} 
                disabled={!props.isReady}>Run</button>
            }
            <button className={barButton} onClick={props.clearTerminal}>Clear</button>
            <button className={barButton} onClick={props.downloadCurrentFile}>Download file</button>
        </header>
    )
}