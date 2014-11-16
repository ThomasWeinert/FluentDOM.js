module.exports = function(grunt) {

  grunt.initConfig({
    uglify: {
      options: {
        mangle: true
      },
      release : {
        files: {
          'release/fluentdom.min.js': ['src/fluentdom.js']
        }
      }
    },
    "watch" : {
      styles: {
        files: ['src/**/*.js'],
        tasks: ['release'],
        options: {
          spawn: false,
          debounceDelay: 250,
          livereload: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('watcher', ['watch']);
  grunt.registerTask('release', ['uglify:release']);
};