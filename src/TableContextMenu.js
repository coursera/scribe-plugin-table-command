/**
 * Right-click context menu to perform write operations on a table.
 */

require('./scribe-plugin-table-command.styl');

var TableUtils = require('./TableUtils');

// Actions supported by the context menu
var TABLE_ACTIONS = [
  {
    text: 'Insert row above',
    run: function(scribe, table, tableCell, action, cellPosition) {
      var rowIndex = cellPosition.rowIndex;

      if (TableUtils.hasHeader(table)) {
        rowIndex = rowIndex - 1; // account for header
      }

      TableUtils.insertRow(scribe, table, rowIndex);
    },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TBODY' }
  },
  {
    text: 'Insert row below',
    run: function(scribe, table, tableCell, action, cellPosition) {
      var rowIndex = cellPosition.rowIndex + 1;

      if (TableUtils.hasHeader(table)) {
        rowIndex = rowIndex - 1; // account for header
      }

      TableUtils.insertRow(scribe, table, rowIndex);
    },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TBODY' }
  },
  {
    text: 'Insert column left',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertColumn(scribe, table, cellPosition.columnIndex) }
  },
  {
    text: 'Insert column right',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertColumn(scribe, table, cellPosition.columnIndex + 1) }
  },
  {
    text: 'Insert header',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertHeader(table) },
    test: function(table, tableCell) { return TableUtils.getFirstTypeOfNode(table, 'THEAD') === null }
  },
  {
    text: 'Remove header',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeHeader(scribe, table) },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'THEAD' }
  },
  {
    text: 'Remove row headers',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeRowHeaders(scribe, table) },
    test: function(table, tableCell) { return TableUtils.hasRowHeaders(table) }
  },
  {
    text: 'Delete row',
    run: function(scribe, table, tableCell, action, cellPosition) {
    var rowIndex = cellPosition.rowIndex;

      if (TableUtils.hasHeader(table)) {
        rowIndex = rowIndex - 1; // account for header
      }

      TableUtils.removeRow(scribe, table, rowIndex)
    },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TBODY' }
  },
  {
    text: 'Delete column',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeColumn(scribe, table, cellPosition.columnIndex) }
  },
  {
    text: 'Delete table',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeTable(scribe, table) }
  },
  {
    text: 'Insert caption',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertCaption(scribe, table) },
    test: function(table, tableCell) { return !TableUtils.hasCaption(table) }
  },
  {
    text: 'Edit caption',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertCaption(scribe, table) },
    test: function(table, tableCell) { return TableUtils.hasCaption(table) }
  },
  {
    text: 'Remove caption',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeCaption(scribe, table) },
    test: function(table, tableCell) { return TableUtils.hasCaption(table) }
  },
  {
    text: 'Insert footer',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertFooter(table) },
    test: function(table, tableCell) { return TableUtils.getFirstTypeOfNode(table, 'TFOOT') === null }
  },
  {
    text: 'Delete footer',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeFooter(scribe, table) },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TFOOT' }
  },
]

var CONTEXT_MENU_CLASS = 'scribe-table-context-menu';
var CONTEXT_MENU_ACTION_CLASS = 'scribe-table-context-menu-action';

var getOffset = function(el) {
  var top = 0;
  var left = 0;

  while (el) {
    top += el.offsetTop;
    left += el.offsetLeft;

    if (el !== document.body) {
      top -= el.scrollTop;
    }

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

    var cellPosition = TableUtils.findCellPosition(table, tableCell);

    TABLE_ACTIONS.forEach(function(action) {
      // only render menu items that are actionable at the
      // current state of the table
      if (action.test && !action.test(table, tableCell)) {
        return;
      }

      var option = document.createElement('div');
      option.className = CONTEXT_MENU_ACTION_CLASS;
      option.textContent = action.text;

      option.addEventListener('click', function(event) {
        event.preventDefault();
        event.stopPropagation();
        action.run(scribe, table, tableCell, action, cellPosition);
        this.hide();
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

  return this;
};

module.exports = TableContextMenu;
