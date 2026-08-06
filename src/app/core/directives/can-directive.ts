import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { PermissionService } from '../services/permission-service';
import { AppPermission } from '../models/permission.model';

@Directive({
  selector: '[appCan]',
})
export class CanDirective {
  private Permissions = inject(PermissionService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  appCan = input.required<AppPermission>();

  private isRedered = false;

  constructor() {
    effect(() => {
      const allowed = this.Permissions.can(this.appCan());

      if (allowed && !this.isRedered) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isRedered = true;
      } else if (!allowed && this.isRedered) {
        this.viewContainer.clear();
        this.isRedered = false;
      }
    });
  }
}
