Meteor.methods({
	get_journal_json: function(volume, issue, journal_name) {
		if(journal_name == void(0)) journal_name = "oncotarget";
		var url = "http://impactjournals.com/doi-control/?journal="+journal_name+"&v="+volume+"&i="+issue;
		var result = Meteor.http.get(url, {timeout: 300000});
		if(result.statusCode==200) {
			var json_response = JSON.parse(result.content);
			return json_response;
		} else {
			var error_json = JSON.parse(result.content);
			throw new Meteor.Error(result.statusCode, error_json.error);
		}
	},
	get_journal_json_by_pii: function(pii_csv, journal_name) {
		if(journal_name == void(0)) journal_name = "oncotarget";
		var url = "http://impactjournals.com/doi-control/?journal="+journal_name+"&pii="+pii_csv;
		var result = Meteor.http.get(url, {timeout: 300000});
		if(result.statusCode==200) {
			var json_response = JSON.parse(result.content);
			return json_response;
		} else {
			var error_json = JSON.parse(result.content);
			throw new Meteor.Error(result.statusCode, error_json.error);
		}
	}
})
