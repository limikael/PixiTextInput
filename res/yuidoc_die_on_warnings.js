module.exports = function(data) {
	console.log("Checking for warnings...");

	for (var i in data.warnings) {
		var warning = data.warnings[i];

		if (warning.message != "unknown tag: internal")
			throw warning.message;
	}
}