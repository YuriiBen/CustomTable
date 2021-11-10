import { Component } from '@angular/core';
import { PinnedOptions } from './shared/enums/PinnedOptions';
import { TypeName } from './shared/enums/TypeName';
import { CellClicked } from './shared/models/CellClicked';
import { CellValueChanged } from './shared/models/CellValueChanged';
import { ColumnDefinition } from './shared/models/ColumnDefinition';
import { ColumnSorted } from './shared/models/ColumnSorted';
import { DefaultOptions } from './shared/models/DefaultOptions';
import { RowResized } from './shared/models/RowResized';
import { TableApi } from './shared/models/TableApi';
import { TableConfiged } from './shared/models/TableConfiged';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  tableApi: TableApi;

  columnDefinitions: ColumnDefinition[] = [
    {
      propertyKey: 'sku',
      pinnedOption: PinnedOptions.Left,
    },
    {
      propertyKey: 'customer',
      sortable: true,
      width: 125,
      pinnedOption: PinnedOptions.Left,
    },
    {
      propertyKey: 'price',
      type: TypeName.Number,
      sortable: true,
    },
    {
      headerName: 'Weight KG',
      propertyKey: 'weight',
      type: TypeName.Number,
      width: 100,
      editable: true,
    },
    {
      headerName: 'Hidden data',
      propertyKey: 'hidden',
      sortable: true,
      width: 125,
      hidden: true,
    },
  ];

  rowData: any[] = [
    {
      sku: 'KA777',
      weight: 700,
      price: 450.2,
      customer: 'Julie Robert',
      hidden: 'pa$$word1',
    },
    {
      sku: 'KA1044',
      weight: 10,
      price: 5,
      customer: 'Bob Lee Swagger',
      hidden: 'pa$$word2',
    },
    {
      sku: 'KA490',
      weight: 20,
      price: 100,
      customer: 'Oleksa Solotov',
      hidden: 'pa$$word3',
    },
    {
      sku: 'KA144',
      weight: 12,
      price: 540,
      customer: 'Nadine Memphis',
      hidden: 'pa$$word4',
    },
  ];

  defaultOptions: DefaultOptions = {
    resizable: false,
  };

  onTableReady(event: TableConfiged) {
    this.tableApi = new TableApi(event.rowData, event.columnDefinitions);
  }

  onCellValueChanged(event: CellValueChanged) {
    console.log('cell value changed', event);
  }

  onCellClicked(event: CellClicked) {
    console.log('cell clicked', event);
  }

  onRowResized(event: RowResized) {
    console.log('row resized', event);
  }

  onColumnSorted(event: ColumnSorted) {
    console.log('column sorted', event);
  }

  exportToCsv() {
    const fileName = 'ProfitData';
    this.tableApi.exportDataToCsv(fileName);
  }
}
