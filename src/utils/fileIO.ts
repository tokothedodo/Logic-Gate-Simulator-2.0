import { save, open, message, confirm } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile, writeFile } from '@tauri-apps/plugin-fs';

export type SaveFormat = 'json' | 'gcg' | 'circ' | 'png';

const isTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const FILE_FILTERS: Record<SaveFormat, { name: string; extensions: string[] }[]> = {
  json: [{ name: 'Native Circuit', extensions: ['json'] }],
  gcg: [{ name: 'Gate Simulator', extensions: ['gcg'] }],
  circ: [{ name: 'Logisim Circuit', extensions: ['circ'] }],
  png: [{ name: 'PNG Image', extensions: ['png'] }],
};

const defaultFileName = (format: SaveFormat) => `circuit.${format}`;

/**
 * Tauri v2's webview has no download handler, so the browser Blob + <a download>
 * trick silently does nothing. Use the native save dialog + fs plugin instead.
 */
export const saveTextFile = async (
  contents: string,
  format: SaveFormat
): Promise<string | null> => {
  if (!isTauri()) return null;

  const path = await save({
    title: 'Save Circuit',
    defaultPath: defaultFileName(format),
    filters: FILE_FILTERS[format],
  });

  if (!path) return null;

  if (format === 'png') {
    const base64 = contents.includes(',') ? contents.split(',')[1] : contents;
    await writeFile(path, Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
  } else {
    await writeTextFile(path, contents);
  }

  return path;
};

/** Opens a native file picker and returns the file's text contents. */
export const openTextFile = async (): Promise<{ path: string; content: string } | null> => {
  if (!isTauri()) return null;

  const selected = await open({
    title: 'Open Circuit',
    multiple: false,
    directory: false,
    filters: [
      { name: 'All Circuits', extensions: ['json', 'gcg', 'circ'] },
      { name: 'Native Circuit', extensions: ['json'] },
      { name: 'Gate Simulator', extensions: ['gcg'] },
      { name: 'Logisim Circuit', extensions: ['circ'] },
    ],
  });

  if (!selected || typeof selected !== 'string') return null;

  const content = await readTextFile(selected);
  return { path: selected, content };
};

export const showError = async (title: string, body: string) => {
  if (isTauri()) {
    await message(body, { title, kind: 'error' });
  } else {
    alert(`${title}: ${body}`);
  }
};

export const showConfirm = async (title: string, body: string): Promise<boolean> => {
  if (isTauri()) {
    return await confirm(body, { title, kind: 'warning' });
  }
  return window.confirm(`${title}: ${body}`);
};