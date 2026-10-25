import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Editor from './src/Editor';
import Files from './src/Files';
import Tools from './src/Tools';
import { theme } from './src/lang';
import { readFile, writeFile, getJSON, setJSON } from './src/store';

export default function App() {
  const [screen, setScreen] = useState('files');
  const [tabs, setTabs] = useState([]); // [{name, content}]
  const [active, setActive] = useState(null);
  const [fontSize, setFontSize] = useState(15);
  const [dicts, setDicts] = useState({});
  const [ready, setReady] = useState(false);
  const saveTimers = useRef({});

  // restore session
  useEffect(() => {
    (async () => {
      const s = await getJSON('settings', {});
      if (s.fontSize) setFontSize(s.fontSize);
      setDicts(await getJSON('dicts', {}));
      const names = await getJSON('openTabs', []);
      const loaded = [];
      for (const n of names) {
        try { loaded.push({ name: n, content: await readFile(n) }); } catch {}
      }
      setTabs(loaded);
      const last = await getJSON('active', null);
      setActive(loaded.find((t) => t.name === last) ? last : loaded[0]?.name ?? null);
      if (loaded.length) setScreen('editor');
      setReady(true);
    })();
  }, []);

  useEffect(() => { if (ready) setJSON('settings', { fontSize }); }, [fontSize, ready]);
  useEffect(() => { if (ready) setJSON('dicts', dicts); }, [dicts, ready]);
  useEffect(() => { if (ready) { setJSON('openTabs', tabs.map((t) => t.name)); setJSON('active', active); } }, [tabs.length, active, ready]);

  const openFile = useCallback(async (name) => {
    setTabs((cur) => cur);
    const exists = tabs.find((t) => t.name === name);
    if (!exists) {
      const content = await readFile(name).catch(() => '');
      setTabs((cur) => [...cur, { name, content }]);
    }
    setActive(name);
    setScreen('editor');
  }, [tabs]);

  const closeTab = (name) => {
    const idx = tabs.findIndex((t) => t.name === name);
    const next = tabs.filter((t) => t.name !== name);
    setTabs(next);
    if (active === name) setActive(next[Math.max(0, idx - 1)]?.name ?? null);
    if (!next.length) setScreen('files');
  };

  const changeContent = (name, content) => {
    setTabs((cur) => cur.map((t) => (t.name === name ? { ...t, content } : t)));
    clearTimeout(saveTimers.current[name]);
    saveTimers.current[name] = setTimeout(() => writeFile(name, content), 600); // autosave
  };

  const current = tabs.find((t) => t.name === active);
  const dictItems = useMemo(
    () => Object.values(dicts).filter((d) => d.on).flatMap((d) => d.items),
    [dicts]
  );

  return (
    <SafeAreaView style={st.root}>
      <StatusBar style="light" />
      {screen === 'editor' && (
        <ScrollView horizontal style={st.tabs} showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always">
          {tabs.map((t) => (
            <TouchableOpacity key={t.name} style={[st.tab, t.name === active && st.tabOn]} onPress={() => setActive(t.name)}>
              <Text style={[st.tabTxt, t.name === active && { color: theme.text }]}>{t.name}</Text>
              <TouchableOpacity onPress={() => closeTab(t.name)} hitSlop={8}>
                <Text style={{ color: theme.dim, marginLeft: 8 }}>✕</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {screen === 'editor' && current && (
          <Editor
            file={current}
            onChange={(c) => changeContent(current.name, c)}
            fontSize={fontSize}
            setFontSize={setFontSize}
            dict={dictItems}
          />
        )}
        {screen === 'editor' && !current && <Text style={st.empty}>مفيش ملف مفتوح. روح لـ «الملفات».</Text>}
        {screen === 'files' && <Files onOpen={openFile} dicts={dicts} setDicts={setDicts} openNames={tabs.map((t) => t.name)} />}
        {screen === 'tools' && <Tools current={current} />}
      </KeyboardAvoidingView>

      <View style={st.nav}>
        {[['files', 'الملفات'], ['editor', 'المحرر'], ['tools', 'الأدوات']].map(([k, label]) => (
          <TouchableOpacity key={k} style={st.navBtn} onPress={() => setScreen(k)}>
            <Text style={[st.navTxt, screen === k && { color: theme.accent }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, paddingTop: Platform.OS === 'android' ? 28 : 0 },
  tabs: { maxHeight: 42, backgroundColor: theme.panel, flexGrow: 0 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderRightWidth: 1, borderColor: theme.line },
  tabOn: { backgroundColor: theme.bg, borderTopWidth: 2, borderTopColor: theme.accent },
  tabTxt: { color: theme.dim, fontFamily: 'monospace' },
  empty: { color: theme.dim, padding: 20 },
  nav: { flexDirection: 'row', backgroundColor: theme.panel, borderTopWidth: 1, borderColor: theme.line },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  navTxt: { color: theme.dim, fontSize: 15 },
});
