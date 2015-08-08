'use strict';

module.exports = function (grunt) {

    var isDeploy = grunt.cli.tasks.length >= 1 && grunt.cli.tasks.indexOf('deploy') > -1,
        isLiveReload = grunt.cli.tasks.length >= 1 && grunt.cli.tasks.indexOf('watch') > -1,
        version = {
            css: 14,
            js : 8
        },
        prefix = {
            critical: '_includes/critical-assets/',
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
                tasks: ['sass'],
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
                    // prefix.critical + '/**/*.*',
                    '_site/' + prefix.css + '/main.css',
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
            critical: {
                src: 'assets/css/critical.scss',
                dest: prefix.critical + '/critical.css'
            },
            main: {
                options: {
                    style: 'expanded'
                },
                src: 'assets/css/main.scss',
                dest: prefix.css + '/main.css'
            }
        },
        csso: {
            critical: {
                options: {
                    report: 'min'
                },
                src: prefix.critical + '/critical.css',
                dest: prefix.critical + '/critical.min.css'
            },
            main: {
                options: {
                    report: 'min'
                },
                src: prefix.css + '/main.css',
                dest: prefix.css + '/main.min.css'
            }
        },
        uglify: {
            inlined: {
                options: {
                    report: 'min',
                    preserveComments: false
                },
                src: '_includes/script.js',
                dest: '_includes/script.min.js'
            },
            magic: {
                options: {
                    report: 'min',
                    preserveComments: 'some'
                },
                src: prefix.js + '/magic.js',
                dest: prefix.js + '/magic.min.js'
            }
        },
        clean: {
            critical: {
                src: prefix.css + '/**/*.*',
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    // grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-csso');

    grunt.registerTask('travis', ['jshint']);
    grunt.registerTask('default', ['concat:meta', 'sass', 'concat:js']);
    grunt.registerTask('deploy', ['concat:meta', 'clean:critical', 'sass', 'csso', 'concat:js', 'uglify']);

};
