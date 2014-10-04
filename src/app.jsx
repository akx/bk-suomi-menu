/** @jsx React.DOM */
var React = require("react");
var Data = require("./data");

function formatCurrency(value) {
	if(!value) return "";
	try {
		return value.toLocaleString(["fi", "sv", "en"], {
			"style": "currency",
			"currency": "EUR",
			"minimumFractionDigits": 2,
			"maximumFractionDigits": 2,
		});
	} catch (e) {
		// Silly browser! :(
	}
	return value.toFixed(2);
}

var AppComponent = React.createClass({
	propTypes: {
		static: React.PropTypes.bool
	},
	getInitialState: function() {
		var hour = (new Date().getHours());
		return {
			filter: "",
			night: (!this.props.static) && (hour >= 23 || hour < 8),
			onlySet: false,
			maxPrice: ""
		};
	},

	getFilterPredicate: function() {
		if(this.props.static) return function() { return true; };
		var filter = ("" + this.state.filter).toLowerCase();
		var night = !!this.state.night;
		var onlySet = !!this.state.onlySet;
		var maxPrice = parseFloat(this.state.maxPrice);
		return function(item) {
			if(filter.length > 1 && item.product.toLowerCase().indexOf(filter) == -1) return false;
			if(night) {
				if(!item.night_price) return false;
				if(onlySet && !item.night_set_price) return false;
				if(maxPrice > 0 && item.night_price > maxPrice) return false;
			} else {
				if(maxPrice > 0 && item.price > maxPrice) return false;
				if(onlySet && !item.set_price) return false;
			}
			return true;
		};
	},

	getResultRows: function() {
		var rows = [], item, filterPredicate = this.getFilterPredicate();
		var night = !!this.state.night;
		for(var i = 0; i < Data.data.length; i++) {
			item = Data.data[i];
			if(!filterPredicate(item)) continue;
			var price = (night ? item.night_price : item.price);
			var setPrice = (night ? item.night_set_price : item.set_price);
			rows.push(
				<tr key={item.id}>
					<td>{item.category}</td>
					<td>{item.product}</td>
					<td className="ra">{formatCurrency(price)}</td>
					<td className="ra">{formatCurrency(setPrice)}</td>
				</tr>
			);
		}
		return rows;
	},

	componentDidMount: function() {
		this.refs.filterInput.getDOMNode().focus();
	},

	filterChanged: function(event) { this.setState({filter: event.target.value}); },
	maxPriceChanged: function(event) { this.setState({maxPrice: event.target.value}); },
	nightChanged: function(event) { this.setState({night: !!event.target.checked}); },
	onlySetChanged: function(event) { this.setState({onlySet: event.target.checked}); },

	render: function() {
		var resultRows = this.getResultRows();
		var controls = (this.props.static ? null : (
			<table className="row controls">
				<tr>
					<td><input type="text" value={this.state.filter} onChange={this.filterChanged} placeholder="Hae..." ref="filterInput" /></td>
					<td><input type="number" min="0" max="1000" value={this.state.maxPrice} onChange={this.maxPriceChanged} placeholder="Maksimihinta" /></td>
					<td><label>&nbsp;<input type="checkbox" onChange={this.nightChanged} checked={!!this.state.night} /> Yömenu</label></td>
					<td><label>&nbsp;<input type="checkbox" onChange={this.onlySetChanged} checked={!!this.state.onlySet} /> Vain ateriat</label></td>
				</tr>
			</table>
		));
		return (<div>
			{controls}
			<div className="row results">
				<table>
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
