Meteor.methods({
  submit_xml: function(xml, test) {
    var baseUrl = 'https://api.crossref.org';
    var options = {
      headers: {
        'Authorization': 'Basic ' + Base64.encode(Meteor.settings.cr_cred_un + ':' + Meteor.settings.cr_cred_pw),
        'Content-Type': 'application/vnd.crossref.deposit+xml'
      },
      content: xml
    };
    var encoded_pingback = encodeURIComponent('doi.oncotarget.com/deposit_pingback');
    var path = baseUrl + '/deposits?' + (test ? 'test=true&' : '') + 'pingback=' + encoded_pingback;
    try {
      response = Meteor.http.call('POST', path, options);
    } catch (err) {
      return {
        error: baseUrl + ' says ' + err.message
      };
    }
    return {
      code: response && response.statusCode,
      location: response && response.headers && response.headers.location || ''
    }
  }
})
