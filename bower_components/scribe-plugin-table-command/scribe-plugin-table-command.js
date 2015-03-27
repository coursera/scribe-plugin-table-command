define(function() { return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Scribe Table Command.
	 * This command lets users insert and perform edit operations on a table.
	 *
	 * Behavior:
	 * Create a 3x3 table by default.
	 * Right click context menu to perform transformations on table.
	 *
	 * TODO Make number of rows/columns configurable.
	 */

	var TableContextMenu = __webpack_require__(1);
	var TableUtils = __webpack_require__(2);

	module.exports = function() {
	  return function(scribe) {
	    var tableCommand = new scribe.api.Command('insertTable');
	    var contextMenu = new TableContextMenu(scribe);

	    tableCommand.nodeName = 'TABLE';

	    tableCommand.execute = function() {
	      var tableElement = TableUtils.createTable(3, 3);

	      scribe.transactionManager.run(function() {
	        var selection = new scribe.api.Selection();

	        var el = findBlockContainer(selection.range.endContainer);
	        var nextElement = el.nextSibling;

	        if (nextElement) {
	          scribe.el.insertBefore(tableElement, nextElement);
	        }

	        else {
	          scribe.el.appendChild(tableElement);
	        }

	        var body = tableElement.childNodes[0];
	        var firstRow = body.childNodes[0];
	        var firstCell = firstRow.childNodes[0];

	        TableUtils.select(scribe, firstCell);
	      });
	    };

	    tableCommand.queryState = function() {
	      var selection = new scribe.api.Selection();
	      return selection.getContaining(function(node) {
	        return (node.nodeName === this.nodeName);
	      }.bind(this));
	    };

	    tableCommand.queryEnabled = function() {
	      return true;
	    };

	    /**
	     * Find block container for the given element.
	     * @param {HTMLElement} el
	     */
	    function findBlockContainer(el) {
	      while (el && !scribe.element.isBlockElement(el)) {
	        el = el.parentNode;
	      }

	      return el;
	    }

	    /**
	     * Handle keydown event in the scribe editor.
	     * Used to override Enter behavior.
	     */
	    function handleKeydown(event) {
	      if (event.keyCode === 13) {
	        var selection = new scribe.api.Selection();
	        var range = selection.range;
	        var el = range.endContainer;

	        var table = TableUtils.findTable(scribe, el);
	        var tableCell = TableUtils.findTableCell(scribe, el);
	        var index = Array.prototype.indexOf.call(scribe.el.childNodes, table) + 1;

	        var newEl = null;

	        if (tableCell) {
	          event.preventDefault();
	          newEl = document.createElement('p');

	          if (table.nextSibling) {
	            scribe.el.insertBefore(newEl, table.nextSibling);
	          } else {
	            scribe.el.appendChild(newEl);
	          }

	          range.setStart(scribe.el.childNodes[index], 0);
	          range.collapse(true);

	          selection.selection.removeAllRanges();
	          selection.selection.addRange(range);
	        }
	      }
	    }

	    /**
	     * Handle right click inside the scribe editor.
	     */
	    function handleRightClick(event) {
	      var target = event.target || event.toElement;

	      if (!target) {
	        return;
	      }

	      var tableCell = TableUtils.findTableCell(scribe, target);
	      var table = TableUtils.findTable(scribe, tableCell);

	      if (table) {
	        event.preventDefault();
	        contextMenu.show(table, tableCell);
	      }
	    }

	    scribe.el.addEventListener('keydown', handleKeydown);
	    scribe.el.addEventListener('contextmenu', handleRightClick);

	    scribe.commands.table = tableCommand;
	  };
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Right click context menu to perform write operations on a table.
	 */

	__webpack_require__(3);

	var TableUtils = __webpack_require__(2);

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
	    top += el.offsetTop;
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
	      option.innerText = action.text;

	      option.addEventListener('click', function(event) {
	        event.preventDefault();
	        event.stopPropagation();
	        this.handleAction(table, tableCell, action);
	      }.bind(this));

	      menu.appendChild(option);
	    }.bind(this));

	    document.body.appendChild(menu);
	    document.addEventListener('click', this.hide);
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


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * Utility methods to perform read/write operations on a table element.
	 */
	var TableUtils = {

	  createTableCell: function() {
	    var tableCell = document.createElement('td');
	    return tableCell;
	  },

	  createTableRow: function(columnCount) {
	    var tableRow = document.createElement('tr');
	    for (var i = 0; i < columnCount; i++) {
	      tableRow.appendChild(TableUtils.createTableCell());
	    }

	    return tableRow;
	  },

	  createTable: function(rowCount, columnCount) {
	    var table = document.createElement('table');
	    var tableBody = document.createElement('tbody');

	    for (var i = 0; i < rowCount; i++) {
	      tableBody.appendChild(TableUtils.createTableRow(columnCount));
	    }

	    table.appendChild(tableBody);
	    return table;
	  },

	  getColumnCount: function(table) {
	    var body = table.childNodes[0];
	    var rows = body.childNodes;
	    return rows[0].childNodes.length;
	  },

	  getRowCount: function(table) {
	    var body = table.childNodes[0];
	    return body.childNodes.length;
	  },

	  // Finder operations

	  findTable: function(scribe, el) {
	    while (el && el !== scribe.el && el.nodeName !== 'TABLE') {
	      el = el.parentNode;
	    }

	    if (el && el.nodeName !== 'TABLE') {
	      el = null;
	    }

	    return el;
	  },

	  findTableCell: function(scribe, el) {
	    while (el && el !== scribe.el && el.nodeName !== 'TD') {
	      el = el.parentNode;
	    }

	    if (el && el.nodeName !== 'TD') {
	      el = null;
	    }

	    return el;
	  },

	  findCellPosition: function(table, targetTableCell) {
	    var body = table.childNodes[0];
	    var rows = Array.prototype.slice.call(body.childNodes);
	    var position = {
	      rowIndex: -1,
	      columnIndex: -1
	    };

	    rows.every(function(row, rowIndex) {
	      var cells = Array.prototype.slice.call(row.childNodes);

	      cells.every(function(cell, columnIndex) {
	        if (cell === targetTableCell) {
	          position = {
	            rowIndex: rowIndex,
	            columnIndex: columnIndex
	          };

	          return false;
	        }

	        return true;
	      });

	      if (position.rowIndex !== -1) {
	        return false;
	      }

	      return true;
	    });

	    return position;
	  },

	  // Row operations

	  insertRow: function(scribe, table, rowIndex) {
	    var columnCount = TableUtils.getColumnCount(table);
	    var body = table.childNodes[0];
	    var rowAtIndex = body.childNodes[rowIndex];
	    var newRow = TableUtils.createTableRow(columnCount);

	    scribe.transactionManager.run(function() {
	      body.insertBefore(newRow, rowAtIndex);
	      this.select(scribe, newRow.childNodes[0]);
	    }.bind(this));
	  },

	  removeRow: function(scribe, table, rowIndex) {
	    if (this.getRowCount(table) === 1) {
	      this.removeTable(scribe, table);
	      return;
	    }

	    var body = table.childNodes[0];
	    var rowAtIndex = body.childNodes[rowIndex];

	    scribe.transactionManager.run(function() {
	      body.removeChild(rowAtIndex);

	      if (rowIndex >= TableUtils.getRowCount(table)) {
	        rowIndex --;
	      }

	      this.select(scribe, body.childNodes[rowIndex].childNodes[0]);
	    }.bind(this));
	  },

	  // Column operations

	  insertColumn: function(scribe, table, columnIndex) {
	    var body = table.childNodes[0];
	    var rows = Array.prototype.slice.call(body.childNodes);

	    scribe.transactionManager.run(function() {
	      rows.forEach(function(row) {
	        var cell = TableUtils.createTableCell();
	        row.insertBefore(cell, row.childNodes[columnIndex]);
	      });

	      this.select(scribe, body.childNodes[0].childNodes[columnIndex]);
	    }.bind(this));
	  },

	  removeColumn: function(scribe, table, columnIndex) {
	    var columnCount = this.getColumnCount(table);
	    var body = table.childNodes[0];
	    var rows = Array.prototype.slice.call(body.childNodes);

	    if (columnCount === 1) {
	      this.removeTable(scribe, table);
	      return;
	    }

	    scribe.transactionManager.run(function() {
	      rows.forEach(function(row) {
	        row.removeChild(row.childNodes[columnIndex]);
	      });

	      this.select(scribe, body.childNodes[0].childNodes[0]);
	    }.bind(this));
	  },

	  // Table operations

	  removeTable: function(scribe, table) {
	    scribe.transactionManager.run(function() {
	      scribe.el.removeChild(table);
	      this.select(scribe, scribe.el.childNodes[0]);
	    }.bind(this));
	  },

	  select: function(scribe, el) {
	    var selection = new scribe.api.Selection();
	    selection.range.setStart(el, 0);
	    selection.range.collapse(true);

	    selection.selection.removeAllRanges();
	    selection.selection.addRange(selection.range);
	  }

	};

	module.exports = TableUtils;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	// removed by extract-text-webpack-plugin

/***/ }
/******/ ])});;