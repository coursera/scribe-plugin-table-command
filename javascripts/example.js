var paths = {
  'scribe': '../bower_components/scribe/scribe',
  'scribe-plugin-toolbar': '../bower_components/scribe-plugin-toolbar/scribe-plugin-toolbar',
  'scribe-plugin-table-command': '../bower_components/scribe-plugin-table-command/scribe-plugin-table-command'
};

var map = {
  '*': {
    'css': '../bower_components/require-css/css'
  }
};

require({ paths: paths, map: map }, [
  'scribe',
  'scribe-plugin-toolbar',
  'scribe-plugin-table-command',
  'css!scribe-plugin-table-command'
], function (
  Scribe,
  toolbarPlugin,
  tableCommand
) {

  function updateHTML() {
    // document.querySelector('.scribe-html').value = scribe.getHTML();
  }

  var scribe = new Scribe(document.querySelector('.scribe'), {
    allowBlockElements: true
  });

  scribe.on('content-changed', updateHTML);

  scribe.use(toolbarPlugin(document.querySelector('.toolbar')));
  scribe.use(tableCommand());

  var html = '<p>Scribe Table Command Demo.</p><p>Right Click in a table cell to show context menu</p>';
  html += '<table><tbody><tr><td>Header1</td><td>Header2</td><td>Header3</td></tr><tr><td>value1</td><td>value2</td><td>value3</td></tr></tbody></table>';
  scribe.setContent(html);

  document.querySelector('.scribe').focus();
});