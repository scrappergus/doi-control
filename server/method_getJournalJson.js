Meteor.methods({
	get_journal_json: function(volume, issue) {
		var url = "http://www.impactjournals.com/doi-control/?v="+volume+"&i="+issue;
		var result = Meteor.http.get(url, {timeout: 300000});
		if(result.statusCode==200) {
			var json_response = JSON.parse(result.content);
			return json_response;
		} else {
			var error_json = JSON.parse(result.content);
			throw new Meteor.Error(result.statusCode, errorJson.error);
		}
	}
})
