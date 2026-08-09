/**
 * Domain-only test run: pure TypeScript, no React Native runtime.
 * `npm test` uses the jest-expo preset in package.json for component tests;
 * this config is what CI runs on every pull request because it is fast.
 *
 *   npx jest -c jest.domain.config.js
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: { strict: true, esModuleInterop: true, target: 'ES2020', lib: ['ES2020'] } }],
  },
  coverageThreshold: {
    './src/domain/': {
      statements: 80,
      branches: 80,
    },
  },
};
