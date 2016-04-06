Meteor.methods({
  checkRegistration: function(journal, pii) {
  	var doi = journal + '.' + pii;
  	try {
    	return Meteor.http.call("GET", "http://api.crossref.org/works/10.18632/" + doi);
  	} catch (e) {
  		return;
  	}
  }
});