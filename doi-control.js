if (Meteor.isClient) {

window.app_data = {};

Template.generator_form.events({
    'submit form': function (e) {
        e.preventDefault();
        var volume = e.target.querySelector('[name="volume"]').value;
        var issue = e.target.querySelector('[name="issue"]').value;

        // temp. "responsive ui"
        var formButton = e.target.querySelector("button");
        formButton.innerText = "Generating...";
        formButton.disabled = true;

        Meteor.call("generate_xml", volume, issue, function(err, data){

            // temp. "responsive ui"
            formButton.innerText = "Generate XML";
            formButton.disabled = false;
            if(err) {
                console.error(err);
                $('#msg-error').removeClass('hide');
                $('#msg-error > .badge').html('<h4>'+err.message+'</h4>');
            } else {
                window.app_data['json_data_string'] = data.json_string;
                var containNode = document.createElement("div");
                var xmlTextNode = document.createTextNode("\n\n" + data.xml);
                containNode.appendChild(xmlTextNode);
                $('#resp-xml').removeClass('hide');
                document.getElementById("xmlbox").innerHTML = containNode.innerHTML;
                document.getElementById("submitJSONasXML").style.display = "block";
            }
        });
    },
    'click button#submitJSONasXML': function (e) {
        Meteor.call("submit_JSON_string_as_XML", window.app_data.json_data_string, function(err, data) {
            if(err) {
                console.error(err);
            } else {
                var statusLinkNode = document.createElement("a");
                statusLinkNode.href = "http://api.crossref.org" + data.location;
                statusLinkNode.innerText = "Deposit status: " + data.location;
                document.getElementById("submissionLink").appendChild(statusLinkNode);
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
