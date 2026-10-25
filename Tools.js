import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { theme } from './lang';

const TABS = [
  ['json', 'JSON'],
  ['regex', 'Regex'],
  ['color', 'ألوان'],
  ['preview', 'معاينة HTML'],
];

export default function Tools({ current }) {
  const [tab, setTab] = useState('json');
  return (
    <View style={{ flex: 1 }}>
      <View style={st.tabs}>
        {TABS.map(([k, label]) => (
          <TouchableOpacity key={k} onPress={() => setTab(k)} style={[st.tab, tab === k && st.tabOn]}>
            <Text style={[st.tabTxt, tab === k && { color: theme.accent }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {tab === 'json' && <JsonTool initial={current?.name.endsWith('.json') ? current.content : ''} />}
      {tab === 'regex' && <RegexTool initial={current?.content || ''} />}
      {tab === 'color' && <ColorTool />}
      {tab === 'preview' && <Preview html={current?.content || ''} name={current?.name} />}
    </View>
  );
}

function JsonTool({ initial }) {
  const [src, setSrc] = useState(initial);
  const [msg, setMsg] = useState('');
  const run = (indent) => {
    try {
      setSrc(JSON.stringify(JSON.parse(src), null, indent));
      setMsg('JSON سليم ✓');
    } catch (e) {
      setMsg('خطأ: ' + e.message);
    }
  };
  return (
    <View style={st.box}>
      <TextInput multiline value={src} onChangeText={setSrc} style={st.area} autoCapitalize="none" autoCorrect={false}
        placeholder="الصق JSON هنا" placeholderTextColor={theme.dim} keyboardType="visible-password" />
      <View style={st.row}>
        <Act t="تنسيق" onPress={() => run(2)} />
        <Act t="ضغط" onPress={() => run(0)} />
        <Act t="مسح" onPress={() => { setSrc(''); setMsg(''); }} />
      </View>
      <Text style={[st.msg, msg.startsWith('خطأ') && { color: '#ff7b72' }]}>{msg}</Text>
    </View>
  );
}

function RegexTool({ initial }) {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [sample, setSample] = useState(initial);
  const result = useMemo(() => {
    if (!pattern) return { n: 0, items: [] };
    try {
      const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
      const items = [...sample.matchAll(re)].slice(0, 100);
      return { n: items.length, items };
    } catch (e) {
      return { err: e.message };
    }
  }, [pattern, flags, sample]);
  return (
    <ScrollView style={st.box} keyboardShouldPersistTaps="handled">
      <TextInput value={pattern} onChangeText={setPattern} style={st.line} autoCapitalize="none" autoCorrect={false}
        placeholder="النمط  مثال: \d+" placeholderTextColor={theme.dim} keyboardType="visible-password" />
      <TextInput value={flags} onChangeText={setFlags} style={st.line} autoCapitalize="none"
        placeholder="flags (g i m s)" placeholderTextColor={theme.dim} />
      <TextInput multiline value={sample} onChangeText={setSample} style={[st.area, { minHeight: 140 }]} autoCapitalize="none"
        autoCorrect={false} placeholder="النص للتجربة" placeholderTextColor={theme.dim} keyboardType="visible-password" />
      {result.err ? (
        <Text style={[st.msg, { color: '#ff7b72' }]}>{result.err}</Text>
      ) : (
        <>
          <Text style={st.msg}>{result.n} نتيجة</Text>
          {result.items.map((m, i) => (
            <Text key={i} style={st.match}>{m.index}: {m[0]}</Text>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function hexToRgb(h) {
  const m = h.replace('#', '').match(/^([\da-f]{3}|[\da-f]{6})$/i);
  if (!m) return null;
  let s = m[1];
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const lum = ([r, g, b]) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

function ColorTool() {
  const [fg, setFg] = useState('#ffffff');
  const [bg, setBg] = useState('#1a2029');
  const a = hexToRgb(fg), b = hexToRgb(bg);
  let ratio = null;
  if (a && b) {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    ratio = (x + 0.05) / (y + 0.05);
  }
  return (
    <View style={st.box}>
      <TextInput value={fg} onChangeText={setFg} style={st.line} autoCapitalize="none" placeholder="لون النص #ffffff" placeholderTextColor={theme.dim} />
      <TextInput value={bg} onChangeText={setBg} style={st.line} autoCapitalize="none" placeholder="لون الخلفية #000000" placeholderTextColor={theme.dim} />
      <View style={{ backgroundColor: b ? bg : '#000', padding: 24, borderRadius: 6, marginTop: 8 }}>
        <Text style={{ color: a ? fg : '#fff', fontSize: 22 }}>نموذج نص Aa 123</Text>
      </View>
      {a && <Text style={st.msg}>RGB النص: {a.join(', ')}</Text>}
      {b && <Text style={st.msg}>RGB الخلفية: {b.join(', ')}</Text>}
      {ratio && (
        <Text style={st.msg}>
          التباين {ratio.toFixed(2)}:1 — {ratio >= 7 ? 'AAA ✓' : ratio >= 4.5 ? 'AA ✓' : ratio >= 3 ? 'للنص الكبير فقط' : 'ضعيف ✗'}
        </Text>
      )}
    </View>
  );
}

function Preview({ html, name }) {
  if (!name || !/\.(html?|svg)$/i.test(name)) {
    return <Text style={[st.msg, { padding: 16 }]}>افتح ملف HTML في المحرر وبعدين ارجع هنا عشان تشوف المعاينة.</Text>;
  }
  return <WebView originWhitelist={['*']} source={{ html }} style={{ flex: 1, backgroundColor: '#fff' }} />;
}

const Act = ({ t, onPress }) => (
  <TouchableOpacity onPress={onPress} style={st.act}>
    <Text style={{ color: theme.bg, fontWeight: '600' }}>{t}</Text>
  </TouchableOpacity>
);

const st = StyleSheet.create({
  tabs: { flexDirection: 'row', backgroundColor: theme.panel, borderBottomWidth: 1, borderColor: theme.line },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabOn: { borderBottomWidth: 2, borderColor: theme.accent },
  tabTxt: { color: theme.dim },
  box: { flex: 1, padding: 12 },
  area: { flex: 1, color: theme.text, backgroundColor: theme.panel, borderRadius: 6, padding: 10, fontFamily: 'monospace', textAlignVertical: 'top', writingDirection: 'ltr', textAlign: 'left' },
  line: { color: theme.text, backgroundColor: theme.panel, borderRadius: 6, padding: 10, marginBottom: 8, fontFamily: 'monospace', writingDirection: 'ltr', textAlign: 'left' },
  row: { flexDirection: 'row', gap: 8, marginTop: 10 },
  act: { backgroundColor: theme.accent, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 6 },
  msg: { color: theme.dim, marginTop: 10 },
  match: { color: theme.str, fontFamily: 'monospace', marginTop: 4 },
});
