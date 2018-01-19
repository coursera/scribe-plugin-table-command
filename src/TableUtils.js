/**
 * Utility methods to perform read/write operations on a table element.
 */

const TABLE_HEADER_PLACEHOLDER = '<header>';
const ROW_HEADER_PLACEHOLDER = '<row header>';
const ROW_HEADER_PLACEHOLDER_ENCODED = '&lt;row header&gt;'; // for html string replace

var TableUtils = {

  createTableCell: function(nodeName, nodeText) {
    nodeName = nodeName || 'td';
    var tableCell = document.createElement(nodeName);

    if (nodeText) {
      var textNode = document.createTextNode(nodeText);
      tableCell.appendChild(textNode);
    }

    return tableCell;
  },

  createTableRow: function(columnCount, nodeName, nodeText, hasRowHeader) {
    var isRowHeader;
    var node;
    var text;
    var tableRow = document.createElement('tr');

    for (var i = 0; i < columnCount; i++) {
      isRowHeader = false;
      node = nodeName || 'td';
      text = nodeText || '';

      if (i === 0 && hasRowHeader) {
        // use row header placeholder
        isRowHeader = true;
        node = 'th';
        text = ROW_HEADER_PLACEHOLDER;
      }

      tableRow.appendChild(TableUtils.createTableCell(node, text));
    }

    return tableRow;
  },

  createTable: function(rowCount, columnCount) {
    var table = document.createElement('table');
    var tableBody = document.createElement('tbody');

    for (var i = 0; i < rowCount; i++) {
      tableBody.appendChild(TableUtils.createTableRow(columnCount, null, null, true));
    }

    table.appendChild(tableBody);
    this.insertHeader(table);

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

  hasHeader: function(table) {
    var nodes = table.childNodes;

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.nodeName === 'THEAD') {
        return true;
      }
    }

    return false;
  },

  hasRowHeaders: function(table) {
    var body = TableUtils.getTableBody(table);
    var nodes = body.childNodes;

    // find first body row with a TH cell
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];

      if (node.childNodes[0].nodeName === 'TH') {
        return true;
      }
    }

    return false;
  },

  hasCaption: function(table) {
    var nodes = table.childNodes;

    // <caption> is always the first child
    if (nodes[0]) {
      return nodes[0].nodeName === 'CAPTION';
    }

    return false;
  },

  getCaption: function(table) {
    var caption = TableUtils.getFirstTypeOfNode(table, 'CAPTION');

    return caption ? caption.textContent : '';
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
    var hasRowHeaders = TableUtils.hasRowHeaders(table);
    var rowAtIndex = body.childNodes[rowIndex];
    var newRow = TableUtils.createTableRow(columnCount, null, null, hasRowHeaders);

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
    var rows = TableUtils.getAllRows(table);
    var hasHeader = TableUtils.hasHeader(table);
    var hasRowHeaders = TableUtils.hasRowHeaders(table);
    var cellName;
    var cellText;

    scribe.transactionManager.run(function() {
      rows.forEach(function(row, idx) {
        if (idx === 0 && hasHeader) {
          cellText = TABLE_HEADER_PLACEHOLDER;
        } else {
          cellText = '';
        }

        cellName = hasRowHeaders ? row.childNodes[1].nodeName : row.childNodes[0].nodeName

        var cell = TableUtils.createTableCell(cellName, cellText);
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

  insertHeader: function(table) {
    var tableHead = document.createElement('thead');
    tableHead.appendChild(TableUtils.createTableRow(
      TableUtils.getColumnCount(table), 'th', TABLE_HEADER_PLACEHOLDER)
    );

    table.insertBefore(tableHead, table.childNodes[0]);
  },

  insertFooter: function(table) {
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

  removeRowHeaders: function(scribe, table) {
    if (TableUtils.hasRowHeaders(table)) {
      var body = TableUtils.getTableBody(table);
      var rows = body.childNodes;

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var headerCell = row.childNodes[0];

        // replace TH with TD and remove placeholder
        headerCell.outerHTML = headerCell.outerHTML
          .replace('<th>', '<td>')
          .replace('</th>', '</td>')
          .replace(ROW_HEADER_PLACEHOLDER_ENCODED, '');
      }
    }
  },

  insertCaption: function(scribe, table) {
    var tableCaption = document.createElement('caption');
    var existingCaption = TableUtils.hasCaption(table) ? TableUtils.getCaption(table) : '';
    var captionText = window.prompt(
      'Enter a descriptive caption for this table',
      existingCaption
    );

    if (existingCaption) {
      TableUtils.removeCaption(scribe, table);
    }

    var textNode = document.createTextNode(captionText);

    tableCaption.appendChild(textNode);
    table.insertBefore(tableCaption, table.childNodes[0]);
  },

  removeCaption: function(scribe, table) {
    var caption = TableUtils.getFirstTypeOfNode(table, 'CAPTION');

    scribe.transactionManager.run(function() {
      table.removeChild(caption);
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
