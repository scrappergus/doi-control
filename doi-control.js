if (Meteor.isClient) {
  Session.set('isVolume', true)
  Session.set('xml', '')

  Template.form.helpers({
    isVolume: function() {
      return Session.get('isVolume')
    },
    date: function() {
      return moment(Date.now()).format('YYYY-MM-DD');
    }
  })

  Template.xml.events({
    'click .submit-xml': function(e) {
      var xml = Session.get('xml');
      if (!Meteor.utils.isValidXml(xml)) {
        return alert('invalid xml')
      }
      e.target.innerText = 'Submitting...'
      Meteor.call('submit_xml', xml, function(err, data) {
        if (err) {
          e.target.innerText = 'Submit XML'
          return alert(err)
        }
        e.target.innerText = 'Submitted'
        clearEditor()
        setTimeout(function() {
          e.target.innerText = 'Submit XML'
        }, 750)
      });
    }
  })

  Template.form.events({
    'click .switch': function(e) {
      var isVolumeInverted = Session.get('isVolume') ? false : true
      Session.set('isVolume', isVolumeInverted)
      e.target.innerText = isVolumeInverted ?
        'Switch to PII submission' :
        'Switch to volume submission'
    },
    'submit .generate-xml-form': function(e) {
      var journal = e.target.journal.value,
        volume = e.target.volume && e.target.volume.value,
        issue = e.target.issue && e.target.issue.value,
        piilist = e.target.piilist && e.target.piilist.value,
        date = e.target.date.value
      e.preventDefault()
      piilist ?
        Meteor.call('get_json_and_generate_xml_from_pii_list', journal, piilist, date, cb) :
        Meteor.call('get_json_and_generate_xml', journal, volume, issue, date, cb)

      function cb(err, data) {
        if (err) {
          return alert(err)
        }
        loadEditor(data.xml)
        e.target.reset()
      }
    }
  })

  Router.route('/', function() {
    this.render('home')
    AceEditor.instance('xmlbox', {
      theme: 'dawn',
      mode: 'xml'
    }, function(editor) {
      editor.setReadOnly(true)
      editor.setOptions({
        maxLines: Infinity,
        showLineNumbers: false
      })
      editor.on('change', function() {
        Session.set('xml', editor.getValue())
      })
    })
  })

  function clearEditor() {
    AceEditor.instance('xmlbox', null, function(editor) {
      editor.setValue('')
      editor.clearSelection()
      editor.setReadOnly(true)
    })
  }

  function loadEditor(xml) {
    AceEditor.instance('xmlbox', null, function(editor) {
      editor.setValue(xml)
      editor.clearSelection()
      editor.setReadOnly(false)
      editor.focus()
    })
  }
}
