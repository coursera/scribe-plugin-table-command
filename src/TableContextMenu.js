/**
 * Right click context menu to perform write operations on a table.
 */

require('./scribe-plugin-table-command.styl');

var TableUtils = require('./TableUtils');

// Actions supported by the context menu
var TABLE_ACTIONS = [{
  id: 0,
  text: 'Insert row above'
},
{
  id: 1,
  text: 'Insert row below'
},
{
  id: 2,
  text: 'Insert column left'
},
{
  id: 3,
  text: 'Insert column right'
},
{
  id: 4,
  text: 'Delete row'
},
{
  id: 5,
  text: 'Delete column'
},
{
  id: 6,
  text: 'Delete table'
}];

var CONTEXT_MENU_CLASS = 'scribe-table-context-menu';
var CONTEXT_MENU_ACTION_CLASS = 'scribe-table-context-menu-action';

var getOffset = function(el) {
  var top = 0;
  var left = 0;

  while (el) {
    top += el.offsetTop - el.scrollTop;
    left += el.offsetLeft;
    el = el.offsetParent;
  }

  return {
    top: top,
    left: left
  };
};

var TableContextMenu = function(scribe) {

  /**
   * Show right click context menu.
   * @param {HTMLElement} table Table element
   * @param {HTMLElement} tableCell Target cell of the right click.
   */
  this.show = function(table, tableCell) {
    this.hide();

    var menu = document.createElement('div');
    var offset = getOffset(tableCell);

    menu.className = CONTEXT_MENU_CLASS;
    menu.style.top = offset.top + 20 + 'px';
    menu.style.left = offset.left + 20 + 'px';

    TABLE_ACTIONS.forEach(function(action) {
      var option = document.createElement('div');
      option.className = CONTEXT_MENU_ACTION_CLASS;
      option.textContent = action.text;

      option.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        this.handleAction(table, tableCell, action);
      }.bind(this));

      menu.appendChild(option);
    }.bind(this));

    document.body.appendChild(menu);

    document.addEventListener('click', function(event) {
      // ignore right click from the contextmenu event.
      if (event.which !== 3) {
        this.hide();
      }
    }.bind(this));
  };

  /**
   * Hide right click context menu.
   */
  this.hide = function() {
    var menu = document.getElementsByClassName(CONTEXT_MENU_CLASS)[0];
    if (menu) {
      menu.parentNode.removeChild(menu);
    }

    document.removeEventListener('click', this.hide);
  };

  /**
   * Handle action selection from the context menu.
   * @param {HTMLElement} table Table element
   * @param {HTMLElement} tableCell Table cell that was the target of the right click
   * @param {object} action Table Action from TABLE_ACTIONS
   */
  this.handleAction = function(table, tableCell, action) {
    var cellPosition = TableUtils.findCellPosition(table, tableCell);
    this.hide();

    switch (action.id) {
      case 0:
        TableUtils.insertRow(scribe, table, cellPosition.rowIndex);
        break;
      case 1:
        TableUtils.insertRow(scribe, table, cellPosition.rowIndex + 1);
        break;
      case 2:
        TableUtils.insertColumn(scribe, table, cellPosition.columnIndex);
        break;
      case 3:
        TableUtils.insertColumn(scribe, table, cellPosition.columnIndex + 1);
        break;
      case 4:
        TableUtils.removeRow(scribe, table, cellPosition.rowIndex);
        break;
      case 5:
        TableUtils.removeColumn(scribe, table, cellPosition.columnIndex);
        break;
      case 6:
        TableUtils.removeTable(scribe, table);
        break;
    }
  };

  return this;
};

module.exports = TableContextMenu;
