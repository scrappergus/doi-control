HTTP.methods({
	'/submit_pii/:journal_name/:piis': function() {
		var url = "http://impactjournals.com/doi-control/?journal="+this.params.journal_name+"&pii="+this.params.piis;
		var result = Meteor.http.get(url, {timeout: 300000});
		if(result.statusCode==200) {
			var generated_data = Meteor.call("generate_xml_from_json", this.params.journal_name, JSON.parse(result.content));
			var test = (this.query != void 0);
			var submission_result = Meteor.call("submit_JSON_string_as_XML", generated_data.json_string, test);
			return submission_result;
		} else {
			throw new Meteor.Error(result.statusCode, result.content);
		}
	}
});
