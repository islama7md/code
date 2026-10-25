import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FS from 'expo-file-system';

const DIR = FS.documentDirectory + 'files/';

async function ensureDir() {
  const i = await FS.getInfoAsync(DIR);
  if (!i.exists) await FS.makeDirectoryAsync(DIR, { intermediates: true });
}
export async function listFiles() {
  await ensureDir();
  return (await FS.readDirectoryAsync(DIR)).sort();
}
export async function readFile(name) {
  return FS.readAsStringAsync(DIR + name);
}
export async function writeFile(name, content) {
  await ensureDir();
  return FS.writeAsStringAsync(DIR + name, content);
}
export const deleteFile = (name) => FS.deleteAsync(DIR + name, { idempotent: true });
export const readUri = (uri) => FS.readAsStringAsync(uri);

export async function getJSON(key, fallback) {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
export const setJSON = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));
