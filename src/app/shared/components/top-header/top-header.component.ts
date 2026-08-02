import { Component, OnInit } from '@angular/core';
import { IonIcon } from "@ionic/angular/standalone";    
import {addIcons} from "ionicons"
import { locationOutline, locationSharp } from 'ionicons/icons';

@Component({
  selector: 'app-top-header',
  templateUrl: './top-header.component.html',
  styleUrls: ['./top-header.component.scss'],
  imports: [IonIcon]
})
export class TopHeaderComponent  implements OnInit {
  locationIcon = locationSharp;

  constructor() { 
    addIcons({ locationSharp , locationOutline});
  }

  ngOnInit() {}

}
