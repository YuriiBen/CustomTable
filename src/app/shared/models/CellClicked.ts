import { ColumnDefinition } from './ColumnDefinition';

export class CellClicked {
  columnDefinition: ColumnDefinition;
  rowData: any;
  value: string;
}
