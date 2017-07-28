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
            js: 'enno/static/<%= pkg.name %>-<%= pkg.version %>.js',
            jsmin: 'enno/static/<%= pkg.name %>-<%= pkg.version %>.min.js',
            css: 'enno/static/css/<%= pkg.name %>-<%= pkg.version %>.css',
            cssmin: 'enno/static/css/<%= pkg.name %>-<%= pkg.version %>.min.css'
        },
        concat: {
            js: {
                src: [
                    'node_modules/jsplumb/static/jsplumb.min.js',
                    'enno/src/js/**'
                ],
                dest: '<%= dist_target.js %>'
            },
            css: {
                src: [
                    'node_modules/font-awesome/css/font-awesome.css',
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
                    '<%= dist_target.css %>': 'enno/src/css/enno.less'
                }
            }
        },
        cssmin: {
            minify: {
                expand: true,
                cwd: 'enno/static/css/',
                src: ['<%= pkg.name %>-<%= pkg.version %>.css'],
                dest: 'enno/static/css/',
                rename: rename.ext(".min.css")
            }
        },
        copy: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'enno/src/',
                    src: ['*.html'],
                    dest: 'enno/static/',
                    filter: 'isFile'
                },{
                    expand: true,
                    cwd: 'node_modules/font-awesome/',
                    src: ['fonts/**'],
                    dest: 'enno/static/',
                    filter: 'isFile'
                }]
            }
        },
        replace: {
            version: {
                src: ['enno/static/enno.html'],
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
