import { Component, inject } from '@angular/core';
import { Auth, AuthErrorCodes, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { materialImports } from '../../../material.imports';
import { CommonModule } from '@angular/common';
import { Patient } from '../../../shared/interfaces/patient';
import { PatientService } from '../../../shared/services/patient.service';

@Component({
  selector: 'app-sign-up',
  imports: [materialImports, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  authForm!: FormGroup;

  patientObj: Patient = {
    id: '',
    firstName: '',
    lastName: '',
    address: '',
    phone: 0,
    birthDate: undefined,
    email: '',
    description: '',
    status: 'patient',
  }

  //instancier le auth
  auth = inject(Auth);

  isSubmissionInProgress: boolean = false;
  falg: boolean = false;
  errorMessage: string = '';
  constructor(private router: Router, private data: PatientService) {
    this.intitForm();
  }
  intitForm() {
    this.authForm = new FormGroup({
      firstName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      lastName: new FormControl('', [Validators.required, Validators.minLength(2)]),
      address: new FormControl('', [Validators.required, Validators.minLength(2)]),
      description: new FormControl('', [Validators.required, Validators.minLength(25)]),
      birthDate: new FormControl('', Validators.required),
      phone: new FormControl('', [Validators.required, Validators.pattern(/^(?:\+221|00221)?7[05678]\d{7}$/)]),
      email: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
      passwordConfirmed: new FormControl('', Validators.required),
    })
  }

  onSubmit() {
    if (this.authForm.invalid)
      return;

    if (this.authForm.value.password != this.authForm.value.passwordConfirmed) {
      this.errorMessage = 'Confirmez votre password...';
      console.log(this.authForm.value.password, this.authForm.value.passwordConfirmed);
      return;
    }
    
    this.isSubmissionInProgress = true;

    createUserWithEmailAndPassword(this.auth, this.authForm.value.email, this.authForm.value.password)
      .then(response => {
        const patientId = response.user.uid;
        const { passwordConfirmed, password, ...rest } = this.authForm.value;
        this.patientObj = {
          ...rest,
          id: patientId,
          status: 'patients'
        };
        console.log('', this.patientObj);

        this.data.addPatient(this.patientObj)
          .then(() => {
            this.redirectToDashboardPage();
          })
      })
      .catch(error => {
        this.isSubmissionInProgress = false;
        console.error('error', error);
        if (error instanceof Error) {
          if (error.message.includes(AuthErrorCodes.INVALID_EMAIL)) {
            this.errorMessage = 'L\'email n\'est pas valide.';
          } else if (error.message.includes('auth/invalid-credential')) {
            this.errorMessage = 'Email ou Password invalide.';
          } else if (error.message.includes(AuthErrorCodes.WEAK_PASSWORD)) {
            this.errorMessage = 'Entrez un password robuste.';
          } else if (error.message.includes(AuthErrorCodes.EMAIL_EXISTS)) {
            this.errorMessage = 'Cet email est utilisé par un autre utilisateur.';
          } else {
            this.errorMessage = 'quelque chose a mal tourné, veuillez réessayer.';
          }
        }
      });

  }
  redirectToDashboardPage() {
    this.router.navigate(['/patients/']);
  }

}
