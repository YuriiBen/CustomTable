import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { PinnedOptions } from '../shared/enums/PinnedOptions';
import { SortBy } from '../shared/enums/SortBy';
import { TypeName } from '../shared/enums/TypeName';
import { CellClicked } from '../shared/models/CellClicked';
import { CellValueChanged } from '../shared/models/CellValueChanged';
import {
  ColumnDefinition,
  SetDefaultValuesIfNotPresent,
} from '../shared/models/ColumnDefinition';
import { ColumnSorted } from '../shared/models/ColumnSorted';
import { ColumnState } from '../shared/models/ColumnState';
import { RowResized as RowResized } from '../shared/models/RowResized';
import { TableApi } from '../shared/models/TableApi';
import { TableConfiged } from '../shared/models/TableConfiged';
import { DefaultOptions } from './../shared/models/DefaultOptions';

@Component({
  selector: 'custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss'],
})
export class CustomTableComponent implements OnInit, OnChanges {
  //#region props
  grouppedColumnDefs: {
    pinnedTo: PinnedOptions;
    columnDefinitions: ColumnDefinition[];
  }[] = [
    { pinnedTo: PinnedOptions.Left, columnDefinitions: [] },
    { pinnedTo: PinnedOptions.None, columnDefinitions: [] },
    { pinnedTo: PinnedOptions.Right, columnDefinitions: [] },
  ];
  baseRowData: any[];
  columnStateDictionary: { [propertyKey: string]: ColumnState } = {};
  @Input() defaultOptions: DefaultOptions;
  @Input() quickSearch: string = '';
  @Input() columnDefinitions: ColumnDefinition[];
  @Input() rowData: any[];
  @Input() tableApi: TableApi;
  @Output() tableReady: EventEmitter<TableConfiged> = new EventEmitter();
  @Output() cellValueChanged: EventEmitter<CellValueChanged> =
    new EventEmitter();
  @Output() cellClicked: EventEmitter<CellClicked> = new EventEmitter();
  @Output() rowResized: EventEmitter<RowResized> = new EventEmitter();
  @Output() columnSorted: EventEmitter<ColumnSorted> = new EventEmitter();

  @ViewChild('filteringContainer') filteringContainer: ElementRef;
  //#endregion
  //#region config
  constructor(private renderer2: Renderer2, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.listenToResizeEvent();
    this.listenToClickFilterPopup();
    this.baseRowData = [...this.rowData];
    this.colDefConfig();
    this.tableReady.emit({
      rowData: this.rowData,
      columnDefinitions: this.columnDefinitions,
    });
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

        this.grouppedColumnDefs
          .find((x) => x.pinnedTo === colDef.pinnedOption)
          ?.columnDefinitions.push(colDef);
      });
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
      this.columnSorted.next({
        columnDefinition: this.currentColDef,
        columnState: this.columnStateDictionary[header.propertyKey],
        sortOption: SortBy[currentSortOption],
      });
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

    this.columnSorted.next({
      columnDefinition: this.currentColDef,
      columnState: this.columnStateDictionary[header.propertyKey],
      sortOption: SortBy[currentSortOption],
    });
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

  filterPopUpCoordinates: any; //{ x: number; y: number };

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

    this.rowData = this.baseRowData.filter((x) =>
      x[this.currentColDef.propertyKey]
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    this.filterPopUpCoordinates = null;
    this.columnDefinitions.forEach(
      (colDef: ColumnDefinition) => (colDef.filteringDetails = undefined)
    );
    this.currentColDef.filteringDetails = {
      isFiltered: true,
      contains: value,
    };
  }

  clearFilterOnHeader() {
    if (!this.currentColDef.filteringDetails) {
      return;
    }
    this.filterPopUpCoordinates = null;
    this.currentColDef.filteringDetails = undefined;
    this.rowData = [...this.baseRowData];
  }

  listenToClickFilterPopup() {
    this.renderer2.listen('window', 'click', (e: Event) => {
      if (!this.filteringContainer) {
        return;
      }
      let success: boolean = false;
      if (e.target == this.filteringContainer.nativeElement) {
        success = true;
      } else {
        for (
          let index = 0;
          index < this.filteringContainer.nativeElement.children.length;
          index++
        ) {
          const element = this.filteringContainer.nativeElement.children[index];
          if (e.target == element) {
            success = true;
          }
        }
      }
      if (!success) {
        this.filterPopUpCoordinates = null;
        this.currentColDef.filteringDetails = undefined;
      }
    });
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

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    enum DirectionEnum {
      Vertical,
      Horizontal,
    }

    enum KeyboardEnum {
      Left = 'ArrowLeft',
      Right = 'ArrowRight',
      Up = 'ArrowUp',
      Down = 'ArrowDown',
    }

    function increment(value: number) {
      return ++value;
    }
    function decrement(value: number) {
      return --value;
    }

    const possibleKeys = [
      {
        key: KeyboardEnum.Left,
        action: decrement,
        direction: DirectionEnum.Horizontal,
      },
      {
        key: KeyboardEnum.Right,
        action: increment,
        direction: DirectionEnum.Horizontal,
      },
      {
        key: KeyboardEnum.Up,
        action: decrement,
        direction: DirectionEnum.Vertical,
      },
      {
        key: KeyboardEnum.Down,
        action: increment,
        direction: DirectionEnum.Vertical,
      },
    ];

    let currentAction = possibleKeys.find(
      (x) => x.key.toString() === event.key
    );
    if (!currentAction) {
      return;
    }
    let visibleColumns = this.columnDefinitions.filter((x) => !x.hidden);

    let selectedColumnIndex = visibleColumns.findIndex((x) => x.isSelected);
    let selectedRowIndex = this.rowData.findIndex((x) => x.isSelected);

    if (currentAction.direction === DirectionEnum.Vertical) {
      if (
        (selectedRowIndex === this.rowData.length - 1 &&
          currentAction.key === KeyboardEnum.Down) ||
        (selectedRowIndex === 0 && currentAction.key === KeyboardEnum.Up)
      ) {
        return;
      }

      this.rowData[selectedRowIndex].isSelected = false;
      this.rowData[currentAction.action(selectedRowIndex)].isSelected = true;
    } else {
      if (
        (selectedColumnIndex === visibleColumns.length - 1 &&
          currentAction.key === KeyboardEnum.Right) ||
        (selectedColumnIndex === 0 && currentAction.key === KeyboardEnum.Left)
      ) {
        return;
      }
      visibleColumns[selectedColumnIndex].isSelected = false;
      visibleColumns[currentAction.action(selectedColumnIndex)].isSelected =
        true;
    }
  }
}
