import { TestBed } from '@angular/core/testing';

import { StockChangeService } from './stock-change-service';

describe('StockChangeService', () => {
  let service: StockChangeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockChangeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
