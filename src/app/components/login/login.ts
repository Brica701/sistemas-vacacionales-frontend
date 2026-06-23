import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // <-- IMPORTANTE: Importamos el enrutador para cambiar de pantalla

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  email: string = '';
  contrasena: string = '';
  errorMensaje: string = '';

  // Inyectamos el Router en el constructor para poder usarlo abajo
  constructor(private router: Router) {}

  onLogin(): void {
    this.errorMensaje = '';

    if (!this.email || !this.contrasena) {
      this.errorMensaje = 'Por favor, rellena todos los campos.';
      return;
    }
    
    // LOGIN SIMULADO TEMPORAL (Antes de conectar Spring Boot):
    // Si el correo que pones contiene la palabra "admin", te lleva al panel de administrador
    if (this.email.includes('admin')) {
      console.log('Entrando como Admin...');
      this.router.navigate(['/admin']); // <-- Cambia a la pantalla de administrador
    } else {
      // Si es cualquier otro correo, te lleva al de empleado
      console.log('Entrando como Empleado...');
      this.router.navigate(['/empleado']); // <-- Cambia a la pantalla de empleado
    }
  }
}