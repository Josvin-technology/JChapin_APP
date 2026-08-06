import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-footer-step',
  templateUrl: './footer-step.component.html',
  styleUrls: ['./footer-step.component.scss'],
  imports: [IonIcon],
})
export class FooterStepComponent implements OnInit {
  @Input({ required: true }) step = 1;
  @Input({ required: true }) totalSteps = 4;
  @Input({ required: true }) endStep: boolean = false;
  @Input() loading: boolean = false;

  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  ngOnInit() {}
}
