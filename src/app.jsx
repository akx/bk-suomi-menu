/** @jsx React.DOM */
var React = require("react/addons");
var Data = require("./data");
var _ = require("lodash");

var AppComponent = React.createClass({
	mixins: [React.addons.LinkedStateMixin],
	propTypes: {
		static: React.PropTypes.bool
	},
	getInitialState: function() {
		var hour = (new Date().getHours());
		return {
			filter: "",
			night: (!this.props.static) && (hour >= 23 || hour < 8),
			onlySet: false,
		};
	},

	getResultRows: function() {
		var filter = ("" + this.state.filter).toLowerCase();
		var night = !!this.state.night;
		var onlySet = !!this.state.onlySet;
		var filterPredicate = function(item) {
			if(filter.length > 1 && item.product.toLowerCase().indexOf(filter) == -1) return false;
			if(night) {
				if(!item.night_price) return false;
				if(onlySet && !item.night_set_price) return false;
			} else {
				if(onlySet && !item.set_price) return false;
			}
			return true;
		};
		return _(Data.data).filter(filterPredicate).map(function(item) {
			var price = (night ? item.night_price : item.price);
			var setPrice = (night ? item.night_set_price : item.set_price);
			return (
				<tr key={item.id}>
					<td>{item.category}</td>
					<td>{item.product}</td>
					<td className="ra">{price ? price.toFixed(2) : ""}</td>
					<td className="ra">{setPrice ? setPrice.toFixed(2) : ""}</td>
				</tr>
			);
		});
	},

	componentDidMount: function() {
		this.refs.filterInput.getDOMNode().focus();
	},

	render: function() {
		var resultRows = this.getResultRows();
		var controls = (this.props.static ? null : (
			<form className="row controls pure-form pure-g">
				<div className="pure-u-2-5"><input type="text" valueLink={this.linkState('filter')} placeholder="Hae..." ref="filterInput" className="pure-input-1" /></div>
				<div className="pure-u-1-4"><label className="pure-checkbox">&nbsp;<input type="checkbox" checkedLink={this.linkState('night')} /> Yömenu</label></div>
				<div className="pure-u-1-4"><label className="pure-checkbox">&nbsp;<input type="checkbox" checkedLink={this.linkState('onlySet')} /> Vain ateriat</label></div>
			</form>
		));
		return (<div>
			{controls}
			<div className="row results table-responsive">
				<table className="pure-table pure-table-striped">
					<thead>
						<tr>
							<th>Kategoria</th>
							<th>Tuote</th>
							<th>Hinta</th>
							<th>Ateriahinta</th>
						</tr>
					</thead>
					<tbody>
						{resultRows}
					</tbody>
				</table>
			</div>
			<div className="row">
				Tiedot päivitetty: {new Date(Data.mtime).toDateString()}
			</div>
		</div>);
	}
});

module.exports = AppComponent;
