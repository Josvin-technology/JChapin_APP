import { TestBed } from '@angular/core/testing';

import { ReportsExportService } from './reports-export-service';

describe('ReportsExportService', () => {
  let service: ReportsExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReportsExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
