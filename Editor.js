import React, { useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { theme, getLang, tokenize, PAIRS } from './lang';

const KEYS = ['TAB', '{', '}', '(', ')', '[', ']', ';', ':', '"', "'", '<', '>', '/', '=', '+', '-', '_', '!', '&', '|', '\\', '#', '$', '*', '%', '`', '.', ','];
const COLORS = { kw: theme.kw, str: theme.str, com: theme.com, num: theme.num, tag: theme.tag, def: theme.text };
const MAX_HIGHLIGHT = 30000;

export default function Editor({ file, onChange, fontSize, setFontSize, dict }) {
  const text = file.content;
  const L = useMemo(() => getLang(file.name), [file.name]);
  const [sel, setSel] = useState({ start: 0, end: 0 });
  const hist = useRef({ stack: [text], i: 0 });
  const pinch = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    hist.current = { stack: [text], i: 0 };
    setSel({ start: 0, end: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file.name]);

  const record = (t) => {
    const h = hist.current;
    if (h.stack[h.i] === t) return;
    h.stack = h.stack.slice(0, h.i + 1).concat(t).slice(-100);
    h.i = h.stack.length - 1;
  };
  const apply = (t, pos) => {
    record(t);
    onChange(t);
    if (pos !== undefined) setSel({ start: pos, end: pos });
  };
  const undo = () => {
    const h = hist.current;
    if (h.i > 0) { h.i--; onChange(h.stack[h.i]); }
  };
  const redo = () => {
    const h = hist.current;
    if (h.i < h.stack.length - 1) { h.i++; onChange(h.stack[h.i]); }
  };

  // ----- typing helpers: auto-close brackets + auto-indent
  const handleChange = (t) => {
    if (t.length === text.length + 1) {
      let i = 0;
      while (i < text.length && text[i] === t[i]) i++;
      const ch = t[i];
      if (PAIRS[ch]) {
        const next = t[i + 1];
        const isQuote = ch === '"' || ch === "'";
        const wordBefore = /\w/.test(t[i - 1] || '');
        if ((!next || /[\s)\]}>,;]/.test(next)) && !(isQuote && wordBefore)) {
          return apply(t.slice(0, i + 1) + PAIRS[ch] + t.slice(i + 1), i + 1);
        }
      } else if (ch === '\n') {
        const lineStart = t.lastIndexOf('\n', i - 1) + 1;
        const prevLine = t.slice(lineStart, i);
        const indent = (prevLine.match(/^\s*/) || [''])[0];
        const opens = /[{(\[:]\s*$/.test(prevLine);
        const extra = opens ? '  ' : '';
        const ins = indent + extra;
        const nextCh = t[i + 1];
        if (opens && (nextCh === '}' || nextCh === ')' || nextCh === ']')) {
          const nt = t.slice(0, i + 1) + ins + '\n' + indent + t.slice(i + 1);
          return apply(nt, i + 1 + ins.length);
        }
        if (ins) return apply(t.slice(0, i + 1) + ins + t.slice(i + 1), i + 1 + ins.length);
      }
    }
    apply(t);
  };

  const insert = (s) => {
    const { start, end } = sel;
    const t = text.slice(0, start) + s + text.slice(end);
    apply(t, start + s.length);
  };

  // ----- autocomplete
  const prefix = (text.slice(0, sel.start).match(/[A-Za-z_$@][\w$-]*$/) || [''])[0];
  const suggestions = useMemo(() => {
    if (prefix.length < 1) return [];
    const p = prefix.toLowerCase();
    const seen = new Set();
    const out = [];
    const add = (label, body, kind) => {
      if (label === prefix || seen.has(label + kind)) return;
      if (label.toLowerCase().startsWith(p)) { seen.add(label + kind); out.push({ label, body, kind }); }
    };
    Object.entries(L.snip || {}).forEach(([k, v]) => add(k, v, 'snip'));
    dict.forEach((d) => add(d.label, d.body, d.snippet ? 'snip' : 'dict'));
    (L.kw || []).forEach((k) => add(k, k, 'kw'));
    if (text.length < 60000) {
      const words = new Set(text.match(/[A-Za-z_$][\w$]{2,}/g) || []);
      words.forEach((w) => add(w, w, 'word'));
    }
    return out.slice(0, 14);
  }, [prefix, L, dict, text.length < 60000 ? text : '']);

  const pick = (s) => {
    const start = sel.start - prefix.length;
    const cursor = s.body.indexOf('|');
    const body = cursor >= 0 ? s.body.replace('|', '') : s.body;
    const t = text.slice(0, start) + body + text.slice(sel.start);
    apply(t, start + (cursor >= 0 ? cursor : body.length));
  };

  // ----- pinch to zoom
  const dist = (ts) => Math.hypot(ts[0].pageX - ts[1].pageX, ts[0].pageY - ts[1].pageY);
  const onTS = (e) => {
    const ts = e.nativeEvent.touches;
    if (ts.length === 2) pinch.current = { d: dist(ts), size: fontSize };
  };
  const onTM = (e) => {
    const ts = e.nativeEvent.touches;
    if (ts.length === 2 && pinch.current) {
      const s = Math.round(pinch.current.size * (dist(ts) / pinch.current.d));
      setFontSize(Math.max(8, Math.min(40, s)));
    }
  };
  const onTE = (e) => { if (e.nativeEvent.touches.length < 2) pinch.current = null; };

  const before = text.slice(0, sel.start).split('\n');
  const textStyle = { fontSize, lineHeight: Math.round(fontSize * 1.45), fontFamily: 'monospace', color: theme.text };
  const tokens = text.length <= MAX_HIGHLIGHT ? tokenize(text, L) : null;

  return (
    <View style={{ flex: 1 }}>
      <View style={st.tools}>
        <Btn t="↶" onPress={undo} />
        <Btn t="↷" onPress={redo} />
        <View style={{ flex: 1 }} />
        <Btn t="A−" onPress={() => setFontSize(Math.max(8, fontSize - 1))} />
        <Text style={st.size}>{fontSize}</Text>
        <Btn t="A+" onPress={() => setFontSize(Math.min(40, fontSize + 1))} />
      </View>

      <View
        style={{ flex: 1 }}
        onTouchStartCapture={onTS}
        onTouchMoveCapture={onTM}
        onTouchEndCapture={onTE}
      >
        <ScrollView keyboardShouldPersistTaps="always" contentContainerStyle={{ flexGrow: 1 }}>
          <TextInput
            ref={inputRef}
            multiline
            scrollEnabled={false}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="off"
            keyboardType="visible-password"
            textAlignVertical="top"
            selection={sel}
            onSelectionChange={(e) => setSel(e.nativeEvent.selection)}
            onChangeText={handleChange}
            style={[st.input, textStyle]}
            selectionColor={theme.accent}
            cursorColor={theme.accent}
          >
            {tokens
              ? tokens.map((tk, i) => (
                  <Text key={i} style={{ color: COLORS[tk.k] }}>{tk.s}</Text>
                ))
              : text}
          </TextInput>
        </ScrollView>
      </View>

      {suggestions.length > 0 && (
        <ScrollView horizontal keyboardShouldPersistTaps="always" style={st.sugg} showsHorizontalScrollIndicator={false}>
          {suggestions.map((s) => (
            <TouchableOpacity key={s.kind + s.label} style={st.chip} onPress={() => pick(s)}>
              <Text style={[st.chipTxt, s.kind === 'snip' && { color: theme.warn }, s.kind === 'dict' && { color: theme.accent }]}>
                {s.kind === 'snip' ? '⌁ ' : ''}{s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView horizontal keyboardShouldPersistTaps="always" style={st.keys} showsHorizontalScrollIndicator={false}>
        {KEYS.map((k) => (
          <TouchableOpacity key={k} style={st.key} onPress={() => insert(k === 'TAB' ? '  ' : k)}>
            <Text style={st.keyTxt}>{k === 'TAB' ? 'Tab' : k}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={st.status}>
        <Text style={st.statusTxt}>{file.name}</Text>
        <Text style={st.statusTxt}>سطر {before.length}، عمود {before[before.length - 1].length + 1} · {text.length} حرف</Text>
      </View>
    </View>
  );
}

const Btn = ({ t, onPress }) => (
  <TouchableOpacity style={st.tbtn} onPress={onPress}>
    <Text style={st.tbtnTxt}>{t}</Text>
  </TouchableOpacity>
);

const st = StyleSheet.create({
  tools: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.panel, paddingHorizontal: 6, borderBottomWidth: 1, borderColor: theme.line },
  tbtn: { paddingHorizontal: 14, paddingVertical: 8 },
  tbtnTxt: { color: theme.text, fontSize: 17 },
  size: { color: theme.dim, minWidth: 24, textAlign: 'center' },
  input: { padding: 12, minHeight: 400, writingDirection: 'ltr', textAlign: 'left' },
  sugg: { maxHeight: 44, backgroundColor: theme.panel, borderTopWidth: 1, borderColor: theme.line },
  chip: { paddingHorizontal: 12, justifyContent: 'center', borderRightWidth: 1, borderColor: theme.line },
  chipTxt: { color: theme.text, fontFamily: 'monospace', fontSize: 15 },
  keys: { maxHeight: 44, backgroundColor: theme.bg, borderTopWidth: 1, borderColor: theme.line },
  key: { minWidth: 38, paddingHorizontal: 10, justifyContent: 'center', alignItems: 'center' },
  keyTxt: { color: theme.accent, fontSize: 18, fontFamily: 'monospace' },
  status: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 4, backgroundColor: theme.panel },
  statusTxt: { color: theme.dim, fontSize: 11 },
});
