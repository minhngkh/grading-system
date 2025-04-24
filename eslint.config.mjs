import antfu from '@antfu/eslint-config';

export default antfu({
  stylistic: false,
  typescript: true,
}, {
  rules: {
    "unused-imports/no-unused-vars": "warn",
    "no-console": "off",
  }
});
