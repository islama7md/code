export const theme = {
  bg: '#12161c',
  panel: '#1a2029',
  line: '#2a323f',
  text: '#d8dee9',
  dim: '#7b8696',
  accent: '#5ec2b7',
  warn: '#f2b84b',
  kw: '#c792ea',
  str: '#a5d6a7',
  com: '#69758a',
  num: '#f2a65a',
  tag: '#6fb7ff',
};

const JS_KW =
  'const let var function return if else for while do switch case break continue new class extends import export from default async await try catch finally throw typeof instanceof this super null undefined true false of in static get set yield void delete interface type enum implements public private protected readonly'.split(' ');
const PY_KW =
  'def class return if elif else for while in not and or is import from as try except finally raise with lambda None True False pass break continue yield global nonlocal async await self print len range'.split(' ');
const JAVA_KW =
  'public private protected class interface extends implements static final void int long double float boolean char String new return if else for while do switch case break continue try catch finally throw throws import package this super null true false abstract override var val fun namespace using string bool foreach in out'.split(' ');
const HTML_KW =
  'div span p a img ul ol li table tr td th form input button select option textarea label h1 h2 h3 h4 h5 h6 head body html title meta link script style section header footer nav main article aside video audio canvas svg class id href src alt type value name placeholder style onclick'.split(' ');
const CSS_KW =
  'color background background-color border border-radius margin padding display flex grid position absolute relative fixed width height max-width min-width font-size font-family font-weight text-align justify-content align-items gap overflow opacity transition transform box-shadow z-index cursor none auto inherit solid @media @keyframes'.split(' ');
const XAML_KW =
  'Grid StackLayout StackPanel Button Label Entry Image ContentPage ScrollView CollectionView ListView Frame Border TextBlock TextBox x:Name x:Class Binding Margin Padding HorizontalOptions VerticalOptions Text Command BackgroundColor FontSize Orientation'.split(' ');
const SQL_KW =
  'SELECT FROM WHERE INSERT INTO VALUES UPDATE SET DELETE CREATE TABLE ALTER DROP JOIN LEFT RIGHT INNER OUTER ON GROUP BY ORDER HAVING LIMIT AND OR NOT NULL AS DISTINCT COUNT SUM AVG MIN MAX LIKE IN'.split(' ');

const SNIP = {
  js: {
    log: 'console.log(|);',
    fn: 'function name(|) {\n  \n}',
    af: 'const name = (|) => {\n  \n};',
    for: 'for (let i = 0; i < |; i++) {\n  \n}',
    forof: 'for (const item of |) {\n  \n}',
    if: 'if (|) {\n  \n}',
    try: 'try {\n  |\n} catch (e) {\n  console.error(e);\n}',
    fetch: "const res = await fetch('|');\nconst data = await res.json();",
    rn: "import React from 'react';\nimport { View, Text } from 'react-native';\n\nexport default function Screen() {\n  return (\n    <View>\n      <Text>|</Text>\n    </View>\n  );\n}",
    us: 'const [value, setValue] = useState(|);',
    ue: 'useEffect(() => {\n  |\n}, []);',
  },
  py: {
    def: 'def name(|):\n    pass',
    class: 'class Name:\n    def __init__(self|):\n        pass',
    for: 'for i in range(|):\n    pass',
    if: 'if |:\n    pass',
    main: "if __name__ == '__main__':\n    |",
    try: 'try:\n    |\nexcept Exception as e:\n    print(e)',
    with: "with open('|') as f:\n    data = f.read()",
  },
  html: {
    html5: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>|</title>\n</head>\n<body>\n  \n</body>\n</html>',
    div: '<div>|</div>',
    a: '<a href="|"></a>',
    img: '<img src="|" alt="">',
    ul: '<ul>\n  <li>|</li>\n</ul>',
    btn: '<button type="button">|</button>',
    input: '<input type="text" placeholder="|">',
    script: '<script>\n  |\n</script>',
    style: '<style>\n  |\n</style>',
  },
  css: {
    flex: 'display: flex;\njustify-content: center;\nalign-items: center;',
    grid: 'display: grid;\ngrid-template-columns: repeat(|, 1fr);\ngap: 8px;',
    media: '@media (max-width: 600px) {\n  |\n}',
    center: 'margin: 0 auto;',
    shadow: 'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);',
  },
  xaml: {
    grid: '<Grid>\n  |\n</Grid>',
    stack: '<VerticalStackLayout Spacing="8">\n  |\n</VerticalStackLayout>',
    btn: '<Button Text="|" Command="{Binding }" />',
    label: '<Label Text="|" FontSize="18" />',
    entry: '<Entry Placeholder="|" Text="{Binding }" />',
  },
  java: {
    main: 'public static void main(String[] args) {\n    |\n}',
    sout: 'System.out.println(|);',
    for: 'for (int i = 0; i < |; i++) {\n    \n}',
  },
  sql: {
    sel: 'SELECT * FROM | WHERE ;',
    ins: 'INSERT INTO | (col) VALUES (val);',
  },
};

// c = comment regex, bt = backtick strings, hy = hyphen inside words, tag = html tags
const LANGS = {
  js: { kw: JS_KW, c: String.raw`\/\/.*|\/\*[\s\S]*?\*\/`, bt: true, snip: SNIP.js },
  py: { kw: PY_KW, c: String.raw`#.*`, snip: SNIP.py },
  java: { kw: JAVA_KW, c: String.raw`\/\/.*|\/\*[\s\S]*?\*\/`, snip: SNIP.java },
  html: { kw: HTML_KW, c: String.raw`<!--[\s\S]*?-->`, tag: String.raw`<\/?[A-Za-z][\w:.-]*`, hy: true, snip: SNIP.html },
  css: { kw: CSS_KW, c: String.raw`\/\*[\s\S]*?\*\/`, hy: true, snip: SNIP.css },
  xaml: { kw: XAML_KW, c: String.raw`<!--[\s\S]*?-->`, tag: String.raw`<\/?[A-Za-z][\w:.-]*`, snip: SNIP.xaml },
  sql: { kw: SQL_KW, c: String.raw`--.*`, snip: SNIP.sql },
  json: { kw: ['true', 'false', 'null'], c: String.raw`(?!)` },
  md: { kw: [], c: String.raw`(?!)` },
  txt: { kw: [], c: String.raw`(?!)` },
};

const EXT = {
  js: 'js', jsx: 'js', ts: 'js', tsx: 'js', mjs: 'js', dart: 'java', cs: 'java', kt: 'java', java: 'java',
  php: 'js', go: 'java', swift: 'java', py: 'py', html: 'html', htm: 'html', xml: 'xaml', xaml: 'xaml',
  css: 'css', scss: 'css', sql: 'sql', json: 'json', md: 'md', txt: 'txt',
};

export function getLang(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const key = EXT[ext] || 'txt';
  return { key, ...LANGS[key] };
}

export const PAIRS = { '(': ')', '[': ']', '{': '}', '"': '"', "'": "'" };

export function tokenize(text, L) {
  const str = String.raw`"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?` + (L.bt ? '|`[^`]*`?' : '');
  const word = L.hy ? String.raw`[A-Za-z_$@][\w$:-]*` : String.raw`[A-Za-z_$@][\w$:]*`;
  const re = new RegExp(
    `(${L.c})|(${str})|(\\b\\d+(?:\\.\\d+)?\\b)|(${L.tag || '(?!)'})|(${word})|([\\s\\S])`,
    'g'
  );
  const kw = new Set(L.kw || []);
  const out = [];
  const push = (s, k) => {
    const last = out[out.length - 1];
    if (last && last.k === k) last.s += s;
    else out.push({ s, k });
  };
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[0] === '') { re.lastIndex++; continue; }
    if (m[1] !== undefined) push(m[0], 'com');
    else if (m[2] !== undefined) push(m[0], 'str');
    else if (m[3] !== undefined) push(m[0], 'num');
    else if (m[4] !== undefined) push(m[0], 'tag');
    else if (m[5] !== undefined) push(m[0], kw.has(m[0]) ? 'kw' : 'def');
    else push(m[0], 'def');
  }
  return out;
}

export function parseDictionary(text, name) {
  // .json: ["word", ...] or { "trigger": "snippet|" }  —  .txt: one word per line, or "trigger=snippet"
  const items = [];
  try {
    if (name.toLowerCase().endsWith('.json')) {
      const data = JSON.parse(text);
      if (Array.isArray(data)) data.forEach((w) => typeof w === 'string' && items.push({ label: w, body: w }));
      else Object.entries(data).forEach(([k, v]) => items.push({ label: k, body: String(v), snippet: true }));
      return items;
    }
  } catch {
    return items;
  }
  text.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t) return;
    const i = t.indexOf('=');
    if (i > 0) items.push({ label: t.slice(0, i).trim(), body: t.slice(i + 1).replace(/\\n/g, '\n'), snippet: true });
    else items.push({ label: t, body: t });
  });
  return items;
}
