import { TestBed } from '@angular/core/testing';

import { EventStaffService } from './event-staff-service';

describe('EventStaffService', () => {
  let service: EventStaffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventStaffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
