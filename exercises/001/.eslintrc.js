module.exports = {
  extends: [
    'werk85/react',
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
    }
  }
}