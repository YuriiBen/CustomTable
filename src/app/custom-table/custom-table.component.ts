import { DefaultOptions } from './../shared/models/DefaultOptions';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { SortBy } from '../shared/enums/SortBy';
import { TypeName } from '../shared/enums/TypeName';
import { CellClicked } from '../shared/models/CellClicked';
import { CellValueChanged } from '../shared/models/CellValueChanged';
import {
  ColumnDefinition,
  SetDefaultValuesIfNotPresent,
} from '../shared/models/ColumnDefinition';
import { ColumnState } from '../shared/models/ColumnState';
import { RowResized as RowResized } from '../shared/models/RowResized';
import { PinnedOptions } from '../shared/enums/PinnedOptions';

@Component({
  selector: 'custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss'],
})
export class CustomTableComponent implements OnInit, OnChanges {
  //#region props
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
      hidden: false,
      pinnedOption: PinnedOptions.Right,
    },
  ];

  grouppedColumnDefs: {
    pinnedTo: PinnedOptions;
    columnDefinitions: ColumnDefinition[];
  }[] = [
    { pinnedTo: PinnedOptions.Left, columnDefinitions: [] },
    { pinnedTo: PinnedOptions.None, columnDefinitions: [] },
    { pinnedTo: PinnedOptions.Right, columnDefinitions: [] },
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
  baseRowData: any[];

  columnStateDictionary: { [propertyKey: string]: ColumnState } = {};
  defaultOptions: DefaultOptions = {
    resizable: false,
  };

  @Input() quickSearch: string = '';

  @Output() cellValueChanged: EventEmitter<CellValueChanged> =
    new EventEmitter();
  @Output() cellClicked: EventEmitter<CellClicked> = new EventEmitter();

  @Output() rowResized: EventEmitter<RowResized> = new EventEmitter();
  //#endregion

  //#region config
  constructor(private renderer2: Renderer2) {}

  ngOnInit(): void {
    this.listenToResizeEvent();
    this.baseRowData = [...this.rowData];
    this.colDefConfig();
  }

  ngOnChanges() {
    if (this.quickSearch) {
      this.quickSearchProcess();
    }
  }

  colDefConfig() {
    this.columnDefinitions.forEach((colDef: ColumnDefinition) => {
      SetDefaultValuesIfNotPresent(colDef);
    });

    this.columnDefinitions
      .filter((x) => !x.hidden)
      .forEach((colDef: ColumnDefinition) => {
        this.UpdateColumnState(colDef, {
          width: colDef.width!,
          sortBy: SortBy.None,
        });
        this.rowData.forEach((data) => {
          if (!data[colDef.propertyKey]) {
            data[colDef.propertyKey] = null;
          }
        });

        // this.grouppedColumnDefs.push({
        //   pinnedTo: colDef.pinnedOption,
        //   columnDefinitions: colDef,
        // });
        this.grouppedColumnDefs
          .find((x) => x.pinnedTo === colDef.pinnedOption)
          ?.columnDefinitions.push(colDef);
      });
    console.log(this.grouppedColumnDefs);
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

  sortByHeader(header: ColumnDefinition, currentSortOption: SortBy) {
    if (!header.sortable) {
      return;
    }

    if (currentSortOption === SortBy.None) {
      currentSortOption = SortBy.Asc;
    } else if (currentSortOption === SortBy.Asc) {
      currentSortOption = SortBy.Desc;
    } else if (currentSortOption === SortBy.Desc) {
      currentSortOption = SortBy.None;
    }

    for (let key in this.columnDefinitions) {
      let colDef = this.columnDefinitions[key];
      this.UpdateColumnState(colDef, {
        width: colDef.width!,
        sortBy: SortBy.None,
      });
    }

    this.UpdateColumnState(header, {
      width: header.width!,
      sortBy: currentSortOption,
    });

    if (currentSortOption === SortBy.None) {
      this.rowData = [...this.baseRowData];
      return;
    }

    if (currentSortOption === SortBy.Asc) {
      if (header.type === TypeName.Number) {
        this.rowData.sort((a, b) =>
          +a[header.propertyKey] > +b[header.propertyKey] ? 1 : -1
        );
      } else {
        this.rowData.sort((a, b) =>
          a[header.propertyKey] > b[header.propertyKey] ? 1 : -1
        );
      }
    } else {
      if (header.type === TypeName.Number) {
        this.rowData.sort((a, b) =>
          +a[header.propertyKey] < +b[header.propertyKey] ? 1 : -1
        );
      } else {
        this.rowData.sort((a, b) =>
          a[header.propertyKey] < b[header.propertyKey] ? 1 : -1
        );
      }
    }
  }

  //#endregion

  UpdateColumnState(column: ColumnDefinition, columnState: ColumnState) {
    this.columnStateDictionary[column.propertyKey] = columnState;
  }

  quickSearchProcess() {
    const allKeysPath = this.propertiesToArray(this.baseRowData[0]);
    let filteredArray = [];
    for (let i = 0; i < this.baseRowData.length; i++) {
      const element = this.baseRowData[i];
      let exit: boolean = false;
      for (let index = 0; index < allKeysPath.length; index++) {
        const key = allKeysPath[index];
        let prop = this.getPropertyByStringPath(element, key);
        if (
          prop &&
          !Array.isArray(prop) &&
          prop
            .toString()
            .toLowerCase()
            .includes(this.quickSearch.toString().toLowerCase())
        ) {
          filteredArray.push(element);
          exit = true;
          break;
        }
      }
      if (exit) {
        exit = false;
        continue;
      }
    }

    this.rowData = filteredArray;
  }

  getPropertyByStringPath(object: any, keyPath: string) {
    keyPath = keyPath.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
    keyPath = keyPath.replace(/^\./, ''); // strip a leading dot
    var a = keyPath.split('.');
    for (var i = 0, n = a.length; i < n; ++i) {
      var k = a[i];
      if (k in object) {
        object = object[k];
      } else {
        return;
      }
    }
    return object;
  }

  propertiesToArray(obj: any) {
    const isObject = (val: any) =>
      typeof val === 'object' && !Array.isArray(val);

    const addDelimiter = (a: any, b: any) => (a ? `${a}.${b}` : b);

    const paths: any = (obj = {}, head = '') => {
      return Object.entries(obj).reduce((product, [key, value]) => {
        let fullPath = addDelimiter(head, key);
        return isObject(value)
          ? product.concat(paths(value, fullPath))
          : product.concat(fullPath);
      }, []);
    };

    return paths(obj);
  }

  filterPopUpCoordinates: { x: number; y: number };
  onFilterClick(header: ColumnDefinition, event: any) {
    event.stopPropagation();
    this.filterPopUpCoordinates = {
      x: event.clientX - 50,
      y: event.clientY + 15,
    };
    this.currentColDef = header;
  }

  filterByColumn(value: string) {
    if (!value) {
      this.rowData = [...this.baseRowData];
      return;
    }

    this.rowData = this.rowData.filter((x) =>
      x[this.currentColDef.propertyKey].toString().includes(value)
    );
  }

  //#region Resizing
  previousDifference: number = 0;
  counter: number = 0;
  startClientX: number = 0;
  currentColDef: ColumnDefinition;
  listenToResizeEvent() {
    if (!this.defaultOptions.resizable) {
      return;
    }

    this.renderer2.listen('document', 'mousemove', (event) => {
      if (this.counter === 0) {
        return;
      }
      this.currentColDef.width! +=
        event.clientX - this.startClientX - this.previousDifference;
      this.previousDifference = event.clientX - this.startClientX;
    });
  }

  start(event: any, colDef: ColumnDefinition) {
    if (++this.counter > 1) {
      return;
    }

    this.currentColDef = colDef;
    this.startClientX = event.clientX;
  }

  end(event: any) {
    if (this.counter === 0) {
      return;
    }

    this.UpdateColumnState(this.currentColDef, {
      width: this.currentColDef.width!,
      sortBy: this.columnStateDictionary[this.currentColDef.propertyKey].sortBy,
    });

    this.rowResized.next({
      columnDefinition: this.currentColDef,
      columnState: this.columnStateDictionary[this.currentColDef.propertyKey],
    });
    this.counter = 0;
    this.previousDifference = 0;
  }
  //#endregion
}
