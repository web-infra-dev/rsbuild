import { getNestedValue, processUser, type User } from './utils';

declare global {
  interface Window {
    optionalChainingTest: string;
    nullishCoalescingTest: string;
    deepChainingTest: string;
    combinedTest: string;
  }
}

// Test data
const user: User = {
  name: 'John',
  profile: {
    email: 'john@example.com',
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
      },
    },
  },
};

const incompleteUser: Partial<User> = {
  name: 'Jane',
};

const nullUser: User | null = null;

// Test optional chaining
const email = user.profile?.email ?? 'No email';
const theme = incompleteUser.profile?.settings?.theme ?? 'default';
const emailNotifications =
  user.profile?.settings?.notifications?.email ?? false;

// Test nullish coalescing with various falsy values
const nullValue = null;
const undefinedValue = undefined;
const emptyString = '';
const zero = 0;
const falseValue = false;

const nullishTest1 = nullValue ?? 'fallback';
const nullishTest2 = undefinedValue ?? 'fallback';
const nullishTest3 = emptyString ?? 'fallback'; // Should keep empty string
const nullishTest4 = zero ?? 'fallback'; // Should keep 0
const nullishTest5 = falseValue ?? 'fallback'; // Should keep false

// Test deep optional chaining
const deepValue =
  getNestedValue()?.level1?.level2?.level3?.value ?? 'deep fallback';

// Test with function calls
const processedUser = processUser(nullUser)?.name ?? 'Unknown';

// Set results on window for testing
window.optionalChainingTest = `email: ${email}, theme: ${theme}, notifications: ${emailNotifications}`;
window.nullishCoalescingTest = `${nullishTest1}, ${nullishTest2}, ${nullishTest3}, ${nullishTest4}, ${nullishTest5}`;
window.deepChainingTest = deepValue;
window.combinedTest = processedUser;
