import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminUserDetailPage } from './admin-user-detail.page';

describe('AdminUserDetailPage', () => {
  let component: AdminUserDetailPage;
  let fixture: ComponentFixture<AdminUserDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUserDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
