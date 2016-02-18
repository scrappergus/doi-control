Meteor.utils = {
  isValidXml: isValidXml
};

// recursive dom check for xml parsing errors
function isValidXml(string) {
  var parser = new DOMParser
  try {
    _checkNode(parser.parseFromString(string, 'text/xml'))
  } catch (err) {
    if (err.message === 'parsererror') {
      return false
    }
    throw err
  }
  return true
}

function _checkNode(node) {
  Array.prototype.map.call(node.children, _checkNode)
  if (node.nodeName === 'parsererror') {
    throw new Error('parsererror')
  }
}
