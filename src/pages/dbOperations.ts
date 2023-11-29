export const openDB = (
  dbName: string,
  version: number,
  upgradeCallback: (db: IDBDatabase) => void
): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, version);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => upgradeCallback(request.result);
  });
};

export const getFromDB = (
  db: IDBDatabase,
  storeName: string,
  key: string
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName);
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const saveToDB = (
  db: IDBDatabase,
  storeName: string,
  key: string,
  value: any
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const saveImageToDB = async (
  db: IDBDatabase,
  storeName: string,
  key: string,
  imageFile: File | null
): Promise<void> => {
  if (!imageFile) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const image = e.target?.result;
    if (image) {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(image, key);
      request.onerror = () => console.error(request.error);
      request.onsuccess = () => console.log("Image saved successfully");
    }
  };
  reader.readAsDataURL(imageFile);
};

export const clearDB = async () => {
  const dbName = "twitterArchiveViewer";
  const storeName = "tweets";

  const db = await openDB(dbName, 1, (db) => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName);
    }
  });

  const transaction = db.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  store.clear();
  db.close();
};
