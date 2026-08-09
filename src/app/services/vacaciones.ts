import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SolicitudVacaciones {
  id?: number;
  usuario?: any;
  fechaInicio: string;
  fechaFin: string;
  diasSolicitados?: number;
  diasLaborablesCalculados?: number;
  estado?: string;
  motivoRechazo?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VacacionesService {
  private apiEmpleadoUrl = 'http://localhost:8080/api/empleado';
  private apiAdminUrl = 'http://localhost:8080/api/admin';
  private apiUsuariosUrl = 'http://localhost:8080/api/usuarios';
  private apiPuestosUrl = 'http://localhost:8080/api/puestos';
  private apiDelegacionesUrl = 'http://localhost:8080/api/delegaciones';
  private apiFestivosUrl = 'http://localhost:8080/api/festivos';

  constructor(private http: HttpClient) {}

  // ==========================================
  // PANEL DEL EMPLEADO
  // ==========================================
  getMisSolicitudes(): Observable<any> {
    return this.http.get(`${this.apiEmpleadoUrl}/solicitudes`);
  }

  solicitarVacaciones(fechaInicio: string, fechaFin: string): Observable<any> {
    return this.http.post(`${this.apiEmpleadoUrl}/solicitar`, { fechaInicio, fechaFin });
  }

  // ==========================================
  // PANEL DEL ADMINISTRADOR - SOLICITUDES
  // ==========================================
  getSolicitudesPendientes(): Observable<any> {
    return this.http.get(`${this.apiAdminUrl}/pendientes`);
  }

  getTodasLasSolicitudes(): Observable<any> {
    return this.http.get(`${this.apiAdminUrl}/solicitudes`);
  }

  // Alias para mantener compatibilidad si el componente llama a getTodasSolicitudes()
  getTodasSolicitudes(): Observable<any> {
    return this.getTodasLasSolicitudes();
  }

  resolverSolicitud(id: number, accion: string, motivoRechazo?: string): Observable<any> {
    return this.http.post(`${this.apiAdminUrl}/resolver/${id}`, { accion, motivoRechazo });
  }

  // ==========================================
  // GESTIÓN DE USUARIOS
  // ==========================================
  getUsuarios(): Observable<any> {
    return this.http.get(this.apiUsuariosUrl);
  }

  guardarUsuario(usuario: any): Observable<any> {
    if (usuario.id) {
      // ✅ Cambiado a PATCH para evitar el error "Method PUT is not supported"
      return this.http.patch(`${this.apiUsuariosUrl}/${usuario.id}`, usuario);
    }
    return this.http.post(this.apiUsuariosUrl, usuario);
  }

  actualizarUsuario(id: number, usuario: any): Observable<any> {
    // ✅ Cambiado a PATCH
    return this.http.patch(`${this.apiUsuariosUrl}/${id}`, usuario);
  }

  eliminarUsuario(id: number): Observable<any> {
    return this.http.delete(`${this.apiUsuariosUrl}/${id}`);
  }

  // ==========================================
  // GESTIÓN DE PUESTOS
  // ==========================================
  getPuestos(): Observable<any> {
    return this.http.get(this.apiPuestosUrl);
  }

  guardarPuesto(puesto: any): Observable<any> {
    if (puesto.id) {
      return this.http.patch(`${this.apiPuestosUrl}/${puesto.id}`, puesto);
    }
    return this.http.post(this.apiPuestosUrl, puesto);
  }

  eliminarPuesto(id: number): Observable<any> {
    return this.http.delete(`${this.apiPuestosUrl}/${id}`);
  }

  // ==========================================
  // GESTIÓN DE DELEGACIONES
  // ==========================================
  getDelegaciones(): Observable<any> {
    return this.http.get(this.apiDelegacionesUrl);
  }

  guardarDelegacion(delegacion: any): Observable<any> {
    if (delegacion.id) {
      return this.http.patch(`${this.apiDelegacionesUrl}/${delegacion.id}`, delegacion);
    }
    return this.http.post(this.apiDelegacionesUrl, delegacion);
  }

  eliminarDelegacion(id: number): Observable<any> {
    return this.http.delete(`${this.apiDelegacionesUrl}/${id}`);
  }

  // ==========================================
  // GESTIÓN DE FESTIVOS
  // ==========================================
  getFestivos(): Observable<any> {
    return this.http.get(this.apiFestivosUrl);
  }

  guardarFestivo(festivo: any): Observable<any> {
    if (festivo.id) {
      return this.http.patch(`${this.apiFestivosUrl}/${festivo.id}`, festivo);
    }
    return this.http.post(this.apiFestivosUrl, festivo);
  }

  eliminarFestivo(id: number): Observable<any> {
    return this.http.delete(`${this.apiFestivosUrl}/${id}`);
  }
}
