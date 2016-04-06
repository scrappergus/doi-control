if (Meteor.isClient) {
  Session.set('loadedPiis', {})
  Session.set('blockRequests', false)

  Session.set('isVolume', true)
  Session.set('xml', '')

  Template.form.helpers({
    isVolume: function() {
      return Session.get('isVolume')
    }
  })

  Template.xml.helpers({
    registeredPiis: function() {
      var piis = Session.get('loadedPiis')
      return Object.keys(piis).filter(function(pii) {
        return piis[pii];
      })
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
    'input .piilist': function(e) {
      var loadedPiis = Session.get('loadedPiis')
      var blockRequests = Session.get('blockRequests')
      console.log('input', e.target.value, loadedPiis, blockRequests);
      e.target.value
        .split(',')
        .filter(function(pii) {
          // check that pii has not been loaded
          console.log('filter 1')
          return loadedPiis[pii] === undefined
        })
        .filter(function(pii) {
          // check if should delay request
          console.log('filter 2')
          return !blockRequests
        })
        .forEach(function(pii) {
          console.log(pii);
          Meteor.call('checkRegistration', pii, function(err, body) {
            console.log(arguments);
            if (err || !body) {
              return;
            }
            var isRegistered = body.toString().indexOf('Resource not found') === -1
            loadedPiis[pii] = isRegistered

            // block requests for a second
            Session.set('loadedPiis', loadedPiis)
            if (!blockRequests) {
              console.log('block');
              Session.set('blockRequests', true)
              setTimeout(function() {
                console.log('unblock');
                Session.set('blockRequests', false)
              }, 1000)
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
