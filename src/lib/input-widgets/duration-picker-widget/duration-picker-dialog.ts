import {Component, HostBinding, Inject, ViewEncapsulation} from '@angular/core'
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material'
import {DurationPickerFieldsState, DurationPickerState} from './duration-picker-state'

export class DurationPickerDialogResult {
  success: boolean
  millis: number
}

@Component({
  selector:      'duration-picker-dialog',
  templateUrl:   './duration-picker-dialog.html',
  encapsulation: ViewEncapsulation.None
})
export class DurationPickerDialog {

  @HostBinding('attr.flex') flex = '';
  @HostBinding('attr.layout') flexLayout = 'column';
  @HostBinding('attr.layout-align') flexLayoutAlign = 'start';


  state: DurationPickerState

  result = new DurationPickerDialogResult()


  constructor(public dialogRef: MdDialogRef<DurationPickerDialog>, @Inject(MD_DIALOG_DATA) private data: any) {
    this.state = data.state
  }

  onValueChange(field: DurationPickerFieldsState) {
    console.log('DurationPickerDialog', 'onValueChange', field)
  }

  onCancelRequest() {
    this.dialogRef.close(this.result)
  }

  onOkRequest() {
    this.result.success = true
    this.result.millis = this.state.millis
    this.dialogRef.close(this.result)
  }
}
