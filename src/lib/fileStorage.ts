
export type ProjectFile = {
  id: string;
  projectId: string;
  name: string;
  code: string;
  updatedAt: number;
};

const DB_NAME = "PseuIDE";
const DB_VERSION = 1;
const STORE_NAME = "files";
const DEFAULT_PROJECT_ID = "default";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(
      new Error("Indexed DB is not supported")
    );
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
        });

        store.createIndex("projectId", "projectId", {
          unique: false,
        });
      }
    };

    request.onsuccess = () => {
      const db = request.result;

      db.onclose = () => {
        dbPromise = null;
      };

      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };

      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error("Failed to open DB"));
    };

    request.onblocked = () => {
      console.warn("DB is blocked");
    };
  });

  return dbPromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to request DB"));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () =>
      reject(tx.error ?? new Error("DB transaction aborted"));
    tx.onerror = () =>
      reject(tx.error ?? new Error("DB transaction failed"));
  });
}

export async function getAllFiles(
  projectId = DEFAULT_PROJECT_ID
): Promise<ProjectFile[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const done = transactionDone(tx);

  const request = tx
    .objectStore(STORE_NAME)
    .index("projectId")
    .getAll(projectId);

  const files = await requestResult<ProjectFile[]>(request);
  await done;

  return files.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFile(
  id: string
): Promise<ProjectFile | undefined> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const done = transactionDone(tx);

  const request = tx.objectStore(STORE_NAME).get(id);
  const file = await requestResult<ProjectFile | undefined>(request);

  await done;
  return file;
}

export async function createFile(
  name: string,
  projectId = DEFAULT_PROJECT_ID,
  initialCode = ""
): Promise<ProjectFile> {
  const cleanName = name.trim();

  if (!cleanName) {
    throw new Error("File name cannot be empty");
  }

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);
  const store = tx.objectStore(STORE_NAME);

  const request = store.index("projectId").getAll(projectId);

  const file: ProjectFile = {
    id: crypto.randomUUID(),
    projectId,
    name: cleanName,
    code: initialCode,
    updatedAt: Date.now(),
  };

  let duplicate = false;

  request.onsuccess = () => {
    const existingFiles = request.result as ProjectFile[];

    if (existingFiles.some((item) => item.name === cleanName)) {
      duplicate = true;
      tx.abort();
      return;
    }

    // 必须在 onsuccess 回调中同步执行 add
    store.add(file);
  };

  try {
    await done;
  } catch (error) {
    if (duplicate) {
      throw new Error("File name already exists");
    }

    throw error;
  }

  return file;
}

export async function saveFile(
  file: ProjectFile
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);

  tx.objectStore(STORE_NAME).put({
    ...file,
    updatedAt: Date.now(),
  });

  await done;
}

export async function deleteFile(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const done = transactionDone(tx);

  tx.objectStore(STORE_NAME).delete(id);
  await done;
}

export async function renameFile(
  id: string,
  newName: string
): Promise<void> {
  const cleanName = newName.trim();

  if (!cleanName) {
    throw new Error("File name cannot be empty");
  }

  const file = await getFile(id);

  if (!file) {
    throw new Error("File does not exist");
  }

  const existingFiles = await getAllFiles(file.projectId);

  if (
    existingFiles.some(
      (item) => item.id !== id && item.name === cleanName
    )
  ) {
    throw new Error("File name already exists");
  }

  await saveFile({
    ...file,
    name: cleanName,
    updatedAt: Date.now(),
  });
}
