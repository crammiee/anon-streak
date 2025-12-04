export function getLocalStorageValue(key, defaultValue = null) {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored : defaultValue;
  }
  return defaultValue;
}

export function setLocalStorageValue(key, value) {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, value);
  }
}
