module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        // Metadata.
        pkg: grunt.file.readJSON('package.json'),
        banner: '/*<%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '* <%= pkg.homepage %>\n' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>;\n' +
            '* Licensed <%= pkg.license %> \n*/\n\n',
        // Task configuration.
        watch: {
            dist: {
                files: ['dist/megaSlider.js'],
                tasks: ['uglify', 'copy']
            }
        },
        copy: {
            dist: {
                files: [
                    {src: ['dist/megaSlider.min.js'], dest: 'demo/js/megaSlider.min.js'}
                ]
            }
        },
        uglify: {
            options: {
                banner: '<%= banner %>'
            },
            dist: {
                files: {
                    'dist/megaSlider.min.js': ['dist/megaSlider.js']
                }
            }
        },
        release: {
            //1. update version in package json
            //2. execute "my-release" task
            //    "grunt release" for 0.0.1
            //    "grunt release:minor" for 0.1.0
            //    "grunt release:major" for 1.0.0
            options: {
                bump: false,
                add: true, 
                commit: true, 
                tag: true, 
                push: true, 
                pushTags: true, 
                npm: false,
                npmtag: false, 
                tagName: 'v.<%= version %>', 
                commitMessage: 'release <%= version %>', 
                tagMessage: 'v.<%= version %>' 
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-release');

    // Default task.
    grunt.registerTask('default', ['watch']);
    grunt.registerTask('update', ['uglify', 'copy']);
    grunt.registerTask('my-release', ['update', 'release']);

};
