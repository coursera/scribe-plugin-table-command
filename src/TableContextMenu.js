/**
 * Right click context menu to perform write operations on a table.
 */

require('./scribe-plugin-table-command.styl');

var TableUtils = require('./TableUtils');

// Actions supported by the context menu
var TABLE_ACTIONS = [
  {
    text: 'Inserir linha acima',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertRow(scribe, table, cellPosition.rowIndex) },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TBODY' }
  },
  {
    text: 'Inserir linha abaixo',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertRow(scribe, table, cellPosition.rowIndex + 1) },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TBODY' }
  },
  {
    text: 'Inserir coluna à esquerda',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertColumn(scribe, table, cellPosition.columnIndex) }
  },
  {
    text: 'Inserir coluna à direita',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertColumn(scribe, table, cellPosition.columnIndex + 1) }
  },
  {
    text: 'Adicionar cabeçalho',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertHeader(scribe, table) },
    test: function(table, tableCell) { return TableUtils.getFirstTypeOfNode(table, 'THEAD') === null }
  },
  {
    text: 'Remover cabeçalho',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeHeader(scribe, table) },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'THEAD' }
  },
  {
    text: 'Remover linha',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeRow(scribe, table, cellPosition.rowIndex) },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TBODY' }
  },
  {
    text: 'Adicionar rodapé',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.insertFooter(scribe, table) },
    test: function(table, tableCell) { return TableUtils.getFirstTypeOfNode(table, 'TFOOT') === null }
  },
  {
    text: 'Remover rodapé',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeFooter(scribe, table) },
    test: function(table, tableCell) { return tableCell.parentNode.parentNode.nodeName === 'TFOOT' }
  },
  {
    text: 'Remover coluna',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeColumn(scribe, table, cellPosition.columnIndex) }
  },
  {
    text: 'Remover tabela',
    run: function(scribe, table, tableCell, action, cellPosition) { TableUtils.removeTable(scribe, table) }
  }
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
