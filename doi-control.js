if (Meteor.isClient) {
  Session.set('registeredPiis', [])
  Session.set('blockRequests', false)

  Session.set('isVolume', true)
  Session.set('xml', '')

  Template.form.helpers({
    isVolume: function() {
      return Session.get('isVolume')
    }
  })

  Template.form.helpers({
    registeredPiis: function() {
      return Session.get('registeredPiis')
    }
  })

  Template.xml.events({
    'click .submit-xml': function(e) {
      var xml = Session.get('xml')
      if (!Meteor.utils.isValidXml(xml)) {
        return feedback('Invalid XML')
      }
      e.target.innerText = 'Submitting...'
      Meteor.call('submit_xml', xml, function(err, data) {
        e.target.innerText = 'Submit XML'
        var error = err && err.error || data.error
        if (err) {
          return feedback(err.error)
        }
        feedback('XML Submitted', true)
        clearEditor()
      })
    }
  })

  Template.form.events({
    'change .journal': function(e) {
      Session.set('journal', e.target.value)
    },
    'input .piilist': function(e) {
      var registeredPiis = Session.get('registeredPiis')
      var blockRequests = Session.get('blockRequests')
      var inputs = e.target.value
        .split(',')
        .map(function(pii) {
          return pii.trim()
        })

      updateRegistered(inputs, registeredPiis)

      inputs
        .filter(function(pii) {
          // check that pii has not been loaded
          return registeredPiis.indexOf(pii) === -1
        })
        .filter(function(pii) {
          // check if should delay request
          return !blockRequests
        })
        .forEach(function(pii) {
          Meteor.call('checkRegistration', Session.get('journal'), pii, function(err, body) {
            if (!err && body) {
              registeredPiis.push(pii)
              updateRegistered(inputs, registeredPiis)
            }
          })
        })

    },
    'click .switch': function(e) {
      var isVolumeInverted = Session.get('isVolume') ? false : true
      Session.set('isVolume', isVolumeInverted)
      e.target.innerText = isVolumeInverted ?
        'Switch to PII submission' :
        'Switch to volume submission'
    },
    'submit .generate-xml-form': function(e) {
      var button = e.target.querySelector('button')
      var journal = e.target.journal.value,
        volume = e.target.volume && e.target.volume.value,
        issue = e.target.issue && e.target.issue.value,
        piilist = e.target.piilist && e.target.piilist.value,
        date = e.target.date.value
      e.preventDefault()
      button.innerText = 'Generating...'
      piilist ?
        Meteor.call('get_json_and_generate_xml_from_pii_list', journal, piilist, date, cb) :
        Meteor.call('get_json_and_generate_xml', journal, volume, issue, date, cb)

      function cb(err, data) {
        button.innerText = 'Generate submission'
        if (err) {
          feedback(err.error)
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

  function updateRegistered(inputs, registeredPiis) {
    Session.set('registeredPiis', registeredPiis.filter(function(registered) {
      return inputs.indexOf(registered) !== -1
    }))
  }

  function feedback(message, success) {
    var $feedback = document.getElementById('feedback')
    $feedback.setAttribute('class', success? 'teal lighten-3 white-text' : 'red lighten-3')
    $feedback.innerText = message
    setTimeout(function() {
      $feedback.setAttribute('class', '')
      $feedback.innerText = ''
    }, 3000)
  }

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
