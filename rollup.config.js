export default {
  input: 'mutent-mongodb.mjs',
  output: {
    file: 'mutent-mongodb.js',
    format: 'cjs'
  },
  external: [
    'lodash/flatten',
    'lodash/isPlainObject',
    'lodash/pick',
    'lodash/set',
    'lodash/uniq'
  ]
}
