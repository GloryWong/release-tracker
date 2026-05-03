import antfu from '@antfu/eslint-config'

export default await antfu({
  react: true,
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
    'no-console': 'error',
    'no-unused-vars': 'off',
    'node/prefer-global/process': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    'e18e/prefer-static-regex': 'off',
  },
  // typescript: {
  //   overrides: {
  //     'ts/no-explicit-any': 'off',
  //     'ts/no-unused-expressions': ['error', {
  //       allowShortCircuit: true,
  //       allowTernary: true,
  //       allowTaggedTemplates: true,
  //     }],
  //   },
  // },
})
