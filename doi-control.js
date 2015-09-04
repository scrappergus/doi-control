if (Meteor.isClient) {

Template.generator_form.events({
    'submit form': function (e) {
        e.preventDefault();
        var volume = e.target.querySelector('[name="volume"]').value;
        var issue = e.target.querySelector('[name="issue"]').value;

        Meteor.call("generate_xml", volume, issue, function(err, data){
            if(err) {
                console.error(err);
            } else {
                var xmlTextNode = document.createTextNode(data);
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
