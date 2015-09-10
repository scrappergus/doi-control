HTTP.methods({
	'/deposit_pingback': {
		post: function (d) {
			console.log(d);
			var data = {
				requestHeaders: this.requestHeaders,
				method: this.method,
				query: this.query,
				data: d
			};
			DepositPingbacks.insert({"request": data});
			this.setStatusCode(200);
		}
	}
});
