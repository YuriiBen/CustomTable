import { ColumnDefinition } from './ColumnDefinition';
import { saveAs } from 'file-saver';

export class TableApi {
  constructor(
    private rowData: any,
    private columnDefinitions: ColumnDefinition[]
  ) {}

  exportDataToCsv(fileName: string = 'data') {
    let visibleColDefs = this.columnDefinitions.filter((x: any) => !x.hidden);

    let visibleRowData: any[] = [];

    this.rowData.forEach((rowData: any) => {
      let obj: any = {};

      visibleColDefs.forEach((colDef: ColumnDefinition) => {
        obj[colDef.propertyKey] = rowData[colDef.propertyKey];
      });
      visibleRowData.push(obj);
    });

    this.downloadFile(visibleRowData, fileName);
  }

  private downloadFile(data: any, fileName: string) {
    const replacer = (key: any, value: any) => (value === null ? '' : value); // specify how you want to handle null values here
    const header = Object.keys(data[0]);
    let csv = data.map((row: any) =>
      header
        .map((fieldName) => JSON.stringify(row[fieldName], replacer))
        .join(',')
    );
    csv.unshift(header.join(','));
    let csvArray = csv.join('\r\n');

    var blob = new Blob([csvArray], { type: 'text/csv' });
    saveAs(blob, `${fileName}.csv`);
  }
}
