import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopQuickModal } from './top-quick-modal';

describe('TopQuickModal', () => {
  let component: TopQuickModal;
  let fixture: ComponentFixture<TopQuickModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopQuickModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopQuickModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
