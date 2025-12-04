"use client";
import { useState, useCallback } from "react";

export function useLocalStorageValue(key, defaultValue = null) {
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key);
      return stored !== null ? stored : defaultValue;
    }
    return defaultValue;
  });

  const setAndStore = useCallback(
    (newValue) => {
      setValue(newValue);
      if (typeof window !== "undefined") {
        localStorage.setItem(key, newValue);
      }
    },
    [key]
  );

  return [value, setAndStore];
}
