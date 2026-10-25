import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { theme, parseDictionary } from './lang';
import { listFiles, writeFile, deleteFile, readUri } from './store';

export default function Files({ onOpen, dicts, setDicts, openNames }) {
  const [files, setFiles] = useState([]);
  const [name, setName] = useState('');

  const refresh = useCallback(async () => setFiles(await listFiles()), []);
  useEffect(() => { refresh(); }, [refresh]);

  const create = async () => {
    const n = name.trim();
    if (!n) return;
    if (!files.includes(n)) await writeFile(n, '');
    setName('');
    await refresh();
    onOpen(n);
  };

  const importFiles = async () => {
    const r = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
    if (r.canceled) return;
    for (const a of r.assets) {
      try { await writeFile(a.name, await readUri(a.uri)); } catch { Alert.alert('تعذر فتح الملف', a.name); }
    }
    refresh();
  };

  const importDict = async () => {
    const r = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true, type: '*/*' });
    if (r.canceled) return;
    const next = { ...dicts };
    for (const a of r.assets) {
      try {
        const items = parseDictionary(await readUri(a.uri), a.name);
        if (items.length) next[a.name] = { on: true, items };
        else Alert.alert('الملف فاضي أو شكله غلط', a.name);
      } catch { Alert.alert('تعذر قراءة الملف', a.name); }
    }
    setDicts(next);
  };

  const remove = (n) =>
    Alert.alert('حذف الملف', n, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await deleteFile(n); refresh(); } },
    ]);

  return (
    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 12 }}>
      <Text style={st.h}>ملفاتي</Text>
      <View style={st.row}>
        <TextInput value={name} onChangeText={setName} placeholder="اسم ملف جديد  مثال: app.js" placeholderTextColor={theme.dim}
          style={st.input} autoCapitalize="none" autoCorrect={false} onSubmitEditing={create} />
        <TouchableOpacity style={st.btn} onPress={create}><Text style={st.btnTxt}>إنشاء</Text></TouchableOpacity>
      </View>
      <TouchableOpacity style={st.ghost} onPress={importFiles}><Text style={st.ghostTxt}>استيراد ملفات من الهاتف</Text></TouchableOpacity>

      {files.length === 0 && <Text style={st.empty}>مفيش ملفات لسه. أنشئ ملف أو استورد من الهاتف.</Text>}
      {files.map((f) => (
        <TouchableOpacity key={f} style={st.file} onPress={() => onOpen(f)} onLongPress={() => remove(f)}>
          <Text style={[st.fileTxt, openNames.includes(f) && { color: theme.accent }]}>{f}</Text>
          <TouchableOpacity onPress={() => remove(f)}><Text style={{ color: theme.dim, padding: 6 }}>حذف</Text></TouchableOpacity>
        </TouchableOpacity>
      ))}

      <Text style={[st.h, { marginTop: 28 }]}>ملفات الأوتو كومبليت</Text>
      <Text style={st.hint}>
        ضيف ملف .txt (كلمة في كل سطر، أو trigger=كود للـ snippets، واستخدم | لمكان المؤشر و \n لسطر جديد) أو ملف .json (قائمة كلمات أو object من trigger إلى كود).
      </Text>
      <TouchableOpacity style={st.ghost} onPress={importDict}><Text style={st.ghostTxt}>إضافة ملف أوتو كومبليت</Text></TouchableOpacity>
      {Object.keys(dicts).map((n) => (
        <View key={n} style={st.file}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setDicts({ ...dicts, [n]: { ...dicts[n], on: !dicts[n].on } })}>
            <Text style={[st.fileTxt, !dicts[n].on && { color: theme.dim }]}>
              {dicts[n].on ? '● ' : '○ '}{n} ({dicts[n].items.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { const c = { ...dicts }; delete c[n]; setDicts(c); }}>
            <Text style={{ color: theme.dim, padding: 6 }}>إزالة</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const st = StyleSheet.create({
  h: { color: theme.text, fontSize: 18, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, backgroundColor: theme.panel, color: theme.text, borderRadius: 6, paddingHorizontal: 10, writingDirection: 'ltr', textAlign: 'left' },
  btn: { backgroundColor: theme.accent, paddingHorizontal: 18, justifyContent: 'center', borderRadius: 6 },
  btnTxt: { color: theme.bg, fontWeight: '600' },
  ghost: { borderWidth: 1, borderColor: theme.line, borderRadius: 6, padding: 12, marginTop: 10, alignItems: 'center' },
  ghostTxt: { color: theme.accent },
  empty: { color: theme.dim, marginTop: 16 },
  hint: { color: theme.dim, lineHeight: 20, marginBottom: 4 },
  file: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: theme.line, marginTop: 4 },
  fileTxt: { color: theme.text, fontFamily: 'monospace', fontSize: 15 },
});
