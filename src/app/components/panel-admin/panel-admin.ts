import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-panel-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './panel-admin.html',
  styleUrl: './panel-admin.css',
})
export class PanelAdminComponent implements OnInit {
  // --- ARRAYS DE DATOS REALES ---
  usuarios: any[] = [];
  puestos: any[] = [];
  delegaciones: any[] = [];
  festivos: any[] = [];
  solicitudesPendientes: any[] = [];
  todasLasSolicitudes: any[] = []; // Contiene Aprobadas, Rechazadas y Pendientes

  // --- MODELOS PARA FORMULARIOS ---
  nuevoUsuario: any = {
    id: null,
    nombre: '',
    email: '',
    password: '',
    puesto: null,
    delegacion: null,
  };
  nuevoPuesto: any = { id: null, nombre: '' };
  nuevaDelegacion: any = { id: null, nombre: '', ciudad: '' };
  nuevoFestivo: any = { id: null, fecha: '', descripcion: '', delegacionId: '' };

  motivosRechazo: { [key: number]: string } = {};
  mensajeError: string = '';

  // --- VARIABLES DEL CALENDARIO GLOBAL ---
  fechaActual: Date = new Date();
  diasDelMes: (number | null)[] = [];
  nombresMeses: string[] = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  // --- CONTROL DE PESTAÑAS ---
  pestanaActiva: string = 'vacaciones'; // 'vacaciones' | 'usuarios' | 'puestos' | 'delegaciones' | 'festivos'

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef, // 👈 Inyectado para solucionar NG0100
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  // --- COMPARADOR PARA SELECTS EN ANGULAR ---
  compareFn(item1: any, item2: any): boolean {
    if (item1 === item2) return true;
    if (!item1 || !item2) return false;
    return item1.id === item2.id;
  }

  // --- CARGA DE DATOS DESDE EL BACKEND ---
  cargarDatos(): void {
    // 1. Cargar Usuarios
    this.apiService.getUsuarios().subscribe({
      next: (data: any[]) => (this.usuarios = data || []),
      error: (err) => console.error('Error al cargar usuarios:', err),
    });

    // 2. Cargar Puestos
    this.apiService.getPuestos().subscribe({
      next: (data: any[]) => (this.puestos = data || []),
      error: (err) => console.error('Error al cargar puestos:', err),
    });

    // 3. Cargar Delegaciones
    this.apiService.getDelegaciones().subscribe({
      next: (data: any[]) => (this.delegaciones = data || []),
      error: (err) => console.error('Error al cargar delegaciones:', err),
    });

    // 4. Cargar Festivos
    this.apiService.getFestivos().subscribe({
      next: (data: any[]) => (this.festivos = data || []),
      error: (err) => console.error('Error al cargar festivos:', err),
    });

    // 5. Cargar Solicitudes Pendientes de Vacaciones
    this.apiService.getSolicitudesPendientes().subscribe({
      next: (data: any[]) => (this.solicitudesPendientes = data || []),
      error: (err) => console.error('Error al cargar solicitudes pendientes:', err),
    });

    // 6. Cargar TODAS las solicitudes
    const reqTodas = this.apiService.getTodasSolicitudes
      ? this.apiService.getTodasSolicitudes()
      : this.apiService.getMisSolicitudes();

    reqTodas.subscribe({
      next: (data: any[]) => {
        this.todasLasSolicitudes = data || [];
        this.generarCalendario();
      },
      error: (err) => {
        console.error('Error al cargar todas las solicitudes:', err);
        this.generarCalendario();
      },
    });
  }

  cambiarPestana(pestana: string): void {
    this.pestanaActiva = pestana;
  }

  // --- CRUD REAL DE USUARIOS ---
  guardarUsuario(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email) return;

    // Validación: Contraseña obligatoria solo al crear (cuando no hay ID)
    if (!this.nuevoUsuario.id && !this.nuevoUsuario.password) {
      alert('Por favor, ingresa una contraseña temporal para el nuevo usuario.');
      return;
    }

    // 🛠️ Mapeo del payload para evitar error HTTP 500 en Spring Boot/API REST
    const usuarioPayload: any = {
      id: this.nuevoUsuario.id,
      nombre: this.nuevoUsuario.nombre,
      email: this.nuevoUsuario.email,
      puesto: this.nuevoUsuario.puesto,
      delegacion: this.nuevoUsuario.delegacion,
      // Si la API requiere los IDs planos en lugar de los objetos completos:
      puestoId: this.nuevoUsuario.puesto?.id || null,
      delegacionId: this.nuevoUsuario.delegacion?.id || null,
    };

    // Solo adjuntamos password si se está creando o si se escribió una nueva
    if (this.nuevoUsuario.password) {
      usuarioPayload.password = this.nuevoUsuario.password;
    }

    this.apiService.guardarUsuario(usuarioPayload).subscribe({
      next: () => {
        this.cargarDatos();
        this.resetUsuarioForm();
      },
      error: (err) => {
        console.error('Detalle del error al guardar usuario:', err);
        alert('Error al guardar el usuario: ' + (err.error?.message || err.message));
      },
    });
  }

  editarUsuario(u: any): void {
    const puestoEncontrado = this.puestos.find((p) => p.id === (u.puesto?.id ?? u.puesto)) || null;

    const delegacionEncontrada =
      this.delegaciones.find((d) => d.id === (u.delegacion?.id ?? u.delegacion)) || null;

    this.nuevoUsuario = {
      ...u,
      password: '', // Vaciamos por seguridad al editar
      puesto: puestoEncontrado,
      delegacion: delegacionEncontrada,
    };
  }

  eliminarUsuario(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      this.apiService.eliminarUsuario(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevoUsuario.id === id) {
            this.resetUsuarioForm();
          }
        },
        error: (err) => alert('Error al eliminar usuario'),
      });
    }
  }

  resetUsuarioForm(): void {
    this.nuevoUsuario = {
      id: null,
      nombre: '',
      email: '',
      password: '',
      puesto: null,
      delegacion: null,
    };
  }

  // --- CRUD REAL DE PUESTOS ---
  guardarPuesto(): void {
    if (!this.nuevoPuesto.nombre) return;

    this.apiService.guardarPuesto(this.nuevoPuesto).subscribe({
      next: () => {
        this.cargarDatos();
        this.resetPuestoForm();
      },
      error: (err) => alert('Error al guardar puesto'),
    });
  }

  editarPuesto(p: any): void {
    this.nuevoPuesto = { ...p };
  }

  eliminarPuesto(id: number): void {
    if (confirm('¿Deseas eliminar este puesto?')) {
      this.apiService.eliminarPuesto(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevoPuesto.id === id) {
            this.resetPuestoForm();
          }
        },
        error: (err) => alert('Error al eliminar puesto'),
      });
    }
  }

  resetPuestoForm(): void {
    this.nuevoPuesto = { id: null, nombre: '' };
  }

  // --- CRUD REAL DE DELEGACIONES ---
  guardarDelegacion(): void {
    if (!this.nuevaDelegacion.nombre) return;

    this.apiService.guardarDelegacion(this.nuevaDelegacion).subscribe({
      next: () => {
        this.cargarDatos();
        this.resetDelegacionForm();
      },
      error: (err) => alert('Error al guardar delegación'),
    });
  }

  editarDelegacion(d: any): void {
    this.nuevaDelegacion = { ...d };
  }

  eliminarDelegacion(id: number): void {
    if (confirm('¿Deseas eliminar esta delegación?')) {
      this.apiService.eliminarDelegacion(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevaDelegacion.id === id) {
            this.resetDelegacionForm();
          }
        },
        error: (err) => alert('Error al eliminar delegación'),
      });
    }
  }

  resetDelegacionForm(): void {
    this.nuevaDelegacion = { id: null, nombre: '', ciudad: '' };
  }

  // --- CRUD REAL DE FESTIVOS ---
  guardarFestivo(): void {
    if (!this.nuevoFestivo.fecha || !this.nuevoFestivo.descripcion) return;

    const valorDelegacion =
      this.nuevoFestivo.delegacionId !== '' && this.nuevoFestivo.delegacionId !== null
        ? Number(this.nuevoFestivo.delegacionId)
        : '';

    this.apiService
      .guardarFestivo({ ...this.nuevoFestivo, delegacionId: valorDelegacion })
      .subscribe({
        next: () => {
          this.cargarDatos();
          this.resetFestivoForm();
        },
        error: (err) => alert('Error al guardar el día festivo'),
      });
  }

  editarFestivo(f: any): void {
    this.nuevoFestivo = {
      ...f,
      delegacionId: f.delegacionId ?? f.delegacion?.id ?? '',
    };
  }

  eliminarFestivo(id: number): void {
    if (confirm('¿Deseas eliminar este festivo?')) {
      this.apiService.eliminarFestivo(id).subscribe({
        next: () => {
          this.cargarDatos();
          if (this.nuevoFestivo.id === id) {
            this.resetFestivoForm();
          }
        },
        error: (err) => alert('Error al eliminar festivo'),
      });
    }
  }

  resetFestivoForm(): void {
    this.nuevoFestivo = { id: null, fecha: '', descripcion: '', delegacionId: '' };
  }

  // --- GESTIÓN DE VACACIONES REALES ---
  resolver(id: number, accion: 'Aprobado' | 'Rechazado'): void {
    const motivo = this.motivosRechazo[id] || '';
    if (accion === 'Rechazado' && !motivo.trim()) {
      alert('Por favor, escribe un motivo para rechazar la solicitud.');
      return;
    }

    this.apiService.resolverSolicitud(id, accion, motivo).subscribe({
      next: () => {
        this.cargarDatos();
        delete this.motivosRechazo[id];
      },
      error: (err) => alert(err.error?.error || 'Error al procesar la acción en el servidor.'),
    });
  }

  // --- LÓGICA DEL CALENDARIO GLOBAL ---
  generarCalendario(): void {
    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const primerDiaSemana = new Date(año, mes, 1).getDay();
    const totalDias = new Date(año, mes + 1, 0).getDate();
    const inicioVacio = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

    const nuevosDias: (number | null)[] = [];
    for (let i = 0; i < inicioVacio; i++) nuevosDias.push(null);
    for (let dia = 1; dia <= totalDias; dia++) nuevosDias.push(dia);

    this.diasDelMes = nuevosDias;

    // 🛠️ Fuerza la sincronización de Angular para evitar NG0100
    this.cdr.detectChanges();
  }

  cambiarMes(direccion: number): void {
    this.fechaActual.setMonth(this.fechaActual.getMonth() + direccion);
    this.fechaActual = new Date(this.fechaActual);
    this.generarCalendario();
  }

  obtenerEmpleadosDeVacaciones(dia: number | null): string[] {
    if (!dia) return [];

    const año = this.fechaActual.getFullYear();
    const mes = this.fechaActual.getMonth();
    const fechaEvaluada = new Date(año, mes, dia).getTime();
    const empleadosEncontrados: string[] = [];

    for (const solicitud of this.todasLasSolicitudes) {
      if (solicitud.estado === 'Aprobado' && solicitud.fechaInicio && solicitud.fechaFin) {
        const inicio = new Date(solicitud.fechaInicio + 'T00:00:00').getTime();
        const fin = new Date(solicitud.fechaFin + 'T23:59:59').getTime();

        if (fechaEvaluada >= inicio && fechaEvaluada <= fin) {
          const nombreEmpleado =
            solicitud.usuario?.nombre || `Usuario #${solicitud.usuario?.id || '?'}`;
          if (!empleadosEncontrados.includes(nombreEmpleado)) {
            empleadosEncontrados.push(nombreEmpleado);
          }
        }
      }
    }
    return empleadosEncontrados;
  }
}
