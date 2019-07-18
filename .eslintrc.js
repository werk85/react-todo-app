module.exports = {
  extends: [
    'werk85/modern',
    'plugin:react/recommended',
  ],
  parserOptions: {
    project: './src/tsconfig.json',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    "import/resolver": {
      typescript: {
        directory: 'src'
      }
    },
    react: {
      version: 'detect'
    }
  },
  rules: {
    'react/display-name': 'off',
    'react/prop-types': 'off'
  }
}