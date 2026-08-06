import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ProfileRole } from 'src/app/core/models/profile.model';

@Component({
  selector: 'app-profile-role-switcher',
  templateUrl: './profile-role-switcher.component.html',
  styleUrls: ['./profile-role-switcher.component.scss'],
})
export class ProfileRoleSwitcherComponent implements OnInit {
  @Input({ required: true }) selectedRole: ProfileRole = 'user';
  @Output() selectedRoleChange = new EventEmitter<ProfileRole>();

  roles: { value: ProfileRole; label: string }[] = [
    { value: 'user', label: 'Usuario' },
    { value: 'organizer', label: 'Organizador' },
    { value: 'approver', label: 'Aprobador municipal' },
  ];

  constructor() {}

  ngOnInit() {}

  selectRole(role: ProfileRole) {
    this.selectedRoleChange.emit(role);
  }
}
