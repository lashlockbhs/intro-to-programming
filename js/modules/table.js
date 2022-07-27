import { $, withClass } from './whjqah';

class Table {
  constructor() {
    this.table = $('<table>');
    this.columnClasses = [];
    this.headerRow = $('<tr>');
    this.tbody = $('<tbody>');

    const thead = $('<thead>');
    thead.append(this.headerRow);
    this.table.append(thead);
    this.table.append(this.tbody);
  }

  addColumn(name, clazz) {
    this.columnClasses.push(clazz);
    this.headerRow.append(withClass(clazz, $('<th>', name)));
  }

  addRow(values) {
    const row = this.tbody.insertRow();
    values.forEach((value, i) => {
      const cell = row.insertCell();
      cell.className = this.columnClasses[i];
      cell.append(value);
    });
    return row;
  }

  clearAllRows() {
    this.tbody.replaceChildren();
  }
}

const makeTable = (columns) => new Table(columns);

export default makeTable;
