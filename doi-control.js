if (Meteor.isClient) {
    Session.set('registeredPiis', []);
    Session.set('isVolume', true);
    Session.set('xml', '');

    Template.home.onRendered(function () {
        if (this.userId) {
            console.log('USER');
            AceEditor.instance('xmlbox', {
                theme: 'dawn',
                mode: 'xml'
            }, function(editor) {
                if(editor){
                    editor.setReadOnly(true);
                    editor.setOptions({
                        maxLines: Infinity,
                        showLineNumbers: false
                    });
                    editor.on('change', function() {
                        Session.set('xml', editor.getValue());
                    });
                }
            });
        }
    });

    Template.form.helpers({
        isVolume: function() {
            return Session.get('isVolume');
        },
        registeredPiis: function() {
            return Session.get('registeredPiis');
        }
    });

    Template.xml.events({
        'click .submit-xml': function(e) {
            var xml = Session.get('xml');
            if (!Meteor.utils.isValidXml(xml)) {
                return Meteor.doi.feedback('Invalid XML');
            }

            e.target.innerText = 'Submitting...';

            Meteor.call('submit_xml', xml, function(err, data) {
                e.target.innerText = 'Submit XML';
                var error = err && err.error || data.error;
                if (err) {
                    return Meteor.doi.feedback(err.error);
                }
                Meteor.doi.feedback('XML Submitted', true);
                Meteor.doi.clearEditor();
            });
        }
    });

    Template.form.events({
        'change .journal': function(e) {
            Session.set('journal', e.target.value);
            Session.set('registeredPiis', []);
        },
        'blur .piilist': function(e) {
            var registeredPiis = Session.get('registeredPiis');
            var blockRequests = Session.get('blockRequests');
            var inputs = e.target.value
                .split(',')
                .map(function(pii) {
                    return pii.trim();
                });

                Meteor.doi.updateRegistered(inputs, registeredPiis);

                inputs
                    .filter(function(pii) {
                        // check that pii has not been loaded
                        return registeredPiis.map(function(item) {
                            return item.pii;
                        }).indexOf(pii) === -1;
                    })
                    .forEach(function(pii) {
                        Meteor.call('checkRegistration', Session.get('journal'), pii, function(err, body) {
                            registeredPiis.push({
                                pii: pii,
                                status: !!(!err && body)
                            });
                            Meteor.doi.updateRegistered(inputs, registeredPiis);
                        });
                    });
        },
        'click .switch': function(e) {
            var isVolumeInverted = Session.get('isVolume') ? false : true;
            e.target.innerText = isVolumeInverted ?
                'Switch to PII submission' :
                'Switch to volume submission';
        },
        'submit .generate-xml-form': function(e) {
            var button = e.target.querySelector('button');
            var journal = e.target.journal.value,
            volume = e.target.volume && e.target.volume.value,
            issue = e.target.issue && e.target.issue.value,
            piilist = e.target.piilist && e.target.piilist.value,
            date = e.target.date.value;
            e.preventDefault();
            button.innerText = 'Generating...';
            piilist ?
                Meteor.call('get_json_and_generate_xml_from_pii_list', journal, piilist, date, cb) :
                Meteor.call('get_json_and_generate_xml', journal, volume, issue, date, cb);

            function cb(err, data) {
                button.innerText = 'Generate submission';
                if (err) {
                    Meteor.doi.feedback(err.error);
                }
                Meteor.doi.loadEditor(data.xml);
                e.target.reset();
            }
        }
    });


    Router.onBeforeAction(function(pause) {
        if (! Meteor.userId()) {
            this.render('login');
            // pause();
        }
        else{
            console.log( Meteor.userId());
            this.next();
        }
    });

    Router.route('/',{
        name: 'home'
    });
    Router.route('/login',{
        name: 'login'
    });
}


Meteor.doi = {
    updateRegistered: function(inputs, registeredPiis) {
        Session.set('registeredPiis', registeredPiis.filter(function(registered) {
            return inputs.indexOf(registered.pii) !== -1;
        }));
    },

    feedback: function(message, success) {
        var $feedback = document.getElementById('feedback');
        $feedback.setAttribute('class', success? 'teal lighten-3 white-text' : 'red lighten-3');
        $feedback.innerText = message;
        setTimeout(function() {
            $feedback.setAttribute('class', '');
            $feedback.innerText = '';
        }, 3000);
    },

    clearEditor: function() {
        AceEditor.instance('xmlbox', null, function(editor) {
            editor.setValue('');
            editor.clearSelection();
            editor.setReadOnly(true);
        });
    },

    loadEditor: function(xml) {
        AceEditor.instance('xmlbox', null, function(editor) {
            editor.setValue(xml);
            editor.clearSelection();
            editor.setReadOnly(false);
            editor.focus();
        });
    }
};
