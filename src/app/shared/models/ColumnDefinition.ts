import { PinnedOptions } from '../enums/PinnedOptions';
import { TypeName } from '../enums/TypeName';
import { capitalizeFirstLetter } from '../helpers';

export class ColumnDefinition {
  headerName?: string;
  propertyKey: string;
  editable?: boolean;
  sortable?: boolean;
  width?: number; //px
  type?: TypeName; //for correct sorting
  isSelected?: boolean;
  hidden?: boolean;
  pinnedOption?: PinnedOptions;
  filteringDetails?: FilteringDetails;
}
class FilteringDetails{
  isFiltered: boolean;
  contains: string;
}

export function SetDefaultValuesIfNotPresent(colDef: ColumnDefinition) {
  if (!colDef.headerName) {
    colDef.headerName = capitalizeFirstLetter(colDef.propertyKey);
  }

  if (!colDef.sortable) {
    colDef.sortable = false;
  }

  if (!colDef.editable) {
    colDef.editable = false;
  }

  if (!colDef.width) {
    colDef.width = 75;
  }

  if (!colDef.type) {
    colDef.type = TypeName.String;
  }

  if (!colDef.hidden) {
    colDef.hidden = false;
  }

  if (!colDef.pinnedOption) {
    colDef.pinnedOption = PinnedOptions.None;
  }
}
