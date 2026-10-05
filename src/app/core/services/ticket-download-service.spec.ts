import { TestBed } from '@angular/core/testing';

import { TicketDownloadService } from './ticket-download-service';

describe('TicketDownloadService', () => {
  let service: TicketDownloadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TicketDownloadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
