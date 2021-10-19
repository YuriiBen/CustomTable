import { TypeName } from '../enums/TypeName';
import { capitalizeFirstLetter } from '../helpers';

export class ColumnDefinition {
  headerName?: string;
  propertyKey: string;
  editable?: boolean;
  width?: number; //px
  type?: TypeName; //for correct sorting


  isSelected?: boolean;
}

export function SetDefaultValuesIfNotPresent(colDef: ColumnDefinition) {
  if (!colDef.headerName) {
    colDef.headerName = capitalizeFirstLetter(colDef.propertyKey);
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
}
