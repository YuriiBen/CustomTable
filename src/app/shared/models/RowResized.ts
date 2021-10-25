import { ColumnDefinition } from './ColumnDefinition';
import { ColumnState } from './ColumnState';

export class RowResized {
  columnDefinition: ColumnDefinition;
  columnState: ColumnState;
}
