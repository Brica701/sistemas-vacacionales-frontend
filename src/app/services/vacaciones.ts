import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Estructura de datos idéntica a la que espera tu base de datos Neon y Spring Boot
export interface SolicitudVacaciones {
  id?: number;
  usuario?: any;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados?: number;
  estado?: string;
  motivoRechazo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VacacionesService {

  // URLs de tu backend en Spring Boot
  private apiEmpleadoUrl = 'http://localhost:8080/api/empleado';
  private apiAdminUrl = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) { }

  // Métodos para el panel del Empleado
  getMisSolicitudes(): Observable<any> {
    return this.http.get(`${this.apiEmpleadoUrl}/solicitudes`);
  }

  solicitarVacaciones(fechaInicio: string, fechaFin: string): Observable<any> {
    return this.http.post(`${this.apiEmpleadoUrl}/solicitar`, { fechaInicio, fechaFin });
  }

  // Métodos para el panel del Administrador
  getSolicitudesPendientes(): Observable<any> {
    return this.http.get(`${this.apiAdminUrl}/pendientes`);
  }

  resolverSolicitud(id: number, accion: string, motivoRechazo?: string): Observable<any> {
    return this.http.post(`${this.apiAdminUrl}/resolver/${id}`, { accion, motivoRechazo });
  }
}