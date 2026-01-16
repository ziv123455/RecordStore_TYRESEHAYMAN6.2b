import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordAdd } from './record-add';

describe('RecordAdd', () => {
  let component: RecordAdd;
  let fixture: ComponentFixture<RecordAdd>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordAdd]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordAdd);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
