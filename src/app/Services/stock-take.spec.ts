import { TestBed } from '@angular/core/testing';

import { StockTake } from './stock-take';

describe('StockTake', () => {
  let service: StockTake;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StockTake);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
