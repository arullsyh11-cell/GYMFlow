import assert from 'node:assert/strict';
import { startRemoteLiveSync } from '../liveSync.js';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function makeBrowserStubs() {
  const windowListeners = new Map();
  const documentListeners = new Map();
  globalThis.window = {
    setTimeout, clearTimeout, setInterval, clearInterval,
    addEventListener(type, callback) {
      const set = windowListeners.get(type) || new Set();
      set.add(callback); windowListeners.set(type, set);
    },
    removeEventListener(type, callback) { windowListeners.get(type)?.delete(callback); },
    dispatchEvent(event) { for (const callback of windowListeners.get(event.type) || []) callback(event); }
  };
  globalThis.document = {
    visibilityState: 'visible',
    addEventListener(type, callback) {
      const set = documentListeners.get(type) || new Set();
      set.add(callback); documentListeners.set(type, set);
    },
    removeEventListener(type, callback) { documentListeners.get(type)?.delete(callback); }
  };
}

function makeClient() {
  const client = {
    callback: null,
    subscribed: false,
    channel() {
      const self = this;
      return {
        on(type, filter, callback) { self.callback = callback; return this; },
        subscribe(onStatus) { self.subscribed = true; queueMicrotask(() => onStatus?.('SUBSCRIBED')); return this; }
      };
    },
    removeChannel() { this.subscribed = false; return Promise.resolve('ok'); }
  };
  return client;
}

makeBrowserStubs();
const userId = 'user-smoke';
let remoteState = {
  settings: { userName: 'User', weight: 70 },
  exercises: [], routines: [], history: [], activeSession: null, weightHistory: []
};
let localState = structuredClone(remoteState);
let allowApply = true;
const applied = [];
const statuses = [];
const client = makeClient();
const stop = startRemoteLiveSync({
  client,
  userId,
  getCurrentUserId: () => userId,
  getCurrentState: () => structuredClone(localState),
  canApplyState: () => allowApply,
  applyState: state => { localState = structuredClone(state); applied.push(structuredClone(state)); },
  fetchState: async () => ({ state: structuredClone(remoteState), meta: {} }),
  onStatus: (status, message) => statuses.push([status, message]),
  pollIntervalMs: 60000
});

await delay(15);
assert.equal(applied.length, 0, 'initial equal state does not re-render');

remoteState = structuredClone(remoteState);
remoteState.history.push({ id: 'session-1', duration: 600, exercises: [] });
client.callback?.({ table: 'workout_sessions' });
await delay(240);
assert.equal(applied.length, 1, 'Realtime event pulls and applies the newer state');
assert.equal(localState.history.length, 1);

allowApply = false;
remoteState = structuredClone(remoteState);
remoteState.weightHistory.push({ date: '2026-10-10', weight: 70 });
client.callback?.({ table: 'weight_history' });
await delay(240);
assert.equal(applied.length, 1, 'remote state is deferred while local editing is unsafe');

allowApply = true;
window.dispatchEvent(new Event('gymflow:remote-save-complete'));
await delay(420);
assert.equal(applied.length, 2, 'deferred remote state is rechecked after local save completes');
assert.equal(localState.weightHistory.length, 1);

stop();
assert.equal(client.subscribed, false, 'sync cleanup removes the Realtime channel');
console.log('PASS: initial equality, remote update, deferred update during local edits, save-complete retry, and cleanup.');
