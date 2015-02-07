'use strict';

module.exports = function (grunt) {

    var isDeploy = grunt.cli.tasks.length >= 1 && grunt.cli.tasks.indexOf('deploy') > -1,
        isLiveReload = grunt.cli.tasks.length >= 1 && grunt.cli.tasks.indexOf('watch') > -1,
        version = {
            css: 11,
            js : 6
        },
        prefix = {
            css: 'assets/css/v/' + version.css,
            js:  'assets/js/v/' + version.js
        };

    grunt.config.init({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            meta: {
                options: {
                    banner: '{% assign version_css = ' + version.css + ' %}\n' +
                            '{% assign version_js = ' + version.js + ' %}\n' +
                            '{% assign is_deploy = ' + isDeploy + ' %}' +
                            '{% assign is_livereload = ' + isLiveReload + ' %}'
                },
                files: {
                    '_includes/meta.html': []
                }
            },
            js: {
                src: [
                    'assets/js/hammer.js',
                    'assets/js/layout.js'
                    // 'assets/js/highlight.js',
                    // 'assets/js/magic.js'
                ],
                dest: prefix.js + '/magic.js'
            }
        },
        watch: {
            options: {
                atBegin: true
            },
            sass: {
                files: ['assets/css/**/*.scss'],
                tasks: ['sass:magic'],
                options: {
                    interrupt: true
                }
            },
            js: {
                files: [
                    'assets/js/**/*.js',
                    '!assets/js/v/**/*.js'
                ],
                tasks: ['concat:js'],
                options: {
                    interrupt: true
                }
            },
            livereload: {
                options: {
                    livereload: true,
                    interrupt: true
                },
                files: [
                    '_site/' + prefix.css + '/magic.css',
                    '_site/' + prefix.js + '/magic.js'
                ]
            }
        },
        jshint: {
            all: [
                'Gruntfile.js',
                'assets/scripts/**/*.js',
                '!assets/scripts/hammer.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },
        sass: {
            options: {
                noCache: true
            },
            magic: {
                options: {
                    style: 'expanded'
                },
                src: 'assets/css/magic.scss',
                dest: prefix.css + '/magic.css'
            }
        },
        csso: {
            magic: {
                options: {
                    report: 'gzip'
                },
                src: prefix.css + '/magic.css',
                dest: prefix.css + '/magic.min.css'
            }
        },
        uglify: {
            magic: {
                options: {
                    report: 'gzip',
                    preserveComments: 'some'
                },
                src: prefix.js + '/magic.js',
                dest: prefix.js + '/magic.min.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-csso');

    grunt.registerTask('travis', ['jshint']);
    grunt.registerTask('default', ['concat:meta', 'sass:magic', 'concat:js']);
    grunt.registerTask('deploy', ['concat:meta', 'sass:magic', 'csso:magic', 'concat:js', 'uglify:magic']);

};
