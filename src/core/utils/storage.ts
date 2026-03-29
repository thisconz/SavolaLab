/**
 * A safe storage wrapper for Zustand persistence that falls back to in-memory
 * if localStorage is unavailable (e.g., in an insecure iframe context).
 */
export const createSafeStorage = (): Storage => {
  const inMemoryStorage = new Map<string, string>();

  const getLS = () => {
    try {
      return typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      return null;
    }
  };

  return {
    getItem: (name: string): string | null => {
      try {
        const ls = getLS();
        return (
          (ls ? ls.getItem(name) : null) || inMemoryStorage.get(name) || null
        );
      } catch (e) {
        return inMemoryStorage.get(name) || null;
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        const ls = getLS();
        if (ls) {
          ls.setItem(name, value);
        } else {
          inMemoryStorage.set(name, value);
        }
      } catch (e) {
        inMemoryStorage.set(name, value);
      }
    },
    removeItem: (name: string): void => {
      try {
        const ls = getLS();
        if (ls) {
          ls.removeItem(name);
        } else {
          inMemoryStorage.delete(name);
        }
      } catch (e) {
        inMemoryStorage.delete(name);
      }
    },
    clear: (): void => {
      try {
        const ls = getLS();
        if (ls) {
          ls.clear();
        } else {
          inMemoryStorage.clear();
        }
      } catch (e) {
        inMemoryStorage.clear();
      }
    },
    key: (index: number): string | null => {
      try {
        const ls = getLS();
        if (ls) {
          return ls.key(index);
        }
        return Array.from(inMemoryStorage.keys())[index] || null;
      } catch (e) {
        return Array.from(inMemoryStorage.keys())[index] || null;
      }
    },
    get length(): number {
      try {
        const ls = getLS();
        return ls ? ls.length : inMemoryStorage.size;
      } catch (e) {
        return inMemoryStorage.size;
      }
    },
  };
};

export const safeLocalStorage = createSafeStorage();
