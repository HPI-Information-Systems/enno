'use strict';

var rename = {
    ext: function (ext) {
        return function (dest, src) {
            return dest + "/" + src.replace(/(\.[^\/.]*)?$/, ext)
        }
    }
};

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        dist_target: {
            js: 'enno/dist/<%= pkg.name %>-<%= pkg.version %>.js',
            jsmin: 'enno/dist/<%= pkg.name %>-<%= pkg.version %>.min.js',
            css: 'enno/dist/<%= pkg.name %>-<%= pkg.version %>.css',
            cssmin: 'enno/dist/<%= pkg.name %>-<%= pkg.version %>.min.css'
        },
        concat: {
            js: {
                src: [
                    'node_modules/jsplumb/dist/jsplumb.min.js',
                    'enno/src/js/**'
                ],
                dest: '<%= dist_target.js %>'
            },
            css: {
                src: [
                    '<%= dist_target.css %>'
                ],
                dest: '<%= dist_target.css %>'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: {
                    '<%= dist_target.jsmin %>': ['<%= concat.js.dest %>']
                }
            }
        },
        less: {
            all: {
                files: {
                    '<%= dist_target.cssmin %>': 'src/css/enno.less'
                }
            }
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: 'enno/dist/',
                src: ['<%= pkg.name %>-<%= pkg.version %>.css'],
                dest: 'enno/dist/',
                rename: rename.ext(".min.css")
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'enno/src/',
                    src: ['*.html'],
                    dest: 'enno/dist/',
                    filter: 'isFile'
                }]
            }
        },
        replace: {
            version: {
                src: ['enno/dist/enno.html'],
                overwrite: true,
                replacements: [{
                    from: '{{version}}',
                    to: '<%= pkg.version %>'
                }, {
                    from: '{{name}}',
                    to: '<%= pkg.name %>'
                }]
            }
        },
        open: {
            app: {
                url: 'http://localhost:5000/'
            },
            test: {
                url: 'http://localhost:5000/?some=value'
            }
        }
    });

    grunt.registerTask('flask', function () {
        var spawn = require('child_process').spawnSync;
        grunt.log.writeln('Starting Flask development server.');
        spawn('python', ['run.py'], {stdio: 'inherit'});
    });
    grunt.registerTask('dist', ['less', 'concat', 'uglify', 'copy', 'replace:version', 'cssmin']);
    grunt.registerTask('demo', ['open:app', 'flask']);
};
