import {
  ColumnDefinition,
  SetDefaultValuesIfNotPresent,
} from '../shared/models/ColumnDefinition';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TypeName } from '../shared/enums/TypeName';
import { CellValueChanged } from '../shared/models/CellValueChanged';
import { CellClicked } from '../shared/models/CellClicked';

@Component({
  selector: 'custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss'],
})
export class CustomTableComponent implements OnInit {
  //#region props
  columnDefinitions: ColumnDefinition[] = [
    {
      propertyKey: 'sku',
    },
    {
      propertyKey: 'price',
      type: TypeName.Number,
    },
    {
      headerName: 'Weight KG',
      propertyKey: 'weight',
      type: TypeName.Number,
      width: 100,
      editable: true,
    },
  ];

  rowData: any[] = [
    {
      sku: 'KA777',
      weight: 700,
      price: 45.2,
    },
    {
      sku: 'KA1044',
      weight: 10,
      price: 54,
    },
    {
      sku: 'KA490',
      weight: 20,
      price: 100,
    },
    {
      sku: 'KA144',
      weight: 12,
      price: 540,
    },
  ];

  @Output() cellValueChanged: EventEmitter<CellValueChanged> =
    new EventEmitter();

  @Output() cellClicked: EventEmitter<CellClicked> = new EventEmitter();

  //#endregion

  //#region config
  constructor() {}

  ngOnInit(): void {
    this.colDefConfig();
  }

  colDefConfig() {
    this.columnDefinitions.forEach((colDef: ColumnDefinition) =>
      SetDefaultValuesIfNotPresent(colDef)
    );
  }
  //#endregion

  //#region Events
  onRowClick(row: any) {
    this.rowData.forEach((x) => (x.isSelected = false));
    row.isSelected = true;
  }

  onCellClicked(column: ColumnDefinition, cellValue: string) {
    this.columnDefinitions.forEach((x) => (x.isSelected = false));
    column.isSelected = true;
    const rowData = this.rowData.find((row) => row.isSelected);
    this.cellClicked.emit({
      columnDefinition: column,
      rowData: rowData,
      value: cellValue,
    });
  }

  onCellValueChanged(propertyKey: string, newValue: string) {
    const colDef = this.columnDefinitions.filter(
      (x) => x.propertyKey === propertyKey
    )[0];
    const rowData = this.rowData.find((row) => row.isSelected);
    this.cellValueChanged.emit({
      columnDefinition: colDef,
      rowData: rowData,
      oldValue: rowData[propertyKey],
      value: newValue,
    });
  }
  //#endregion
}
