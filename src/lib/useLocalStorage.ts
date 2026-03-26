import { useCallback, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : initialValue;
  });

  const setValue = useCallback(
    (value: T) => {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    },
    [key],
  );

  return [storedValue, setValue];
}
