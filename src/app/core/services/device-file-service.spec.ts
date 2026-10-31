import { TestBed } from '@angular/core/testing';

import { DeviceFileService } from './device-file-service';

describe('DeviceFileService', () => {
  let service: DeviceFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
