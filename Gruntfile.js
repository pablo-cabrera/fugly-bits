module.exports = function (grunt) {
    "use strict";

    grunt.option("stack", true);

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),

        meta: {
            banner:
                "/*! " +
                "<%= pkg.title || pkg.name %> v<%= pkg.version %> | " +
                "(c) <%= grunt.template.today(\"yyyy\") %> " +
                "<%= pkg.author.name %> | " +
                " Available via <%= pkg.license %> license " +
                "*/"
        },

        gabarito: {
            src: [
                "node_modules/fugly-js/lib/fugly.js",
                "node_modules/parts/lib/parts.js",
                "lib/fugly-bits.js",
                "test/cases/**/*.js"
            ],

            options: {
                environments: ["phantom"]
            }
        },

        uglify: {
            options: {
                banner: "<%= meta.banner %>\n"
            },

            dist: {
                src: "lib/fugly-bits.js",
                dest: "dist/fugly-bits.js"
            }
        },

        jshint: {
            lib: {
                options: {
                    /* enforcing */
                    strict: true,
                    bitwise: false,
                    curly: true,
                    eqeqeq: true,
                    immed: true,
                    latedef: true,
                    newcap: true,
                    noarg: true,
                    noempty: true,
                    plusplus: true,
                    quotmark: "double",
                    undef: true,

                    /* environment */
                    browser: true,

                    globals: {
                        fugly: false
                    }
                },

                src: ["lib/fugly-bits.js"]
            },

            tests: {
                options: {
                    /* enforcing */
                    strict: true,
                    bitwise: false,
                    curly: true,
                    eqeqeq: true,
                    immed: true,
                    latedef: true,
                    newcap: true,
                    noarg: true,
                    noempty: true,
                    plusplus: true,
                    quotmark: "double",
                    undef: true,

                    /* environment */
                    browser: true,

                    globals: {
                        fugly: false,
                        gabarito: false,
                        parts: false
                    }
                },

                src: ["test/cases/**/*.js"]
            },

            grunt: {
                options: {
                    /* enforcing */
                    strict: true,
                    bitwise: false,
                    curly: true,
                    eqeqeq: true,
                    immed: true,
                    latedef: true,
                    newcap: true,
                    noarg: true,
                    noempty: true,
                    plusplus: true,
                    quotmark: "double",

                    undef: true,

                    /* relaxing */
                    eqnull: true,
                    sub: true,
                    evil: true,

                    /* environment */
                    node: true
                },

                src: ["Gruntfile.js"]
            }
        },

        yuidoc: {
            compile: {
                name: "<%= pkg.name %>",
                description: "<%= pkg.description %>",
                version: "<%= pkg.version %>",
                url: "<%= pkg.homepage %>",
                options: {
                    paths: "lib/",
                    outdir: "docs/"
                }
            }
        },

        jscs: {
            src: [
                "Gruntfile.js",
                "lib/fugly-bits.js",
                "test/cases/**/*.js"
            ],
            options: {
                config: ".jscsrc"
            }
        },

        clean: [
            "docs",
            "dist"
        ]

    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-yuidoc");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-gabarito");
    grunt.loadNpmTasks("grunt-jscs");

    grunt.registerTask("default", ["clean", "jshint", "jscs", "gabarito"]);

    grunt.registerTask("build", ["clean", "default", "uglify", "yuidoc"]);

};
