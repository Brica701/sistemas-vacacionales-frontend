import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, SolicitudPermiso, EstadoSolicitud } from '../models/empresa.model';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // --- USUARIOS ---
  getUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/usuarios`);
  }

  guardarUsuario(usuario: Usuario): Observable<Usuario> {
    if (usuario.id) {
      return this.http.put<Usuario>(`${this.baseUrl}/usuarios/${usuario.id}`, usuario);
    }
    return this.http.post<Usuario>(`${this.baseUrl}/usuarios`, usuario);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/usuarios/${id}`);
  }

  // --- PUESTOS ---
  getPuestos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/puestos`);
  }

  guardarPuesto(puesto: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/puestos`, puesto);
  }

  eliminarPuesto(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/puestos/${id}`);
  }

  // --- DELEGACIONES ---
  getDelegaciones(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/delegaciones`);
  }

  guardarDelegacion(delegacion: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/delegaciones`, delegacion);
  }

  eliminarDelegacion(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/delegaciones/${id}`);
  }

  // --- FESTIVOS ---
  getFestivos(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/festivos`);
  }

  guardarFestivo(festivo: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/festivos`, festivo);
  }

  eliminarFestivo(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/festivos/${id}`);
  }

  // --- VACACIONES Y SOLICITUDES ---

  getSolicitudesPendientes(): Observable<SolicitudPermiso[]> {
    return this.http.get<SolicitudPermiso[]>(`${this.baseUrl}/admin/pendientes`);
  }

  resolverSolicitud(
    id: number,
    accion: EstadoSolicitud | 'Aprobado' | 'Rechazado',
    motivo?: string,
  ): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/resolver/${id}`, {
      accion: accion,
      motivoRechazo: motivo || '',
    });
  }

  getMisSolicitudes(): Observable<SolicitudPermiso[]> {
    return this.http.get<SolicitudPermiso[]>(`${this.baseUrl}/empleado/solicitudes`);
  }

  solicitarVacaciones(payload: Partial<SolicitudPermiso>): Observable<SolicitudPermiso> {
    return this.http.post<SolicitudPermiso>(`${this.baseUrl}/empleado/solicitar`, payload);
  }

  getTodasSolicitudes(): Observable<SolicitudPermiso[]> {
    return this.http.get<SolicitudPermiso[]>(`${this.baseUrl}/vacaciones`);
  }

  // --- AUTENTICACIÓN ---
  login(email: string, contrasena: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/auth/login`, {
      email: email,
      password: contrasena,
    });
  }
}
