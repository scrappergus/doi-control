Meteor.methods({
	get_journal_json_from_db: function(options) {
		var query = {};
		if (options.volume) query.volume = Number(options.volume);
		if (options.issue) query.issue = options.issue;
		if (options.piis) query['ids.pii'] = {'$in': options.piis.split(',')}
		var articles = Articles.find(query).fetch().map(function(article) {
			date_published = article.dates.epub;
			return {
				title: article.title,
				pii: article.ids.pii,
				date_published: article.dates.epub,
				first_page: article.page_start,
				last_page: article.page_end,
				authors: article.authors? article.authors.map(function(author) {
					var first = author.name_first && author.name_first.length > 0? author.name_first: undefined;
					var last = author.name_last && author.name_last.length > 0? author.name_last: undefined;
					return {
						first_name: first,
						last_name: last
					}
				}): undefined
			}
		});
	
		if (articles.length === 0) {
			throw new Meteor.Error(404, 'not found');
		}

		return {
			articles: articles,
			issue: {
				number: options.issue,
				volume: options.volume,
				date_published: date_published
			}
		}
	},
	get_journal_json: function(volume, issue, journal_name) {
		journal_name = journal_name || "oncotarget";
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
		journal_name = journal_name || "oncotarget";
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
});

