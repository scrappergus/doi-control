//HTTP.methods({'/submit_pii/:journal_name/:piis': function() {
//        var test = (this.query.test != void 0 && this.query.test == "true");
//        var http = this;
//        Meteor.call('get_json_and_generate_xml_from_pii_list', this.params.journal_name, this.params.piis, function(err, data) {
//                Meteor.call("submit_xml", data.xml, test, function(data) {
//                        http.addHeader("Access-Control-Allow-Origin", "*");
//                        return submission_result;
//                    });
//            })
//	}
//});
