Meteor.methods({
  checkRegistration: function(journal, pii) {
    var article = collections[journal].Articles.findOne({'ids.pii' : pii});
    if (!article) {
    	return;
    }
    var doiUrl = article.ids.doi.match(/http:\/\/[^\/]*\/(.*)/);
    console.log('>>> doiUrl:', doiUrl);
    return Meteor.http.call("GET", "http://api.crossref.org/works/" + doiUrl);
  }
});