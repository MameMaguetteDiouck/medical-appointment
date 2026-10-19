import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSecretaryComponent } from './home-secretary.component';

describe('HomeSecretaryComponent', () => {
  let component: HomeSecretaryComponent;
  let fixture: ComponentFixture<HomeSecretaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSecretaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeSecretaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
