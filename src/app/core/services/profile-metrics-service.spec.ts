import { TestBed } from '@angular/core/testing';

import { ProfileMetricsService } from './profile-metrics-service';

describe('ProfileMetricsService', () => {
  let service: ProfileMetricsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProfileMetricsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
