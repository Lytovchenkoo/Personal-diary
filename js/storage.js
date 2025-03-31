// Storage Manager
export class StorageManager {
  constructor() {
    this.storage = localStorage;
  }

  getData(key) {
    try {
      const serializedData = this.storage.getItem(key);
      if (serializedData === null) {
        return undefined;
      }
      return JSON.parse(serializedData);
    } catch (error) {
      console.error(`Error getting data for key "${key}":`, error);
      return undefined;
    }
  }

  saveData(key, data) {
    try {
      const serializedData = JSON.stringify(data);
      this.storage.setItem(key, serializedData);
    } catch (error) {
      console.error(`Error saving data for key "${key}":`, error);
    }
  }

  removeData(key) {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data for key "${key}":`, error);
    }
  }
}
