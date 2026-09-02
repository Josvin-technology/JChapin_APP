import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketScannerPage } from './ticket-scanner.page';

describe('TicketScannerPage', () => {
  let component: TicketScannerPage;
  let fixture: ComponentFixture<TicketScannerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TicketScannerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
