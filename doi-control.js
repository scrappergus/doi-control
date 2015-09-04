if (Meteor.isClient) {

Template.generator_form.events({
    'submit form': function (e) {
        e.preventDefault();
        var volume = e.target.querySelector('[name="volume"]').value;
        var issue = e.target.querySelector('[name="issue"]').value;

        // temp. "responsive ui"
        var formButton = e.target.querySelector("button");
        formButton.innerText = "Generating & uploading...";
        formButton.disabled = true;

        Meteor.call("generate_xml", volume, issue, function(err, data){

            // temp. "responsive ui"
            formButton.innerText = "Generate & (test) Submit XML";
            formButton.disabled = false;

            if(err) {
                console.error(err);
            } else {
                var statusLinkNode = document.createElement("a");
                statusLinkNode.href = "http://api.crossref.org" + data.location;
                statusLinkNode.innerText = "Deposit status: " + data.location;
                var xmlTextNode = document.createTextNode("\n\n" + data.xml);
                document.getElementById("xmlbox").appendChild(statusLinkNode);
                document.getElementById("xmlbox").appendChild(xmlTextNode);
            }
        });
    }
  });

}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
