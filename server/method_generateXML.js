Meteor.methods({
	generate_xml: function(volume, issue) {
		var js2xmlparser = Meteor.npmRequire("js2xmlparser");

		function generate_personnames(name_info_array) {
			var personnames = [];
			for (var i = 0; i < name_info_array.length; i++) {
				var fn = name_info_array[i].first_name;
				var mn = name_info_array[i].middle_name;
				var ln = name_info_array[i].last_name;

				var mn_exists = (mn != void 0 && mn != "");

				var pn = {
					"@": {
						sequence: (i==0 ? "first" : "additional"),
						contributor_role: "author"
					},
					given_name: fn+(mn_exists ? " "+mn : ""), // first name + middle name (only if it exists)
					surname: ln
				};

				personnames.push(pn);
			}

			return personnames;
		}

		function generate_publication_date(datestring) {
			var date = new Date(datestring);
			var localTimeDate = new Date(date.getTime() + (date.getTimezoneOffset() * 6000));
			var pubdate_oject = {
				year: localTimeDate.getFullYear(),
				month: localTimeDate.getMonth(),
				day: localTimeDate.getDay()
			}
			return pubdate_oject;
		}

		function massage_json_to_crossref_schema(json_data) {
			var timestamp = Date.now();
			var top_level = {
				"@": {
					version: "4.3.6",
					xmlns: "http://www.crossref.org/schema/4.3.6",
					"xmlns:xsi" : "http://www.w3.org/2001/XMLSchema-instance",
					"xsi:schemaLocation": "http://www.crossref.org/schema/4.3.6 http://www.crossref.org /schema/4.3.6/crossref.xsd"
				},
				head: {
					timestamp: timestamp,
					depositor: {
						depositor_name: "Impact Journals",
						email_address: "support@oncotarget.com"
					},
					registrant: "Impact Journals",
					doi_batch_id: ""
				},
				body: {
					journal: {
						journal_metadata: {
							"@": {
								language: "en"
							},
							full_title: "Oncotarget",
							abbrev_title: "Oncotarget",
							issn: {
								"@": {
									media_type: "electronic"
								},
								"#": "1949-2553"
							},
							doi_data: {
								doi: "10.18632.oncotarget",
								timestamp: timestamp,
								resource: "http://oncotarget.com"
							}
						},
						journal_issue: {
							journal_volume: {
								volume: json_data.issue.volume
							},
							issue: json_data.issue.number,
							publication_date: generate_publication_date(json_data.issue.date_published),
							doi_data: {
								doi: "10.18632.oncotarget.v"+json_data.issue.volume+"i"+json_data.issue.number,
								resource: "http://oncotarget.com/issue/v"+json_data.issue.volume+"i"+json_data.issue.number
							}
						},
						journal_article: []
					}
				}
			};

			for (var i = 0; i < json_data.articles.length; i++) {
				var current_article_data = json_data.articles[i];
				var new_article_element = {
					"@": {
						publication_type: (current_article_data.full_text_available ? "full_text" : "abstract_only")
					},
					titles: {
						title: current_article_data.title
					},
					contributors: {
						person_name: generate_personnames(current_article_data.authors)
					},
					publication_date: generate_publication_date(current_article_data.issue_pubdate),
					pages: {
						first_page: current_article_data.first_page,
						last_page: current_article_data.last_page
					},
					doi_data: {
						doi: "10.18632.oncotarget."+current_article_data.pii,
						timestamp: timestamp,
						resource: "http://oncotarget.com/abstract/"+current_article_data.pii
					},
					publisher_item: {
						identifier: {
							"@": {
								id_type: "pii"
							},
							"#": current_article_data.pii
						}
					}
				};

				top_level.body.journal.journal_article.push(new_article_element);
			}

			return top_level;
		}

		var journal_json = Meteor.call("get_journal_json", volume, issue);
		var massaged_json = massage_json_to_crossref_schema(journal_json);
		var batch_id = DOIBatches.insert({crossref_data:massaged_json});
		massaged_json.head.doi_batch_id = batch_id;
		var xml_from_json = js2xmlparser("doi-batch", massaged_json);

		return {
			json_string: JSON.stringify(massaged_json),
			xml: xml_from_json
		};
	}
})
