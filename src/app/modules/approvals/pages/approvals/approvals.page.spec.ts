import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApprovalsPage } from './approvals.page';

describe('ApprovalsPage', () => {
  let component: ApprovalsPage;
  let fixture: ComponentFixture<ApprovalsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ApprovalsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
