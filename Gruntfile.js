module.exports = function(grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
        concat: {
			js_concat: {
				src: ['resources/js/*.js'],
				dest: 'resources/App.js'
			},
            js_lib_concat: {
                src: ['vendors/**/*.js'],
                dest: 'resources/Lib.js'
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
