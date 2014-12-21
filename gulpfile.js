_ = require("lodash");
browserify = require("gulp-browserify");
concat = require("gulp-concat");
envify_c = require("envify/custom");
fs = require("fs");
gulp = require("gulp");
gutil = require("gulp-util");
plumber = require("gulp-plumber");
reactify = require("reactify");
uglify = require("gulp-uglify");
spawn = require('child_process').spawn;


gulp.task("data", function(complete) {
	var lines = fs.readFileSync("data/menu.tsv", "UTF-8")
		.split("\n")
		.filter(function(line){return line.indexOf("\t") > -1; })
		.map(function(line){return line.replace(/\r/g, "").split("\t"); });

	var header = lines.shift();
	var data = lines.map(function(datum, lineNo) {
		var pairs = _(_.zip(header, datum))
			.map(function(pair) {
				var key = pair[0];
				var value = pair[1];
				if(/price$/.test(key)) value = parseFloat(value);
				if(/pieces/.test(key)) value = parseInt(value);
				return [key, value];
			})
			.filter(function(pair) { return !!pair[1]; })
			.value()
		;
		return _.extend(
			{id: lineNo + 1},
			_.zipObject(pairs)
		);
	});
	fs.writeFileSync("src/data.js", "module.exports = " + JSON.stringify({mtime: +new Date(), data: data}, null, "\t"), "UTF-8");
	complete();
});

function mainJsCompile(extraTransforms) {
	return gulp.src(["src/main.js"])
		.pipe(plumber())
		.pipe(browserify({insertGlobals: false, debug: true, transform: [reactify].concat(extraTransforms || [])}));
}

gulp.task("debug", ["data"], function() {
	return mainJsCompile()
		.pipe(concat("bundle.js"))
		.pipe(gulp.dest("dist"));
});

gulp.task("release", ["data"], function() {
	return mainJsCompile([envify_c({NODE_ENV: "production"})])
		.pipe(uglify({compress: {dead_code: true}}))
		.pipe(concat("bundle.js"))
		.pipe(gulp.dest("dist"));
});

gulp.task("static", ["data"], function(complete) {
	require('node-jsx').install();
	var staticify = require("./src/static");
	staticify(function(html) {
		fs.writeFileSync("./dist/static.html", html, "UTF-8");
		complete();
	});
});


gulp.task("pub", ["static", "release"], function(complete) {
	// Kind of a ghetto way to schlep `dist` over to the `gh-pages` branch...
	spawn("zip", ["-jr0", "dist.zip", "dist"], {"stdio": "inherit"}).on("close", function(code) {
		if(code) return;
		spawn("git", ["checkout", "gh-pages"], {"stdio": "inherit"}).on("close", function(code) {
			if(code) return;
			spawn("unzip", ["-o", "dist.zip"], {"stdio": "inherit"}).on("close", function(code) {
				fs.unlinkSync("dist.zip");
				complete();
			});
		});
	});
});

gulp.task("watch", function() {
	gulp.watch(["src/*.js", "src/**/*.js", "src/*.jsx", "src/**/*.jsx"], ["debug"]);
});