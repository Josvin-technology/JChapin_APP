import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDocumentsPage } from './event-documents.page';

describe('EventDocumentsPage', () => {
  let component: EventDocumentsPage;
  let fixture: ComponentFixture<EventDocumentsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EventDocumentsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
