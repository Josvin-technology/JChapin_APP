import { Component, Input, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { IonIcon } from '@ionic/angular/standalone';
import {
  calendarOutline,
  chevronForwardOutline,
  documentTextOutline,
  exitOutline,
  heartOutline,
  settingsOutline,
  ticketOutline,
} from 'ionicons/icons';
import { ProfileMenuAction } from 'src/app/core/models/profile.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile-menu-item',
  templateUrl: './profile-menu-item.component.html',
  styleUrls: ['./profile-menu-item.component.scss'],
  imports: [IonIcon, RouterLink],
})
export class ProfileMenuItemComponent implements OnInit {
  @Input({ required: true }) item!: ProfileMenuAction;

  constructor() {
    addIcons({
      calendarOutline,
      chevronForwardOutline,
      documentTextOutline,
      exitOutline,
      heartOutline,
      settingsOutline,
      ticketOutline,
    });
  }

  ngOnInit() {}
}
