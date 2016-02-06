DepositPingbacks = new Mongo.Collection("deposit_pingbacks");

if (Meteor.isClient) {

  function submit_pii_list(e, json_cb) {
    var journalname = e.target.querySelector('[name="journalname"]').value;
    var piilist = e.target.querySelector('[name="piilist"]').value;
    var date = e.target.querySelector('[name="date"]').value;

    // temp. "responsive ui"
    var formButton = e.target.querySelector("button");
    formButton.innerText = "Generating...";
    formButton.disabled = true;


    Meteor.call("get_json_and_generate_xml_from_pii_list", journalname, piilist, date, json_cb);
  }

  function submit_volume(e, json_cb) {
    var journalname = e.target.querySelector('[name="journalname"]').value;
    var volume = e.target.querySelector('[name="volume"]').value;
    var issue = e.target.querySelector('[name="issue"]').value;
    var date = e.target.querySelector('[name="date"]').value;

    // temp. "responsive ui"
    var formButton = e.target.querySelector("button");
    formButton.innerText = "Generating...";
    formButton.disabled = true;


    Meteor.call("get_json_and_generate_xml", journalname, volume, issue, date, json_cb);
  }

  window.app_data = {};

  Session.set("submission_type", "volissue");

  UI.registerHelper("submission_type", function(t) {
    return Session.get("submission_type") == t;
  });

  Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
  });

  Template.form_volissue.rendered = Template.form_pii.rendered = function() {
    document.querySelector("input[type=date]").value = new Date().toDateInputValue();
  }

  Template.generator_form.events({
    'click button#submission-type-switch': function(e) {
      var curtype = Session.get("submission_type");
      if (curtype == "volissue") {
        e.target.innerText = "Switch to Volume submission";
        Session.set("submission_type", "pii");
      } else {
        e.target.innerText = "Switch to PII submission";
        Session.set("submission_type", "volissue");
      }
    },
    'submit form': function(e) {
      e.preventDefault();

      var formButton = e.target.querySelector("button");
      var json_cb = function(err, data) {
        // temp. "responsive ui"
        formButton.innerText = "Generate XML";
        formButton.disabled = false;
        if (err) {
          console.error(err);
          alert(err);
        } else {
          window.app_data['json_data_string'] = data.json_string;
          $('#resp-xml').removeClass('hide');
          $("#xmlbox").html(data.xml.replace(/</g, '&lt;'));
          $('code').each(function(i, block) {
            hljs.highlightBlock(block);
          })
          $('.submitJSONasXML').css('display', 'block');
          $('.submitJSONasXML').each(function(i, submitButton) {
            submitButton.innerText = "Submit XML";
            submitButton.disabled = false;
          });
          $(".xml-textarea").click(function() {
            var $this = $(this);
            $this.select();
            // Work around Chrome's little problem
            $this.mouseup(function() {
              // Prevent further mouseup intervention
              $this.unbind("mouseup");
              return false;
            });
          });
        }
      }

      var curtype = Session.get("submission_type");
      if (curtype == "volissue") submit_volume(e, json_cb);
      else submit_pii_list(e, json_cb);
    },
    'click button.submitJSONasXML': function(e) {
      $('.submitJSONasXML').each(function(i, submitButton) {
        submitButton.innerText = "Submitting...";
        submitButton.disabled = true;
      });

      Meteor.call("submit_JSON_string_as_XML", window.app_data.json_data_string, function(err, data) {
        if (err) {
          console.error(err);
        } else {
          var statusLinkNode = document.createElement("a");
          statusLinkNode.href = "http://api.crossref.org" + data.location;
          statusLinkNode.innerText = "Deposit status: " + data.location;
          document.getElementById("submissionLink").appendChild(statusLinkNode);
        }
        $('.submitJSONasXML').each(function(i, submitButton) {
          submitButton.innerText = "Submitted";
          submitButton.disabled = true;
        });
      });
    }
  });

  Template.awareness.pings = function() {
    var rawPings = DepositPingbacks.find({});
    var stringPings = [];
    rawPings.forEach(function(o) {
      stringPings.push({
        request: JSON.stringify(o.request)
      });
    });
    return stringPings;
  }

  Router.route("/", function() {
    this.render("home");
  });
  Router.route("/awareness", function() {
    this.render("awareness");
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    // code to run on server at startup
  });
}
