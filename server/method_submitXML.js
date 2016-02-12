Meteor.methods({
  submit_xml: function(xml, test) {
    var options = {
      headers: {
        "Authorization": "Basic " + Base64.encode(Meteor.settings.cr_cred_un + ":" + Meteor.settings.cr_cred_pw),
        "Content-Type": "application/vnd.crossref.deposit+xml"
      },
      content: xml
    };

    var encoded_pingback = encodeURIComponent("doi.oncotarget.com/deposit_pingback");
    var response = Meteor.http.call("POST", "https://api.crossref.org/deposits?" + (test ? "test=true&" : "") + "pingback=" + encoded_pingback, options);

    return {
      code: response.statusCode,
      location: (response.headers.location || "")
    };
  }
})
