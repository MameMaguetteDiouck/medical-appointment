import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarSecretaryComponent } from './navbar-secretary.component';

describe('NavbarSecretaryComponent', () => {
  let component: NavbarSecretaryComponent;
  let fixture: ComponentFixture<NavbarSecretaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarSecretaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavbarSecretaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
