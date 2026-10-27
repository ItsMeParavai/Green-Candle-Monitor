import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pnl_tracker_v1';

export const defaultState = {
  theme: 'dark', // 'dark' | 'light'
  weekends: false,
  activeAccount: 'main',
  accounts: [{ id: 'main', name: 'Main Account' }],
  // entries[accountId][YYYY-MM-DD] = { pnl: number, note: string }
  entries: { main: {} },
  // goals[accountId] = monthly goal number
  goals: { main: 0 },
};

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch (e) {
    return defaultState;
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // ignore write errors; app keeps working from memory
  }
}
