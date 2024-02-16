export default {
  input: './mutent-mongodb.mjs',
  output:  {
    file: './mutent-mongodb.cjs',
    format: 'cjs'
  },
  external: ['mutent']
}
