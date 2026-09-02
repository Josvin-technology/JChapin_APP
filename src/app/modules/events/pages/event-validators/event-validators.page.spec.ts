import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventValidatorsPage } from './event-validators.page';

describe('EventValidatorsPage', () => {
  let component: EventValidatorsPage;
  let fixture: ComponentFixture<EventValidatorsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventValidatorsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
