import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api'; 

  constructor(private http: HttpClient) {}

  // --- USUARIOS ---
  getUsuarios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/usuarios`);
  }
  guardarUsuario(usuario: any): Observable<any> {
    if (usuario.id) {
      return this.http.put<any>(`${this.baseUrl}/usuarios/${usuario.id}`, usuario);
    }
    return this.http.post<any>(`${this.baseUrl}/usuarios`, usuario);
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

  // --- VACACIONES (CORREGIDO PARA COINCIDIR CON TUS CONTROLADORES JAVA) ---
  
  // Apunta a: http://localhost:8080/api/admin/pendientes
  getSolicitudesPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/admin/pendientes`);
  }

  // Apunta a: http://localhost:8080/api/admin/resolver/{id}
  resolverSolicitud(id: number, accion: 'Aprobado' | 'Rechazado', motivo?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/admin/resolver/${id}`, {
      accion: accion,             // Coincide con payload.get("accion") en Java
      motivoRechazo: motivo || '' // Coincide con payload.get("motivoRechazo") en Java
    });
  }

  // Apunta a: http://localhost:8080/api/empleado/solicitudes (Para usar en el calendario global)
  getMisSolicitudes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/empleado/solicitudes`);
  }
}