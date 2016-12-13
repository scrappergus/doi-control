Meteor.methods({
  submit_JSON_string_as_XML: function(jsonString, test) {
    var js2xmlparser = Meteor.npmRequire('js2xmlparser');
    var xml = js2xmlparser('doi_batch', JSON.parse(jsonString));
    return Meteor.call('submit_xml', xml, test);
  },

//  submit_xml: function(xml, test) {
//    var baseUrl = 'https://api.crossref.org';
//    var options = {
//      headers: {
//        'Authorization': 'Basic ' + Base64.encode(Meteor.settings.cr_cred_un + ':' + Meteor.settings.cr_cred_pw),
//        'Content-Type': 'application/vnd.crossref.deposit+xml'
//      },
//      content: xml
//    };
//    var encoded_pingback = encodeURIComponent('doi.oncotarget.com/deposit_pingback');
//    var path = baseUrl + '/deposits?' + (test ? 'test=true&' : '') + 'pingback=' + encoded_pingback;
//    try {
//        console.log(path);
//        console.log(options);
//      response = Meteor.http.call('POST', path, options);
//    } catch (err) {
//        console.error(err);
//      return {
//        error: baseUrl + ' says ' + err.message
//      };
//    }
//    return JSON.stringify(response);
////    return {
////      code: response && response.statusCode,
////      location: response && response.headers && response.headers.location || ''
////    }
//  }
  submit_xml: function(xml, test) {
    var baseUrl = 'https://doi.crossref.org/servlet/deposit/';
    var options = {
        'params':{
            'operation':'doMDUpload',
            'login_id':'login_id',
            'login_passwd':'password'
        },
        content: xml
    };
    var encoded_pingback = encodeURIComponent('doi.oncotarget.com/deposit_pingback');
    var path = baseUrl;// + '/deposits?' + (test ? 'test=true&' : '') + 'pingback=' + encoded_pingback;
    try {
        console.log(path);
        console.log(options);
      response = Meteor.http.call('POST', path, options);
    } catch (err) {
        console.error(err);
      return {
        error: baseUrl + ' says ' + err.message
      };
    }
    return JSON.stringify(response);
//    return {
//      code: response && response.statusCode,
//      location: response && response.headers && response.headers.location || ''
//    }
  }

})
