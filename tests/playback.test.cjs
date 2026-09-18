const test = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, hookHarness, findNodes, fakeNative } = require('./load-app.cjs');

function playback() {
  const harness = hookHarness();
  const calls = []; const errors = [];
  let focused = true;
  const status = { isLoaded: true, playing: false, duration: 24, currentTime: 0, error: null };
  const player = { pause: () => calls.push('pause'), play: () => calls.push('play'), seekTo: async (seconds) => calls.push(['seek', seconds]) };
  const Component = loadApp('app/components/AudioPlayer.tsx', {
    react: harness.react, 'react-native': fakeNative,
    '@expo/vector-icons': { Entypo: 'Icon' },
    '@react-native-community/slider': 'Slider',
    '@react-navigation/native': { useIsFocused: () => focused },
    '@lib': { setHeight: (value) => value, faildMessage: (message) => errors.push(message) },
    'expo-audio': { useAudioPlayer: () => player, useAudioPlayerStatus: () => status, setAudioModeAsync: async () => {} },
  }).default;
  const render = () => harness.render(() => Component({ uri: 'file:///recording.m4a' }));
  return { render, calls, errors, status, blur: () => { focused = false; render(); } };
}

test('Expo audio playback pauses when leaving the voice screen', async () => {
  const state = playback();
  const tree = state.render();
  await findNodes(tree, (node) => node.type === 'TouchableOpacity')[0].props.onPress();
  state.blur();
  assert.deepEqual(state.calls, ['play', 'pause']);
});

test('Expo audio replay seeks to the start after finishing and slider seeks in seconds', async () => {
  const state = playback();
  state.status.currentTime = 24;
  const tree = state.render();
  await findNodes(tree, (node) => node.type === 'TouchableOpacity')[0].props.onPress();
  await findNodes(tree, (node) => node.type === 'Slider')[0].props.onSlidingComplete(6000);
  assert.deepEqual(state.calls, [['seek', 0], 'play', ['seek', 6]]);
});

test('unloaded or failed Expo audio disables playback and seek and reports load failures', async () => {
  const state = playback();
  state.status.isLoaded = false;
  let tree = state.render();
  const button = findNodes(tree, (node) => node.type === 'TouchableOpacity')[0];
  const slider = findNodes(tree, (node) => node.type === 'Slider')[0];
  assert.equal(button.props.disabled, true);
  assert.equal(slider.props.disabled, true);
  await button.props.onPress();
  await slider.props.onSlidingComplete(6000);
  assert.deepEqual(state.calls, []);
  state.status.error = 'Decoder failed';
  tree = state.render();
  assert.equal(findNodes(tree, (node) => node.type === 'TouchableOpacity')[0].props.disabled, true);
  assert.equal(state.errors.length, 1);
});
