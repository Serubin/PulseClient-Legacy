module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
        concat: {
			js_concat: {
				src: ['resources/js/*.js'],
				dest: 'resources/App.js'
			}
        },
        watch: {
            js: {
				files: ['resources/js/*.js'],
				tasks: ['concat']
			},
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('build', ['concat']);
    grunt.registerTask('default', ['build', 'watch']);
}
