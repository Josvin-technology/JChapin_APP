import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventsMapPage } from './events-map.page';

describe('EventsMapPage', () => {
  let component: EventsMapPage;
  let fixture: ComponentFixture<EventsMapPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventsMapPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
