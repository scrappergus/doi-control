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
    /*
      NOTE
      If you need to debug this, read on, the api server has been finicky about requests.

      From their docs at https://support.crossref.org/hc/en-us/articles/214960123-Using-HTTPS-to-POST-Files
      they suggest a curl command to use to peform the request, for our purposes that can be modifed to the below
      where the generated xml has been saved to a file in your working dir named 'myxml.xml' (and credentials added to the command)

        curl -v -F 'operation=doMDUpload' -F 'login_id=Meteor.settings.cr_cred_un' -F 'login_passwd=Meteor.settings.cr_cred_pw' -F 'fname=@myxml.xml' https://doi.crossref.org/servlet/deposit

      With that request run against an http-echo-server (like below), you can see it's posted successfully,
        and confirm that this code is submitting requests in a similar fashion
    */

    // var baseUrl = 'http://localhost:8081/servlet/deposit'; //running http-server-echo locally .. https://www.npmjs.com/package/http-echo-server

    // var baseUrl = 'https://test.crossref.org/servlet/deposit';
    var baseUrl = 'https://doi.crossref.org/servlet/deposit';

    var formdata = {
      'operation':'doMDUpload',
      'login_id': Meteor.settings.cr_cred_un,
      'login_passwd': Meteor.settings.cr_cred_pw,
      files: {
        value: xml,
        options: {
          filename: 'content.xml',
          contentType: 'application/xml',
          contentLength: xml.length,
        },
      },
    };
    
    var options = {
      'npmRequestOptions': {
        'body': null,
        formData: formdata,
      },
    };
    var encoded_pingback = encodeURIComponent('doi.oncotarget.com/deposit_pingback');
    var path = baseUrl;// + '/deposits?' + (test ? 'test=true&' : '') + 'pingback=' + encoded_pingback;
    var response;
    try {
      response = Meteor.http.call('POST', path, options);
    } catch (err) {
      console.error(err);
      return {
        error: baseUrl + ' says ' + err.message
      };
    }

    var ret = JSON.stringify(response);
    console.log( baseUrl, ret );

    return ret;
//    return {
//      code: response && response.statusCode,
//      location: response && response.headers && response.headers.location || ''
//    }
  }

})
