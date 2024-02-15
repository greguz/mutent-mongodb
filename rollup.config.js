export default {
  input: './src/adapter.mjs',
  output: [
    {
      file: './mutent-mongodb.mjs',
      format: 'es'
    },
    {
      file: './mutent-mongodb.cjs',
      format: 'cjs'
    }
  ],
  external: ['mutent']
}
