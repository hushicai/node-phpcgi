var phpcgi = require('./main');

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    port: 8000,
                    hostname: '*',
                    middleware: function(connect, options) {
                        var middlewares = [];
                        var directory = options.directory ||
                        options.base[options.base.length - 1];
                        if (!Array.isArray(options.base)) {
                            options.base = [options.base];
                        }

                        // Here comes the PHP middleware
                        middlewares.push(phpcgi({documentRoot: __dirname}));

                        // Same as in grunt-contrib-connect
                        options.base.forEach(function(base) {
                            middlewares.push(connect.static(base));
                        });

                        middlewares.push(connect.directory(directory));
                        return middlewares;
                    }
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('default', ['connect:server:keepalive']);
};
