module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [2, 'always', ['cm', 'ci', 'deps', 'ui', 'db', 'domain', 'docs', 'test', 'risk', 'release']],
  },
};
