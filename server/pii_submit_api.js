HTTP.methods({
	'/submit_pii/:journal_name/:piis': function() {
		var url = "http://impactjournals.com/doi-control/?journal="+this.params.journal_name+"&pii="+this.params.piis;
		var result = Meteor.http.get(url, {timeout: 300000});
		if(result.statusCode==200) {
            var journal_json = JSON.parse(result.content);
            if(this.query.epub !== undefined) {
                for(var i = 0; i<journal_json.articles.length; i++) {
                    if(journal_json.articles[i].pii == this.params.piis) {
                        journal_json.articles[i].date_published = moment.unix((this.query.epub/1000)).format('MMMM D, YYYY');
                    }
                }
            }
			var generated_data = Meteor.call("generate_xml_from_json", this.params.journal_name, journal_json);
			var test = (this.query.test != void 0 && this.query.test == "true");
			var submission_result = Meteor.call("submit_JSON_string_as_XML", generated_data.json_string, test);
			this.addHeader("Access-Control-Allow-Origin", "*");
			return submission_result;
		} else {
			throw new Meteor.Error(result.statusCode, result.content);
		}
	}
});
