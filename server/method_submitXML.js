Meteor.methods({
	submit_JSON_string_as_XML: function(json_string) {
		var js2xmlparser = Meteor.npmRequire("js2xmlparser");

		var xml_from_json = js2xmlparser("doi-batch", JSON.parse(json_string));

		var options = {
			headers: {
				"Authorization": "Basic " + Base64.encode(Meteor.settings.cr_cred_un + ":" + Meteor.settings.cr_cred_pw),
				"Content-Type": "application/vnd.crossref.deposit+xml"
			},
			content: xml_from_json
		};

		var encoded_pingback = encodeURIComponent("doi.oncotarget.com/deposit_pingback");
		var response = Meteor.http.call("POST", "https://api.crossref.org/deposits?pingback="+encoded_pingback, options);

		return {
			code: response.statusCode,
			location: (response.headers.location || "")
		};
	}
})
