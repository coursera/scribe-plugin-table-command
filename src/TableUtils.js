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
