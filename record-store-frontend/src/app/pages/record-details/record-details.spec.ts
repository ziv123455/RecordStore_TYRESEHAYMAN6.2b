import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordDetails } from './record-details';

describe('RecordDetails', () => {
  let component: RecordDetails;
  let fixture: ComponentFixture<RecordDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
