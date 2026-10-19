import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValidateAppointementComponent } from './validate-appointement.component';

describe('ValidateAppointementComponent', () => {
  let component: ValidateAppointementComponent;
  let fixture: ComponentFixture<ValidateAppointementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidateAppointementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValidateAppointementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
