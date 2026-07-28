import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api'; // 👈 Ajusta la ruta a tu api.ts si cambia de carpeta

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  email: string = '';
  contrasena: string = '';
  errorMensaje: string = '';

  constructor(
    private apiService: ApiService, // 👈 Inyectamos la API
    private router: Router,
  ) {}

  onLogin(): void {
    this.errorMensaje = '';

    if (!this.email || !this.contrasena) {
      this.errorMensaje = 'Por favor, rellena todos los campos.';
      return;
    }

    // Petición real a Spring Boot / Neon DB
    this.apiService.login(this.email, this.contrasena).subscribe({
      next: (usuario) => {
        // Guardamos los datos de sesión en el navegador
        localStorage.setItem('usuario', JSON.stringify(usuario));

        // Redirigimos según el ROL REAL guardado en Neon
        if (usuario.rol === 'Admin' || usuario.rol === 'ADMIN') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/empleado']);
        }
      },
      error: (err) => {
        // Si el correo no existe o la clave no coincide, rebotará aquí
        this.errorMensaje = err.error?.error || 'Error de conexión con el servidor.';
      },
    });
  }
}
