Meteor.methods({
	generate_xml_from_json: function(journal_name, journal_json) {
		var js2xmlparser = Meteor.npmRequire("js2xmlparser");

		var crossref_json = Meteor.call("massage_json_to_crossref_schema", journal_name, journal_json);

		var batch_id = DOIBatches.insert({crossref_data:crossref_json});
		crossref_json.head.doi_batch_id = batch_id;
		var xml_from_json = js2xmlparser("doi_batch", crossref_json);

		return {
			json_string: JSON.stringify(crossref_json),
			xml: xml_from_json
		};
	},
	get_json_and_generate_xml: function(journal_name, volume, issue, date) {
		var journal_json;

		if (journal_name === 'aging') {
			journal_json = Meteor.call("get_journal_json_from_db", {
				volume: volume,
				issue: issue
			});
		} else {
			journal_json = Meteor.call("get_journal_json", volume, issue, journal_name);
		}

		date = date || journal_json.issue.date_published || Date.now();
		var crossref_json = Meteor.call("massage_json_to_crossref_schema", journal_name, journal_json, date);

		var batch_id = DOIBatches.insert({crossref_data:crossref_json});
		crossref_json.head.doi_batch_id = batch_id;

		var js2xmlparser = Meteor.npmRequire("js2xmlparser");
		var xml_from_json = js2xmlparser("doi_batch", crossref_json);

		return {
			json_string: JSON.stringify(crossref_json),
			xml: xml_from_json
		};
	},
	get_json_and_generate_xml_from_pii_list: function(journal_name, pii_list, date) {
		var journal_json;
		if (journal_name === 'aging') {
			journal_json = Meteor.call("get_journal_json_from_db_by_pii", pii_list);
		} else {
			journal_json = Meteor.call("get_journal_json_by_pii", pii_list, journal_name);
		}
		date = date || Date.now();
		var crossref_json = Meteor.call("massage_json_to_crossref_schema", journal_name, journal_json, date);

		var batch_id = DOIBatches.insert({crossref_data:crossref_json});
		crossref_json.head.doi_batch_id = batch_id;

		var js2xmlparser = Meteor.npmRequire("js2xmlparser");
		var xml_from_json = js2xmlparser("doi_batch", crossref_json);

		return {
			json_string: JSON.stringify(crossref_json),
			xml: xml_from_json
		};
	},
	massage_json_to_crossref_schema: function(journal_name, json_data, date) {
		function generate_personnames(name_info_array) {
			if(name_info_array == void 0 || name_info_array.length == 0) return null;
			var personnames = [];
			for (var i = 0; i < name_info_array.length; i++) {
				var fn = name_info_array[i].first_name;
				var mn = name_info_array[i].middle_name;
				var ln = name_info_array[i].last_name;

				var mn_exists = (mn != void 0 && mn != null && mn != "");

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
			if(datestring == void 0) return null;
			var date = new Date(datestring);
			var localTimeDate = new Date(date.getTime() + (date.getTimezoneOffset() * 60000));

			var pubdate_oject = {
				"@": {
					media_type: "online"
				},
				month: localTimeDate.getMonth()+1,
				day: localTimeDate.getDate(),
				year: localTimeDate.getFullYear()
			}
			return pubdate_oject;
		}

		function fix_allowed_tags(str) {
            if(typeof str !== 'string') return '';
			re_em = /<(\/?)em\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
			re_strong = /<(\/?)strong\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
			return str.replace(re_em, "<$1i>").replace(re_strong, "<$1b>");
		}

		var timestamp = Date.now();
		var metadata = {
			"oncotarget": {
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
				}
//				,doi_data: {
//					doi: "10.18632/oncotarget",
//					timestamp: timestamp,
//					resource: "http://oncotarget.com"
//				}
			},
			"oncoscience": {
				"@": {
					language: "en"
				},
				full_title: "Oncoscience",
				abbrev_title: "Oncoscience",
				issn: {
					"@": {
						media_type: "electronic"
					},
					"#": "2331-4737"
				}
//				,doi_data: {
//					doi: "10.18632/oncoscience",
//					timestamp: timestamp,
//					resource: "http://impactjournals.com/oncoscience/"
//				}
			},
			"genesandcancer": {
				"@": {
					language: "en"
				},
                full_title: "Genes & Cancer",
				abbrev_title: "genesandcancer",
				issn: {
					"@": {
						media_type: "electronic"
					},
					"#": "1947-6027"
				}
			},
//				,doi_data: {
//					doi: "10.18632/genesandcancer",
//					timestamp: timestamp,
//					resource: "http://www.impactjournals.com/genesandcancer/"
//				}
			"aging": {
				"@": {
					language: "en"
				},
                full_title: "Aging",
				abbrev_title: "aging",
				issn: {
					"@": {
						media_type: "electronic"
					},
					"#": "1945-4589"
				}
			}
		};

		if(metadata[journal_name] == void 0) {
			throw new Meteor.Error(500, "Incorrect journal_name passed to generate_xml: "+journal_name);
		}

		var top_level = {
			"@": {
				version: "4.3.6",
				xmlns: "http://www.crossref.org/schema/4.3.6",
				"xmlns:xsi" : "http://www.w3.org/2001/XMLSchema-instance",
				"xsi:schemaLocation": "http://www.crossref.org/schema/4.3.6 http://www.crossref.org/schemas/crossref4.3.6.xsd"
			},
			head: {
				doi_batch_id: "",
				timestamp: timestamp,
				depositor: {
					depositor_name: "Impact Journals",
					email_address: Meteor.settings.reports_email
				},
				registrant: "Impact Journals"
			},
			body: {
				journal: {
					journal_metadata: metadata[journal_name]
				}
			}
		};

		if(json_data.issue !== undefined && json_data.issue != void 0 && json_data.issue.number > 0) {
				if(journal_name == "aging") {
					top_level['body']['journal']['journal_issue'] = {
						publication_date: (function(){
							var usedate = date;
							if(json_data.issue.date_published && json_data.issue.date_published != "") usedate = json_data.issue.date_published;
							return generate_publication_date(usedate);
						})(),
						journal_volume: {
							volume: json_data.issue.volume
						},
						issue: json_data.issue.number,
						doi_data: {
							doi: "10.18632/aging.v"+json_data.issue.volume+"i"+json_data.issue.number,
							resource: "http://impactaging.com/contents?volumeId=" + json_data.issue.volume + "&issueId=" + json_data.issue.number
						}
					}
				}

				if(journal_name == "oncoscience") {
					top_level['body']['journal']['journal_issue'] = {
						publication_date: (function(){
							var usedate = date;

							if(json_data.issue.date_published && json_data.issue.date_published != "") {
                                usedate = json_data.issue.date_published;
                            }
							return generate_publication_date(usedate);


//							var artpubdate = json_data.articles[json_data.articles.length - 1].date_published;
//							if(artpubdate && artpubdate != "") usedate = artpubdate;
//							return generate_publication_date(usedate);
						})(),
						journal_volume: {
							volume: json_data.issue.volume_idvolume
						},
						issue: json_data.issue.number,
						doi_data: {
							doi: "10.18632/oncoscience.v"+json_data.issue.volume_idvolume+"i"+json_data.issue.num,
							resource: "http://impactjournals.com/oncoscience/index.php?issue="+json_data.issue.idissues
						}
					};
				}
				if(journal_name == "oncotarget") {
					top_level['body']['journal']['journal_issue'] = {
						publication_date: (function(){
							var usedate = date;
							if(json_data.issue.date_published && json_data.issue.date_published != "") usedate = json_data.issue.date_published;
							return generate_publication_date(date);
						})(),
						journal_volume: {
							volume: json_data.issue.volume
						},
						issue: json_data.issue.number,
						doi_data: {
							doi: "10.18632/oncotarget.v"+json_data.issue.volume+"i"+json_data.issue.number,
							resource: "http://oncotarget.com/issue/v"+json_data.issue.volume+"i"+json_data.issue.number
						}
					}
				}
				if(journal_name == "genesandcancer") {
					top_level['body']['journal']['journal_issue'] = {
						publication_date: (function(){
							var usedate = date;
							if(json_data.issue.date_published && json_data.issue.date_published != "") usedate = json_data.issue.date_published;
							return generate_publication_date(usedate);
						})(),
						journal_volume: {
							volume: json_data.issue.volume
						},
						issue: json_data.issue.number,
						doi_data: {
							doi: "10.18632/genesandcancer.v"+json_data.issue.volume+"i"+json_data.issue.number,
							resource: "http://impactjournals.com/Genes&Cancer/index.php?issue="+json_data.issue.idissues
						}
					}
				}
		}

		top_level['body']['journal']['journal_article'] = [];
		for (var i = 0; i < json_data.articles.length; i++) {
			var current_article_data = json_data.articles[i];
			if(journal_name == 'aging') {
                var article_doi = "10.18632/aging."+current_article_data.pii;
                var article_url = "http://impactaging.com/papers/v" + json_data.issue.volume + "/n" + json_data.issue.number + "/full/" + current_article_data.pii + ".html";
            }
            else if(journal_name == 'oncotarget') {
                var sub_type_for_url = ((current_article_data.full_text_available||current_article_data.pdf_available) ? "fulltext" : "abstract");
                var article_doi = "10.18632/oncotarget."+current_article_data.pii;
                var article_url = "http://www.oncotarget.com/"+sub_type_for_url+"/"+current_article_data.pii
            }
            else if(journal_name == 'oncoscience') {
                var article_doi = "10.18632/oncoscience."+current_article_data.pii;
                var article_url = "http://impactjournals.com/oncoscience/index.php?abs="+current_article_data.pii;
            }
			else if(journal_name == 'genesandcancer') {
                var article_doi = "10.18632/genesandcancer."+current_article_data.pii;
                var article_url = "http://www.impactjournals.com/genesandcancer/index.php?abs="+current_article_data.pii;
            }
			var new_article_element = {
				"@": {
					publication_type: ((current_article_data.full_text_available||current_article_data.pdf_available) ? "full_text" : "abstract_only")
				},
				titles: {
					title: fix_allowed_tags(current_article_data.title)
				},
				contributors: (current_article_data.authors != void 0)?({
					person_name: generate_personnames(current_article_data.authors)
				}):null,
				publication_date: (function(){
					var usedate = date;
					if(current_article_data.date_published === null || current_article_data.date_published == '') {
                        usedate = date;
                    }
					if(current_article_data.date_published && current_article_data.date_published != "") usedate = current_article_data.date_published;
					return generate_publication_date(usedate);
				})(),
				pages: (function(){
					if(current_article_data.first_page == void 0 || current_article_data.first_page == "") return null;
					var pgs = {};
					if(current_article_data.first_page != void 0) pgs['first_page'] = current_article_data.first_page;
					if(current_article_data.last_page != void 0) pgs['last_page'] = current_article_data.last_page;
					return pgs;
				})(),
				publisher_item: {
					identifier: {
						"@": {
							id_type: "pii"
						},
						"#": current_article_data.pii
					}
				},
				doi_data: {
					doi: article_doi,
					timestamp: timestamp,
					resource: article_url
				}
			};

			for(var key in new_article_element) {
				if(new_article_element[key] == null) delete new_article_element[key];
			}

			top_level.body.journal.journal_article.push(new_article_element);
		}

		return top_level;
	}
})
