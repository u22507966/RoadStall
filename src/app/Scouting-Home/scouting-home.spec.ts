import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InspectionsMain } from './scouting-home';

describe('InspectionsMain', () => {
  let component: InspectionsMain;
  let fixture: ComponentFixture<InspectionsMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InspectionsMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InspectionsMain);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
