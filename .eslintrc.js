module.exports = {
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:jsx-a11y/recommended",
    "plugin:react-hooks/recommended",
    "plugin:react/recommended",
    "prettier"
  ],
  plugins: ["react", "import", "jsx-a11y"],
  parser: "@typescript-eslint/parser",
  env: {
    es6: true,
    browser: true,
    node: true
  },
  rules: {
    // Not needed with the newer jsx transform.
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "semi": ["warn", "always"],
    "quotes": ["warn", "single"],
    "no-unused-vars": "warn"
  },
  settings: {
    react: {
      version: "detect"
    },
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", '.ts', '.tsx']
      }
    }
  }
}
