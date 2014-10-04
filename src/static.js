var fs = require("fs");
var intl = require("intl"); // Patch toLocaleString.

function generate(callback) {
	console.log("Rendering markup...");
	var React = require("react");
	var AppComponent = require("./app.jsx");
	var appComponentMarkup = React.renderComponentToStaticMarkup(AppComponent({static: true}));
	console.log("Parsing base source...");
	var jsdom = require("jsdom").jsdom;
	
	var html = fs.readFileSync(__dirname + "/../dist/index.html", "UTF-8");
	var document = jsdom(html);
	console.log("Massaging...");
	document.getElementById("app-container").innerHTML = appComponentMarkup;
	[].slice.call(document.querySelectorAll("script,#static-link")).forEach(function(tag) {
		tag.parentNode.removeChild(tag);
	});
	console.log("Minimizing CSS...");
	var style = document.querySelector("style");
	style.innerHTML = require('cssmin')(style.innerHTML);
	console.log("Serializing document...");
	var serializeDocument = require("jsdom").serializeDocument;
	html = serializeDocument(document);
	console.log("Minimizing document...");
	var Minimize = require('minimize');
	var minimizer = new Minimize();
	minimizer.parse(html, function(err, data) {
		callback(data);
	});
}

module.exports = generate;