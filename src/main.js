var React = require("react/addons");
var AppComponent = require("./app.jsx");

(function(window, document) {
	var container = document.getElementById("app-container");
	React.renderComponent(AppComponent(), container);
	window.React = React;
}(window, document));