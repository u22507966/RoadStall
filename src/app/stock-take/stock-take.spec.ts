import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StockTakeClass } from './stock-take';

describe('StockTake', () => {
  let component: StockTakeClass;
  let fixture: ComponentFixture<StockTakeClass>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockTakeClass]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockTakeClass);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
