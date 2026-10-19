import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagementDoctorComponent } from './management-doctor.component';

describe('ManagementDoctorComponent', () => {
  let component: ManagementDoctorComponent;
  let fixture: ComponentFixture<ManagementDoctorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagementDoctorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagementDoctorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
