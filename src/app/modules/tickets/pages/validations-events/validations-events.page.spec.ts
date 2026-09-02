import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationsEventsPage } from './validations-events.page';

describe('ValidationsEventsPage', () => {
  let component: ValidationsEventsPage;
  let fixture: ComponentFixture<ValidationsEventsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ValidationsEventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
