const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness, findNodes } = require('./load-app.cjs');

function app(metrics) {
  const harness = hookHarness();
  const mocks = {
    react: { ...harness.react, lazy: () => 'MainApp', Suspense: 'Suspense' },
    'react-native': { ActivityIndicator: 'ActivityIndicator', Dimensions: { get: () => ({ width: 390, height: 844 }) }, StyleSheet: { create: (styles) => styles }, Text: 'Text', View: 'View' },
    'react-native-gesture-handler': { GestureHandlerRootView: 'GestureRoot' },
    'react-native-safe-area-context': { SafeAreaProvider: 'SafeRoot', initialWindowMetrics: metrics },
    './app/components/SplashScreens': 'Onboarding',
  };
  const App = loadApp('App.tsx', mocks).default;
  return { render: () => harness.render(App) };
}

test('scene startup without native metrics renders onboarding and preserves the safe-area root through login', () => {
  const state = app(null);
  let tree = state.render();
  const root = findNodes(tree, (node) => node.type === 'SafeRoot')[0];
  assert.deepEqual(root.props.initialMetrics, { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, right: 0, bottom: 0, left: 0 } });
  assert.equal(tree.type, 'GestureRoot');
  findNodes(tree, (node) => node.type === 'Onboarding')[0].props.onComplete();
  tree = state.render();
  assert.equal(tree.type, 'GestureRoot');
  const nextRoot = findNodes(tree, (node) => node.type === 'SafeRoot')[0];
  assert.equal(nextRoot.props.initialMetrics, root.props.initialMetrics);
  assert.equal(findNodes(tree, (node) => node.type === 'Onboarding').length, 0);
  assert.equal(findNodes(tree, (node) => node.type === 'MainApp').length, 1);
});

test('startup uses real initial native insets when available', () => {
  const metrics = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 59, right: 0, bottom: 34, left: 0 } };
  const root = findNodes(app(metrics).render(), (node) => node.type === 'SafeRoot')[0];
  assert.equal(root.props.initialMetrics, metrics);
});
