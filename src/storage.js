import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ENTRIES: '@pnl_entries',
  GOAL: '@pnl_goal',
  ACCOUNTS: '@pnl_accounts',
  SELECTED_ACCOUNT: '@pnl_selected_account',
  THEME_MODE: '@pnl_theme_mode',
};

export const loadAppData = async () => {
  try {
    const entriesJson = await AsyncStorage.getItem(KEYS.ENTRIES);
    const goalJson = await AsyncStorage.getItem(KEYS.GOAL);
    const accountsJson = await AsyncStorage.getItem(KEYS.ACCOUNTS);
    const selectedAccount = await AsyncStorage.getItem(KEYS.SELECTED_ACCOUNT);
    const themeModeJson = await AsyncStorage.getItem(KEYS.THEME_MODE);

    return {
      entries: entriesJson ? JSON.parse(entriesJson) : {},
      goal: goalJson ? parseFloat(JSON.parse(goalJson)) : 100,
      accounts: accountsJson ? JSON.parse(accountsJson) : ['Main Account', 'Trading'],
      selectedAccount: selectedAccount || 'Main Account',
      isDarkMode: themeModeJson !== null ? JSON.parse(themeModeJson) : true,
    };
  } catch (error) {
    console.error('Storage load error:', error);
    return {
      entries: {},
      goal: 100,
      accounts: ['Main Account', 'Trading'],
      selectedAccount: 'Main Account',
      isDarkMode: true,
    };
  }
};

export const saveEntries = async (entries) => {
  try {
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(entries));
  } catch (e) {
    console.error(e);
  }
};

export const saveGoal = async (goal) => {
  try {
    await AsyncStorage.setItem(KEYS.GOAL, JSON.stringify(goal));
  } catch (e) {
    console.error(e);
  }
};

export const saveSelectedAccount = async (account) => {
  try {
    await AsyncStorage.setItem(KEYS.SELECTED_ACCOUNT, account);
  } catch (e) {
    console.error(e);
  }
};

export const saveThemeMode = async (isDark) => {
  try {
    await AsyncStorage.setItem(KEYS.THEME_MODE, JSON.stringify(isDark));
  } catch (e) {
    console.error(e);
  }
};

export default {
  loadAppData,
  saveEntries,
  saveGoal,
  saveSelectedAccount,
  saveThemeMode,
};
