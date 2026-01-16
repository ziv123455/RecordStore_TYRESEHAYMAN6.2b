import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordEdit } from './record-edit';

describe('RecordEdit', () => {
  let component: RecordEdit;
  let fixture: ComponentFixture<RecordEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordEdit);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
