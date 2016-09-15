var remoteDB = [];
remoteDB['aging'] = new MongoInternals.RemoteCollectionDriver(Meteor.settings.aging_db_url);
remoteDB['oncotarget'] = new MongoInternals.RemoteCollectionDriver(Meteor.settings.oncotarget_db_url);

var Articles = [];
var Issues = [];

Meteor.methods({
    get_journal_json_from_db: function( options) {
        options.volume = Number(options.volume);
        var date_published;

        if(Articles[options.journal] === undefined) {
            Articles[options.journal] = new Mongo.Collection("articles", {
                    _driver: remoteDB[options.journal]
                });
        }

        if(Issues[options.journal] === undefined) {
            Issues[options.journal] = new Mongo.Collection("issues", {
                    _driver: remoteDB[options.journal]
                });
        }

        var articles = Issues[options.journal].find({volume:options.volume, issue:options.issue}).fetch()
            .map(function( issue) {
                return issue._id;
            })
            .map(function( issueId) {
                return Articles[options.journal].find({
                    issue_id: issueId
                });
            })
            .reduce(function( array, cursor) {
                return array.concat(cursor.fetch())
            }, [])
            .map(function( article) {
                date_published = article.dates.epub;
                return {
                    title: article.title,
                    pii: article.ids.pii,
                    date_published: article.dates.epub,
                    first_page: article.page_start,
                    last_page: article.page_end,
                    authors: article.authors ? article.authors.map(function( author) {
                        var first = author.name_first && author.name_first.length > 0 ?
                            author.name_first : undefined;
                        var last = author.name_last && author.name_last.length > 0 ?
                            author.name_last : undefined;
                        return {
                            first_name: first,
                            last_name: last
                        }
                    }) : undefined
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
    get_journal_json_from_db_by_pii: function( piis, journal_name) {


        if(Articles[journal_name] === undefined) {
            Articles[journal_name] = new Mongo.Collection("articles", {
                    _driver: remoteDB[journal_name]
                });
        }

        if(Issues[journal_name] === undefined) {
            Issues[journal_name] = new Mongo.Collection("issues", {
                    _driver: remoteDB[journal_name]
                });
        }

        var date_published;
        var articles = Articles[journal_name].find({
            'ids.pii': {
                '$in': piis.split(',')
            }
        }).fetch().map(function( article) {

                if((article.issue === undefined || article.volume === undefined) && article.issue_id !== undefined) {
                    issue = Issues[journal_name].findOne({_id:article.issue_id});
                    article.volume = issue.volume;
                    article.issue = issue.issue;
                }

            date_published = article.dates.epub;
            return {
                issue: article.issue,
                volume: article.volume,
                title: article.title,
                pii: article.ids.pii,
                date_published: article.dates.epub,
                first_page: article.page_start,
                last_page: article.page_end,
                authors: article.authors ? article.authors.map(function( author) {
                    var first = author.name_first && author.name_first.length > 0 ? author.name_first : undefined;
                    var last = author.name_last && author.name_last.length > 0 ? author.name_last : undefined;
                    return {
                        first_name: first,
                        last_name: last
                    }
                }) : undefined
            }
        });

        if (articles.length === 0) {
            throw new Meteor.Error(404, 'not found');
        }
        var issueData = articles.reduce(function( issueData, article) {
            issueData.issue = issueData.issue || article.issue;
            issueData.volume = issueData.volume || article.volume;
            if (issueData.issue !== article.issue || issueData.volume !== article.volume) {
                throw new Meteor.Error(400, 'piis must be from same issue');
            }
            return issueData;
        }, {})

        return {
            articles: articles,
            issue: {
                number: issueData.issue,
                volume: issueData.volume,
                date_published: date_published
            }
        }
    },
    get_journal_json: function( volume, issue, journal_name) {
        journal_name = journal_name || "oncotarget";
        var url = "http://impactjournals.com/doi-control/?journal=" + journal_name + "&v=" + volume + "&i=" + issue;
        var result = Meteor.http.get(url, {
            timeout: 300000
        });
        if (result.statusCode == 200) {
            var json_response = JSON.parse(result.content);
            return json_response;
        } else {
            var error_json = JSON.parse(result.content);
            throw new Meteor.Error(result.statusCode, error_json.error);
        }
    },
    get_journal_json_by_pii: function( pii_csv, journal_name) {
        journal_name = journal_name || "oncotarget";
        var url = "http://impactjournals.com/doi-control/?journal=" + journal_name + "&pii=" + pii_csv;
        var result = Meteor.http.get(url, {
            timeout: 300000
        });
        if (result.statusCode == 200) {
            var json_response = JSON.parse(result.content);
            return json_response;
        } else {
            var error_json = JSON.parse(result.content);
            throw new Meteor.Error(result.statusCode, error_json.error);
        }
    }
});
