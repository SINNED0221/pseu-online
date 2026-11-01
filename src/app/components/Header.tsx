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
        <header className="app-header">
            <div className="brand">
                <span className="brand-mark" aria-hidden="true">&lt;/&gt;</span>
                <div className="brand-copy">
                    <h1>Pseudocode Studio</h1>
                    <p>Write, run, and explore</p>
                </div>
            </div>

            <nav className="header-actions" aria-label="Editor actions">
                <button className={barButton} onClick={props.generateNewFile}>
                    <span className="button-icon" aria-hidden="true">＋</span>
                    New file
                </button>
                <button className={barButton} onClick={props.deleteFile} disabled={!props.selectedFile}>
                    <span className="button-icon" aria-hidden="true">−</span>
                    Delete
                </button>
                {
                    props.isRenaming ?
                    <button className={barButton} onClick={() => props.setIsRenaming(false)}>
                        <span className="button-icon" aria-hidden="true">✓</span>
                        Done
                    </button> :
                    <button className={barButton} onClick={() => {
                        props.setIsRenaming(true)
                        props.setNewFilename(props.selectedFile)
                    }} disabled={!props.selectedFile}>
                        <span className="button-icon" aria-hidden="true">✎</span>
                        Rename
                    </button>
                }
                <span className="action-divider" aria-hidden="true" />
                {
                    props.isRunning ?
                    <button className={selectedBarButton} onClick={props.stop}>
                        <span className="button-icon" aria-hidden="true">■</span>
                        Stop
                    </button> :
                    <button className={`${barButton} run-button`} onClick={props.run} disabled={!props.isReady || !props.selectedFile}>
                        <span className="button-icon" aria-hidden="true">▶</span>
                        Run program
                    </button>
                }
                <button className={barButton} onClick={props.clearTerminal}>
                    <span className="button-icon" aria-hidden="true">⌫</span>
                    Clear
                </button>
                <button className={barButton} onClick={props.downloadCurrentFile} disabled={!props.selectedFile}>
                    <span className="button-icon" aria-hidden="true">↓</span>
                    Download
                </button>
                <div className="runtime-status" role="status" aria-live="polite">
                    <span className={`status-dot${props.isRunning ? " running" : props.isReady ? " ready" : ""}`} />
                    {props.isRunning ? "Running" : props.isReady ? "Runtime ready" : "Starting runtime"}
                </div>
            </nav>
        </header>
    )
}