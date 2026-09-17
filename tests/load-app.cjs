const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const ROOT = path.resolve(__dirname, '..');

// Load real application modules while replacing only platform and network boundaries.
function loadApp(file, mocks = {}) {
  const cache = new Map();
  function load(filename) {
    const candidates = [filename, filename + '.ts', filename + '.tsx', filename + '.js', path.join(filename, 'index.tsx')];
    const resolved = candidates.find((item) => fs.existsSync(item) && fs.statSync(item).isFile());
    if (!resolved) throw new Error('Cannot resolve app module: ' + filename);
    if (cache.has(resolved)) return cache.get(resolved).exports;
    const module = { exports: {} };
    cache.set(resolved, module);
    const result = babel.transformSync(fs.readFileSync(resolved, 'utf8'), {
      filename: resolved, configFile: false, babelrc: false,
      presets: [[require.resolve('@babel/preset-typescript'), { allExtensions: true, isTSX: true }]],
      plugins: [require.resolve('@babel/plugin-transform-react-jsx'), require.resolve('@babel/plugin-transform-modules-commonjs')],
    });
    const requireApp = (name) => {
      if (Object.hasOwn(mocks, name)) return mocks[name];
      if (name.startsWith('.')) return load(path.resolve(path.dirname(resolved), name));
      const alias = { '@lib': 'lib', '@components': 'components', '@assets': 'assets' }[name] || name;
      if (['api', 'lib', 'hooks', 'constants', 'components', 'types', 'assets'].includes(alias.split('/')[0])) return load(path.join(ROOT, 'app', alias));
      return require(name);
    };
    new Function('require', 'module', 'exports', result.code)(requireApp, module, module.exports);
    return module.exports;
  }
  return load(path.resolve(ROOT, file));
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
    async multiRemove(keys) { keys.forEach((key) => values.delete(key)); },
  };
}

class Multipart {
  constructor() { this.fields = []; }
  append(...field) { this.fields.push(field); }
  get(name) { return this.fields.find((field) => field[0] === name)?.[1]; }
}

function hookHarness() {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      return slots[index] ?? (slots[index] = { current: initial });
    },
    useCallback(callback) { return callback; },
    useMemo(callback) { return callback(); },
    useEffect(effect, deps) {
      const index = cursor++;
      const previous = slots[index];
      if (!previous || deps.some((dependency, i) => dependency !== previous.deps[i])) {
        previous?.cleanup?.();
        effects.push(() => { slots[index] = { deps, cleanup: effect() }; });
      }
    },
    createElement(type, props, ...children) { return { type, props: { ...props, children } }; },
  };
  return {
    react,
    render(callback) { cursor = 0; effects = []; const value = callback(); effects.forEach((effect) => effect()); return value; },
    unmount() { slots.forEach((slot) => slot?.cleanup?.()); },
  };
}
function findNodes(tree, predicate) {
  if (Array.isArray(tree)) return tree.flatMap((node) => findNodes(node, predicate));
  if (!tree || typeof tree !== 'object') return [];
  return [...(predicate(tree) ? [tree] : []), ...findNodes(tree.props?.children, predicate)];
}
const fakeNative = {
  View: 'View', Text: 'Text', ScrollView: 'ScrollView', TextInput: 'TextInput', TouchableOpacity: 'TouchableOpacity', Modal: 'Modal', Image: 'Image', FlatList: 'FlatList',
  StyleSheet: { create: (styles) => styles },
};
module.exports = { loadApp, memoryStorage, Multipart, hookHarness, findNodes, fakeNative };
