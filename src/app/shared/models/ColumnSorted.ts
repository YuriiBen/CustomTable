import { SortBy } from '../enums/SortBy';
import { ColumnDefinition } from './ColumnDefinition';
import { ColumnState } from './ColumnState';

export class ColumnSorted {
  columnDefinition: ColumnDefinition;
  columnState: ColumnState;
  sortOption: string;
}
