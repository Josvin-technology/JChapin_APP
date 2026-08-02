import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  imports: [CommonModule, IonIcon],
})
export class CategoryComponent {
  @Input({ required: true }) label: string = '';
  @Input({ required: true }) icon: string = '';
  @Input() active: boolean = false;

  @Output() btnClicked = new EventEmitter<string>();

  onClick() {
    this.btnClicked.emit(this.label);
  }
}
