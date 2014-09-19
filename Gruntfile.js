var qsub = require("qsub");
var async = require("async");
var fs = require("fs");

module.exports = function(grunt) {

	grunt.registerTask("publish", function() {
		var done = this.async();

		if (fs.existsSync("doc.zip"))
			fs.unlinkSync("doc.zip");

		async.series([

			function(next) {
				var job = qsub("zip");
				job.arg("-r", "doc.zip", "doc");
				job.expect(0);
				job.run().then(next, grunt.fail.fatal);
			},

			function(next) {
				var job = qsub("curl");
				job.arg("-s", "-X", "POST");
				job.arg("--data-binary", "@doc.zip");
				job.arg("http://limikael.altervista.org/?target=pixitextinput&key=ScFVm5gw");
				job.expect(0).expectOutput("OK").show();
				job.run().then(next, grunt.fail.fatal);
			},

			function(next) {
				fs.unlinkSync("doc.zip");
				done();
			}
		]);
	});

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json')
	});

	grunt.registerTask("doc", function() {
		var done = this.async();

		var job = qsub("./node_modules/.bin/yuidoc");
		job.arg("--configfile", "res/yuidoc.json");
		job.show().expect(0);

		job.run().then(done, function(e) {
			console.log(e);
			grunt.fail.fatal(e);
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