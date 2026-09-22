import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsDashboardPage } from './reports-dashboard.page';

describe('ReportsDashboardPage', () => {
  let component: ReportsDashboardPage;
  let fixture: ComponentFixture<ReportsDashboardPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsDashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
