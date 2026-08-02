import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { HeroSearchComponent } from '../../components/hero-search/hero-search.component';
import { CategoryListComponent } from '../../components/category-list/category-list.component';
import { EventListComponent } from '../../components/event-list/event-list.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    HeroSearchComponent,
    CategoryListComponent,
    EventListComponent,
   
    
  ],
})
export class HomePage implements OnInit {
  constructor() {}

  ngOnInit() {}
}
