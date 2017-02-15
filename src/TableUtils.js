/**
 * Utility methods to perform read/write operations on a table element.
 */
var TableUtils = {

  createTableCell: function(nodeName = 'td') {
    var tableCell = document.createElement(nodeName);
    return tableCell;
  },

  createTableRow: function(columnCount, nodeName = 'td') {
    var tableRow = document.createElement('tr');
    for (var i = 0; i < columnCount; i++) {
      tableRow.appendChild(TableUtils.createTableCell(nodeName));
    }

    return tableRow;
  },

  createTable: function(rowCount, columnCount) {
    var table = document.createElement('table');
    var tableHead = document.createElement('thead');
    var tableBody = document.createElement('tbody');
    var tableFooter = document.createElement('tfoot');

    tableHead.appendChild(TableUtils.createTableRow(columnCount, 'th'));
    tableFooter.appendChild(TableUtils.createTableRow(columnCount));

    for (var i = 0; i < rowCount; i++) {
      tableBody.appendChild(TableUtils.createTableRow(columnCount));
    }

    table.appendChild(tableHead);
    table.appendChild(tableBody);
    table.appendChild(tableFooter);
    return table;
  },

  getTableBody: function(table) {
    var nodes = table.childNodes;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.nodeName === 'TBODY') {
        return node;
      }
    }

    return null;
  },

  getColumnCount: function(table) {
    var rows = TableUtils.getAllRows(table);
    var maxLength = 0;

    for (var i = 0; i < rows.length; i++) {
      var rowColumns = rows[i].childNodes.length;

      if (rowColumns > maxLength) {
        maxLength = rowColumns;
      }
    }
    return maxLength;
  },

  getBodyRowCount: function(table) {
    var body = TableUtils.getTableBody(table);
    return body.childNodes.length;
  },

  getAllRows: function(table) {
    var rows = [];
    var tableNodes = table.childNodes;
    for (var i = 0; i < tableNodes.length; i++) {
      var tableNode = tableNodes[i];
      Array.prototype.push.apply(rows, Array.prototype.slice.call(tableNode.childNodes));
    }

    return rows;
  },

  getFirstTypeOfNode: function(parent, nodeName) {
    var child = parent.childNodes;
    for (var i = 0; i < child.length; i++) {
      if (child[i].nodeName === nodeName) {
        return child[i];
      }
    }

    return null;
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
    while (el && el !== scribe.el && (el.nodeName !== 'TD' && el.nodeName !== 'TH')) {
      el = el.parentNode;
    }

    if (el && (el.nodeName !== 'TD' && el.nodeName !== 'TH')) {
      el = null;
    }

    return el;
  },

  findCellPosition: function(table, targetTableCell) {
    var rows = TableUtils.getAllRows(table);
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
    var body = TableUtils.getTableBody(table);
    var rowAtIndex = body.childNodes[rowIndex];
    var newRow = TableUtils.createTableRow(columnCount);

    scribe.transactionManager.run(function() {
      body.insertBefore(newRow, rowAtIndex);
      this.select(scribe, newRow.childNodes[0]);
    }.bind(this));
  },

  removeRow: function(scribe, table, rowIndex) {
    if (this.getBodyRowCount(table) === 1) {
      this.removeTable(scribe, table);
      return;
    }

    var body = TableUtils.getTableBody(table);
    var rowAtIndex = body.childNodes[rowIndex];

    scribe.transactionManager.run(function() {
      body.removeChild(rowAtIndex);

      if (rowIndex >= TableUtils.getBodyRowCount(table)) {
        rowIndex --;
      }

      this.select(scribe, body.childNodes[rowIndex].childNodes[0]);
    }.bind(this));
  },

  // Column operations

  insertColumn: function(scribe, table, columnIndex) {
    var body = TableUtils.getTableBody(table);
    var rows = TableUtils.getAllRows(table);

    scribe.transactionManager.run(function() {
      rows.forEach(function(row) {
        var cell = TableUtils.createTableCell(row.childNodes[0].nodeName);
        row.insertBefore(cell, row.childNodes[columnIndex]);
      });

      // Find a cell to select
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];

        if (row.childNodes.length > columnIndex) {
          this.select(scribe, row.childNodes[columnIndex]);
          break;
        }
      }
    }.bind(this));
  },

  // TODO Support the removal of columns at the header and footer
  removeColumn: function(scribe, table, columnIndex) {
    var columnCount = this.getColumnCount(table);
    var body = TableUtils.getTableBody(table);
    var rows = TableUtils.getAllRows(table);

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

  insertHeader: function(scribe, table) {
    var tableHead = document.createElement('thead');
    tableHead.appendChild(TableUtils.createTableRow(TableUtils.getColumnCount(table), 'th'));
    
    table.appendChild(tableHead);
  },

  insertFooter: function(scribe, table) {
    var tableFoot = document.createElement('tfoot');
    tableFoot.appendChild(TableUtils.createTableRow(TableUtils.getColumnCount(table)));

    table.appendChild(tableFoot);
  },

  removeHeader: function(scribe, table) {
    var header = TableUtils.getFirstTypeOfNode(table, 'THEAD');

    scribe.transactionManager.run(function() {
      table.removeChild(header);
    }.bind(this));
  },

  removeFooter: function(scribe, table) {
    var footer = TableUtils.getFirstTypeOfNode(table, 'TFOOT');

    scribe.transactionManager.run(function() {
      table.removeChild(footer);
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
