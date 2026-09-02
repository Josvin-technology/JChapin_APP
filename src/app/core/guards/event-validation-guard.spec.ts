import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { eventValidationGuard } from './event-validation-guard';

describe('eventValidationGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => eventValidationGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
