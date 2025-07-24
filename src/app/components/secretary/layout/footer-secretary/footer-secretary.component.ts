import { Component } from '@angular/core';
import { materialImports } from '../../../../material.imports';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer-secretary',
  imports: [materialImports, RouterLink],
  templateUrl: './footer-secretary.component.html',
  styleUrl: './footer-secretary.component.css'
})
export class FooterSecretaryComponent {

}
