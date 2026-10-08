import { Component, OnInit } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular/standalone';

import { BottomTabBarComponent } from 'src/app/shared/components/bottom-tab-bar/bottom-tab-bar.component';

@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  imports: [IonRouterOutlet, BottomTabBarComponent],
})
export class MainLayoutComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
