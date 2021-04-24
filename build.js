const esbuild = require('esbuild');

esbuild.build({
	entryPoints: ['./src/index.ts'],
	outfile: './public/bundle.js',
	platform: 'browser',
	bundle: true,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.log('watch build succeeded')
    },
  },	
}).then(result => {
  //result.stop()
})