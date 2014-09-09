var qsub = require("qsub");

module.exports = function(grunt) {
	grunt.loadNpmTasks('grunt-ftpush');

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		ftpush: {
			doc: {
				auth: {
					host: 'ftp.netpokerdoc.altervista.org',
					authKey: 'altervista',
					port: 21
				},
				src: 'doc',
				dest: '',
				useList: true
			}
		}

	});

	grunt.registerTask("doc", function() {
		var done = this.async();

		var job = qsub("./node_modules/.bin/yuidoc");
		job.arg("--configfile", "res/yuidoc.json");
		job.show().expect(0);

		job.run().then(done, function(e) {
			console.log(e);
		});
	});

	grunt.registerTask("browserify", function() {
		var done = this.async();

		var job = qsub("./node_modules/.bin/browserify").arg("-d");
		job.arg("-o", "test/textinputtest.bundle.js");
		job.arg("test/textinputtest.js");
		job.show().expect(0);

		job.run().then(done, function(e) {
			console.log(e);
			throw e;
		})
	});
}