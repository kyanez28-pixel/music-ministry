import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      console.warn(`useLocalStorage: error leyendo '${key}'`);
      return initialValue;
    }
  });

  // Persistir cuando el valor cambia
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (err) {
      console.warn(`useLocalStorage: error escribiendo '${key}'`, err);
    }
  }, [key, storedValue]);

  // Sincronizar entre pestañas con el evento 'storage'
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return;
      try {
        setStoredValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignorar valores inválidos
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      return newValue;
    });
  }, []);

  return [storedValue, setValue] as const;
}
