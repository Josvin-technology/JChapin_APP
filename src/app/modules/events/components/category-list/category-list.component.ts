import { Component, signal } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  barbellOutline,
  briefcaseOutline,
  colorPaletteOutline,
  constructOutline,
  laptopOutline,
  leafOutline,
  musicalNotesOutline,
  peopleOutline,
  restaurantOutline,
} from 'ionicons/icons';
import { CategoryComponent } from '../category/category.component';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  imports: [CategoryComponent],
})
export class CategoryListComponent {
  activeCategory = signal('Música');

  categories = [
    { label: 'Música', icon: 'musical-notes-outline' },
    { label: 'Gastronomía', icon: 'restaurant-outline' },
    { label: 'Deportes', icon: 'barbell-outline' },
    { label: 'Arte', icon: 'color-palette-outline' },
    { label: 'Tecnología', icon: 'laptop-outline' },
    { label: 'Bienestar', icon: 'leaf-outline' },
    { label: 'Comunidad', icon: 'people-outline' },
    { label: 'Negocios', icon: 'briefcase-outline' },
  ];

  constructor() {
    addIcons({
      musicalNotesOutline,
      restaurantOutline,
      barbellOutline,
      colorPaletteOutline,
      laptopOutline,
      leafOutline,
      peopleOutline,
      briefcaseOutline,
      constructOutline,
    });
  }

  selectCategory(label: string) {
    this.activeCategory.set(label);
  }
}
