module.exports = function(grunt) {

  grunt.initConfig({
    uglify: {
      options: {
        mangle: true
      },
      release : {
        files: {
          'fluentdom.min.js': ['node_modules/xpath/xpath.js', 'fluentdom.js']
        }
      }
    },
    "watch" : {
      styles: {
        files: ['fluentdom.js'],
        tasks: ['default'],
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
  grunt.registerTask('default', ['uglify:release']);
};