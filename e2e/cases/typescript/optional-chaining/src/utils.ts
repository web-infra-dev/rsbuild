export interface User {
  name: string;
  profile?: {
    email?: string;
    settings?: {
      theme?: string;
      notifications?: {
        email?: boolean;
        push?: boolean;
      };
    };
  };
}

export function processUser(user: User | null): User | null {
  if (!user) return null;
  return {
    name: user.name,
    profile: user.profile,
  };
}

export function getNestedValue(): any {
  return {
    level1: {
      level2: {
        level3: {
          value: 'nested success',
        },
      },
    },
  };
}
