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
                $('#msg-error').removeClass('hide');
                $('#msg-error > .badge').html('<h4>'+err.message+'</h4>');
            } else {
                var containNode = document.createElement("div");
                var statusLinkNode = document.createElement("a");
                statusLinkNode.href = "http://api.crossref.org" + data.location;
                statusLinkNode.innerText = "Deposit status: " + data.location;
                var xmlTextNode = document.createTextNode("\n\n" + data.xml);
                containNode.appendChild(statusLinkNode);
                containNode.appendChild(xmlTextNode);
                $('#resp-xml').removeClass('hide');
                document.getElementById("xmlbox").innerHTML = containNode.innerHTML;
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
