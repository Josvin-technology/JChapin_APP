import { Component, Input, OnInit } from '@angular/core';
import { TicketModel } from 'src/app/core/models/ticket.model';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForwardOutline } from 'ionicons/icons';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ticket-card',
  templateUrl: './ticket-card.component.html',
  styleUrls: ['./ticket-card.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class TicketCardComponent implements OnInit {
  @Input() ticket!: TicketModel;

  chevronIcon = chevronForwardOutline;

  constructor() {
    addIcons({ chevronForwardOutline });
  }

  ngOnInit() {}
}
