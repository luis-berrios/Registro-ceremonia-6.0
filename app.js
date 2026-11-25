const firebaseConfig = {
  apiKey: "AIzaSyCeD_E6IuZAraz8sEc4rKNAOh8kM1EfP9w",
  authDomain: "web-registro-ceremonias.firebaseapp.com",
  databaseURL: "https://web-registro-ceremonias-default-rtdb.firebaseio.com",
  projectId: "web-registro-ceremonias",
  storageBucket: "web-registro-ceremonias.firebasestorage.app",
  messagingSenderId: "884729117884",
  appId: "1:884729117884:web:3742985816fa338b9ea4b9"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

let datos = [];
let datosFiltrados = [];
const tablaBody = document.getElementById("tabla-body");
const timers = {};
let archivoCargado = null;
let contadorAtrasadosAnterior = 0;
const headerPrincipal = document.getElementById('header-principal');
let rolUsuario = null;
let nombreUsuario = "";

// Elementos del modal de rol
const modalRol = document.getElementById('modal-rol');
const opcionesRol = document.querySelectorAll('.opcion-rol');
const btnConfirmarRol = document.getElementById('btn-confirmar-rol');
const indicadorRol = document.getElementById('indicador-rol');

// Elementos del modal de contraseña
const modalContrasena = document.getElementById('modal-contrasena');
const inputContrasena = document.getElementById('input-contrasena');
const btnCancelarContrasena = document.getElementById('btn-cancelar-contrasena');
const btnVerificarContrasena = document.getElementById('btn-verificar-contrasena');

// Elementos del modal de cambio de usuario
const modalCambiarUsuario = document.getElementById('modal-cambiar-usuario');
const inputContrasenaCambio = document.getElementById('input-contrasena-cambio');
const btnCancelarCambio = document.getElementById('btn-cancelar-cambio');
const btnVerificarCambio = document.getElementById('btn-verificar-cambio');
const cambiarUsuarioBtn = document.getElementById('cambiar-usuario-btn');

// Elementos del chat
const chatContainer = document.getElementById('chat-container');
const chatHeader = document.getElementById('chat-header');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMinimizeBtn = document.getElementById('chat-minimize');
const chatCloseBtn = document.getElementById('chat-close');
const chatClearBtn = document.getElementById('chat-clear');

// Variables para control de notificaciones de chat
let ultimoMensajeTimestamp = 0;
let notificacionActiva = false;
let contadorMensajesNoVistos = 0;

// Elementos del contador
let contadorPresentes = document.getElementById('contador-presentes');
let contadorPuntual = document.getElementById('contador-puntual');
let contadorAtrasado = document.getElementById('contador-atrasado');
const contadorTotalElement = document.getElementById('contador-total');
const nombreArchivoElement = document.getElementById('nombre-archivo');
const inputExcel = document.getElementById('input-excel');
const horaEventoInput = document.getElementById('hora-evento');
const buscadorInput = document.getElementById('buscador');
const estadoConexion = document.getElementById('estado-conexion');

// Elementos del modal de restablecimiento
const btnRestablecerLinea = document.getElementById('btn-restablecer-linea');
const modalRestablecer = document.getElementById('modal-restablecer');
const inputRutRestablecer = document.getElementById('input-rut-restablecer');
const btnCancelarRestablecer = document.getElementById('btn-cancelar-restablecer');
const btnConfirmarRestablecer = document.getElementById('btn-confirmar-restablecer');

// Elementos del modal de protagonismo
const modalProtagonismo = document.getElementById('modal-protagonismo');
const tablaProtagonismoBody = document.getElementById('tabla-protagonismo-body');
const btnCerrarProtagonismo = document.getElementById('btn-cerrar-protagonismo');

// Elementos del modal de edición OBS
const obsHeader = document.getElementById('obs-header');
const modalEditarObs = document.getElementById('modal-editar-obs');
const inputRutEditarObs = document.getElementById('input-rut-editar-obs');
const selectTipoObs = document.getElementById('select-tipo-obs');
const btnCancelarEditarObs = document.getElementById('btn-cancelar-editar-obs');
const btnConfirmarEditarObs = document.getElementById('btn-confirmar-editar-obs');

// MEJORA N°2: Elemento para mostrar info de archivo
const fileInfoDisplay = document.getElementById('file-info-display');
const grupoExcel = document.getElementById('grupo-excel');

// MEJORA N°3: Elementos para atrasados
const btnVerAtrasados = document.getElementById('btn-ver-atrasados');
const modalAtrasados = document.getElementById('modal-atrasados');
const tablaAtrasadosBody = document.getElementById('tabla-atrasados-body');
const btnCerrarAtrasados = document.getElementById('cerrar-modal-atrasados');

// NUEVAS VARIABLES PARA LA FUNCIONALIDAD DE TACHADO
let tachadosUsuario = {};

// Variables para el indicador de estado de roles
const indicadorRoles = document.getElementById('indicador-roles');
const estadoRegistro = document.getElementById('estado-registro');
const estadoInvitados = document.getElementById('estado-invitados');
const estadoCoordinador = document.getElementById('estado-coordinador');
const estadoJefe = document.getElementById('estado-jefe');
let usuarioId = null;

// CONFIGURACIÓN DE COLUMNAS - NUEVO SISTEMA
const configColumnas = [
  {
    id: 'numero',
    titulo: 'N°',
    roles: ['registro', 'invitados', 'jefe', 'coordinador', 'secretario'],
    ancho: '5%',
    render: (fila) => fila.NUMERO
  },
  {
    id: 'rut',
    titulo: 'RUT',
    roles: ['registro', 'invitados', 'jefe', 'coordinador', 'secretario'],
    ancho: '12%',
    render: (fila) => fila.AlumnoRUT
  },
  {
    id: 'nombre',
    titulo: 'Nombre',
    roles: ['registro', 'invitados', 'jefe', 'coordinador', 'secretario'],
    ancho: '25%',
    render: (fila) => {
      const span = document.createElement('span');
      span.className = 'nombre-estudiante';
      span.setAttribute('data-rut', fila.AlumnoRUT);
      span.textContent = fila.Nombre;
      
      if (estaTachado(fila.AlumnoRUT)) {
        span.classList.add('nombre-tachado');
      }
      
      return span;
    }
  },
  {
    id: 'carrera',
    titulo: 'Carrera',
    roles: ['registro', 'invitados', 'jefe', 'coordinador', 'secretario'],
    ancho: '20%',
    render: (fila) => fila.Carrera
  },
  {
    id: 'ceremonia',
    titulo: 'Ceremonia',
    roles: ['registro', 'secretario'],
    ancho: '8%',
    render: (fila) => fila.Ceremonia
  },
  {
    id: 'asistencia',
    titulo: 'Asistencia',
    roles: ['registro', 'secretario'],
    ancho: '8%',
    render: (fila) => {
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'chk-asistencia';
      input.setAttribute('data-rut', fila.AlumnoRUT);
      input.checked = !!fila.LLEGADA;
      input.disabled = fila.DESHABILITADO;
      
      if (fila.DESHABILITADO) {
        input.style.backgroundColor = '#e0e0e0';
        input.style.borderColor = '#b0b0b0';
      }
      
      return input;
    }
  },
  {
    id: 'hora',
    titulo: 'Hora Llegada',
    roles: ['registro', 'secretario'],
    ancho: '10%',
    render: (fila) => fila.HORA || ''
  },
  {
    id: 'obs',
    titulo: 'OBS',
    roles: ['registro', 'secretario'],
    ancho: '12%',
    render: (fila) => fila.OBS || ''
  },
  {
    id: 'invitados',
    titulo: 'N° Invitados',
    roles: ['invitados', 'secretario'],
    ancho: '10%',
    render: (fila) => {
      const input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.className = 'input-invitados';
      input.value = fila.NumeroInvitados || '0';
      input.setAttribute('data-rut', fila.AlumnoRUT);
      
      input.addEventListener('change', (e) => {
        const numInvitados = parseInt(e.target.value) || 0;
        actualizarNumeroInvitados(fila.AlumnoRUT, numInvitados);
      });
      
      return input;
    }
  },
  {
    id: 'ordenAtrasado',
    titulo: 'Orden Atrasado',
    roles: ['secretario'], // Solo visible para secretario
    ancho: '12%',
    render: (fila) => {
      // Solo mostrar para estudiantes atrasados
      if (fila.LLEGADA !== "Atrasado") return "";
      
      const select = document.createElement('select');
      select.className = 'select-orden-atrasado';
      select.setAttribute('data-rut', fila.AlumnoRUT);
      
      // Opciones
      select.innerHTML = `
        <option value="">-- Seleccionar --</option>
        <option value="En Orden" ${fila.OrdenAtrasado === "En Orden" ? "selected" : ""}>En Orden</option>
        <option value="Al Final" ${fila.OrdenAtrasado === "Al Final" ? "selected" : ""}>Al Final</option>
      `;
      
      // Evento para guardar cuando cambia
      select.addEventListener('change', (e) => {
        const valor = e.target.value;
        actualizarOrdenAtrasado(fila.AlumnoRUT, valor);
      });
      
      return select;
    }
  }
];

// Función para actualizar el orden de atrasados
function actualizarOrdenAtrasado(rut, valor) {
  const alumno = datos.find(d => d.AlumnoRUT.toString().toLowerCase() === rut.toLowerCase());
  if (!alumno) return;
  
  alumno.OrdenAtrasado = valor;
  
  const alumnoFiltrado = datosFiltrados.find(d => d.AlumnoRUT.toString().toLowerCase() === rut.toLowerCase());
  if (alumnoFiltrado) {
    alumnoFiltrado.OrdenAtrasado = valor;
  }
  
  guardarEnFirebase();
}

// Función para generar un ID único para este usuario
function generarIdUnico() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + new Date().getTime();
}

// Función para registrar usuario en Firebase
function registrarUsuarioEnFirebase() {
  const userData = {
    rol: rolUsuario,
    nombre: nombreUsuario,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    ultimaActividad: firebase.database.ServerValue.TIMESTAMP
  };
  
  // Guardar datos del usuario
  database.ref('usuarios/' + usuarioId).set(userData);
  
  // Actualizar periodicamente la última actividad
  setInterval(() => {
    database.ref('usuarios/' + usuarioId + '/ultimaActividad').set(firebase.database.ServerValue.TIMESTAMP);
  }, 30000); // Actualizar cada 30 segundos
}

// Función para monitorear estados de roles (solo para secretario)
function monitorearEstadosRoles() {
  if (rolUsuario !== 'secretario') return;
  
  const ref = database.ref('usuarios');
  
  ref.on('value', (snapshot) => {
    const usuarios = snapshot.val();
    const ahora = new Date().getTime();
    
    // Reiniciar estados
    const estados = {
      registro: 'desconectado',
      invitados: 'desconectado',
      coordinador: 'desconectado', 
      jefe: 'desconectado'
    };
    
    // Procesar cada usuario
    if (usuarios) {
      Object.keys(usuarios).forEach(userId => {
        const user = usuarios[userId];
        // Saltarse el usuario actual (secretario)
        if (userId === usuarioId) return;
        
        const ultimaActividad = user.ultimaActividad || 0;
        const diferenciaTiempo = ahora - ultimaActividad;
        
        // Determinar estado según el tiempo de inactividad
        let estado = 'desconectado';
        if (diferenciaTiempo < 35000) { // 35 segundos (con margen)
          estado = 'conectado';
        } else if (diferenciaTiempo < 120000) { // 2 minutos
          estado = 'ausente';
        }
        
        // Actualizar estado según el rol
        if (user.rol && estados.hasOwnProperty(user.rol)) {
          // Mantener el estado más "activo" si hay múltiples usuarios del mismo rol
          if (estados[user.rol] === 'desconectado' || 
              (estados[user.rol] === 'ausente' && estado === 'conectado')) {
            estados[user.rol] = estado;
          }
        }
      });
    }
    
    // Actualizar la interfaz
    actualizarIndicadoresEstado(estados);
  });
}

// Función para actualizar los indicadores de estado
function actualizarIndicadoresEstado(estados) {
  // Actualizar estado de Registro Estudiantes
  const circuloRegistro = estadoRegistro.querySelector('.circulo-estado');
  circuloRegistro.className = 'circulo-estado ' + 
    (estados.registro === 'conectado' ? 'circulo-verde' : 
     estados.registro === 'ausente' ? 'circulo-amarillo' : 'circulo-rojo');
  
  // Actualizar estado de Registro Invitados
  const circuloInvitados = estadoInvitados.querySelector('.circulo-estado');
  circuloInvitados.className = 'circulo-estado ' + 
    (estados.invitados === 'conectado' ? 'circulo-verde' : 
     estados.invitados === 'ausente' ? 'circulo-amarillo' : 'circulo-rojo');
  
  // Actualizar estado de Coordinador Auditorio
  const circuloCoordinador = estadoCoordinador.querySelector('.circulo-estado');
  circuloCoordinador.className = 'circulo-estado ' + 
    (estados.coordinador === 'conectado' ? 'circulo-verde' : 
     estados.coordinador === 'ausente' ? 'circulo-amarillo' : 'circulo-rojo');
  
  // Actualizar estado de Jefe de Escuela
  const circuloJefe = estadoJefe.querySelector('.circulo-estado');
  circuloJefe.className = 'circulo-estado ' + 
    (estados.jefe === 'conectado' ? 'circulo-verde' : 
     estados.jefe === 'ausente' ? 'circulo-amarillo' : 'circulo-rojo');
}

// Función para cargar tachados desde localStorage
function cargarTachadosUsuario() {
  const tachadosGuardados = localStorage.getItem(`tachados_${nombreUsuario}`);
  if (tachadosGuardados) {
    tachadosUsuario = JSON.parse(tachadosGuardados);
  } else {
    tachadosUsuario = {};
  }
}

// Función para guardar tachados en localStorage
function guardarTachadosUsuario() {
  localStorage.setItem(`tachados_${nombreUsuario}`, JSON.stringify(tachadosUsuario));
}

// Función para alternar el estado tachado de un estudiante
function toggleTachadoEstudiante(rut) {
  if (!tachadosUsuario[rut]) {
    tachadosUsuario[rut] = true;
  } else {
    delete tachadosUsuario[rut];
  }
  guardarTachadosUsuario();
  mostrarTabla();
}

// Función para verificar si un estudiante está tachado
function estaTachado(rut) {
  return tachadosUsuario[rut] === true;
}

// Función para actualizar número de invitados
function actualizarNumeroInvitados(rut, numero) {
  const alumno = datos.find(d => d.AlumnoRUT.toString().toLowerCase() === rut.toLowerCase());
  if (!alumno) return;
  
  alumno.NumeroInvitados = numero;
  
  const alumnoFiltrado = datosFiltrados.find(d => d.AlumnoRUT.toString().toLowerCase() === rut.toLowerCase());
  if (alumnoFiltrado) {
    alumnoFiltrado.NumeroInvitados = numero;
  }
  
  guardarEnFirebase();
}

// Función para actualizar la visibilidad del botón flotante según el rol
function actualizarBotonesFlotantes() {
  const btnProtagonismoFlotante = document.getElementById('btn-detalle-protagonismo-flotante');
  const btnAtrasados = document.getElementById('btn-ver-atrasados');
  
  if (rolUsuario === 'secretario') {
    btnProtagonismoFlotante.style.display = 'flex';
    
    // Ajustar posición del botón de atrasados para que esté debajo
    btnAtrasados.style.bottom = '150px';
  } else {
    btnProtagonismoFlotante.style.display = 'none';
    
    // Restaurar posición original del botón de atrasados
    btnAtrasados.style.bottom = '80px';
  }
}

// MEJORA N°1 y N°2: Función para aplicar restricciones según el rol
function aplicarRestriccionesRol() {
  // Obtener elementos de la tabla
  const btnExportar = document.querySelector('button[onclick="exportarExcel()"]');
  const btnReset = document.querySelector('button[onclick="resetearAsistencia()"]');
  const btnFlotante = document.getElementById('btn-restablecer-linea');
  const contador = document.querySelector('.contador');
  
  // MEJORA N°1: Controlar acceso al campo de hora de inicio
  const horaEventoInput = document.getElementById('hora-evento');
  
  // Resetear todas las restricciones primero
  document.querySelectorAll('.boton-accion-oculto').forEach(el => el.classList.remove('elemento-oculto'));
  if (contador) contador.classList.remove('elemento-oculto');
  
  // MEJORA N°1 and N°2: Resetear restricciones de campos
  horaEventoInput.readOnly = false;
  horaEventoInput.style.backgroundColor = '';
  horaEventoInput.style.cursor = '';
  
  // Controlar visibilidad del grupo de Excel
  if (rolUsuario === 'secretario') {
    grupoExcel.style.display = 'flex';
  } else {
    grupoExcel.style.display = 'none';
  }
  
  // Aplicar restricciones según el rol
  switch(rolUsuario) {
    case 'registro':
      btnReset.classList.add('elemento-oculto');
      // MEJORA N°1: Hacer la hora de solo lectura
      horaEventoInput.readOnly = true;
      horaEventoInput.style.backgroundColor = '#f5f5f5';
      horaEventoInput.style.cursor = 'not-allowed';
      break;
      
    case 'invitados':
      // Ocultar botones
      btnExportar.classList.add('elemento-oculto');
      btnReset.classList.add('elemento-oculto');
      btnFlotante.classList.add('elemento-oculto');
      if (contador) contador.classList.add('elemento-oculto');
      
      // MEJORA N°1: Hacer la hora de solo lectura
      horaEventoInput.readOnly = true;
      horaEventoInput.style.backgroundColor = '#f5f5f5';
      horaEventoInput.style.cursor = 'not-allowed';
      break;
      
    case 'jefe':
      // Ocultar botones
      btnExportar.classList.add('elemento-oculto');
      btnReset.classList.add('elemento-oculto');
      btnFlotante.classList.add('elemento-oculto');

      // MEJORA N°1: Hacer la hora de solo lectura
      horaEventoInput.readOnly = true;
      horaEventoInput.style.backgroundColor = '#f5f5f5';
      horaEventoInput.style.cursor = 'not-allowed';
      break;
      
    case 'coordinador':
      // Ocultar botones
      btnExportar.classList.add('elemento-oculto');
      btnReset.classList.add('elemento-oculto');
      btnFlotante.classList.add('elemento-oculto');

      // MEJORA N°1: Hacer la hora de solo lectura
      horaEventoInput.readOnly = true;
      horaEventoInput.style.backgroundColor = '#f5f5f5';
      horaEventoInput.style.cursor = 'not-allowed';
      break;
      
    case 'secretario':
      // Mostrar todo, sin restricciones
      // MEJORA N°1: Permitir edición de hora
      horaEventoInput.readOnly = false;
      horaEventoInput.style.backgroundColor = '';
      horaEventoInput.style.cursor = '';
      break;
  }
  
  // Actualizar botones flotantes según el rol
  actualizarBotonesFlotantes();
  
  // Generar tabla con las columnas apropiadas
  generarThead();
  mostrarTabla();
}

// Monitorear estado de conexión
firebase.database().ref('.info/connected').on('value', function(snapshot) {
  if (snapshot.val() === true) {
    estadoConexion.textContent = "Conectado";
    estadoConexion.className = "conexion-estado conectado";
  } else {
    estadoConexion.textContent = "Desconectado";
    estadoConexion.className = "conexion-estado desconectado";
  }
});

// Función para limpiar el chat
function limpiarChat() {
  if (rolUsuario !== 'secretario') {
    alert('Solo el Secretario puede limpiar el chat.');
    return;
  }
  
  const contraseña = prompt("Ingrese la contraseña para limpiar el chat:");
  if (contraseña !== "1510") {
    alert("Contraseña incorrecta. La operación ha sido cancelada.");
    return;
  }
  
  if (!confirm("¿Está seguro que desea limpiar todo el historial del chat? Esta acción no se puede deshacer.")) {
    return;
  }
  
  // Eliminar todos los mensajes de Firebase
  database.ref('chat').remove()
    .then(() => {
      // Limpiar mensajes localmente
      chatMessages.innerHTML = '';
      // Resetear variables de notificación
      ultimoMensajeTimestamp = 0;
      localStorage.setItem('ultimoMensajeTimestamp', '0');
      quitarNotificacionChat();
      alert('Chat limpiado correctamente.');
    })
    .catch(error => {
      console.error("Error al limpiar el chat:", error);
      alert('Error al limpiar el chat.');
    });
}

// Función para seleccionar rol
function seleccionarRol(rol) {
  // Si el rol es secretario, mostrar modal de contraseña
  if (rol === 'secretario') {
    modalRol.style.display = 'none';
    modalContrasena.style.display = 'flex';
    inputContrasena.focus();
    return;
  }
  
  rolUsuario = rol;
  
  // Asignar nombre de usuario según el rol
  switch(rol) {
    case 'registro':
      nombreUsuario = "Registro Estudiantes";
      indicadorRol.textContent = 'Registro Estudiantes';
      indicadorRol.className = 'indicador-rol registro';
      break;
    case 'invitados':
      nombreUsuario = "Registro Invitados";
      indicadorRol.textContent = 'Registro Invitados';
      indicadorRol.className = 'indicador-rol invitados';
      break;
    case 'jefe':
      nombreUsuario = "Jefe de Escuela";
      indicadorRol.textContent = 'Jefe de Escuela';
      indicadorRol.className = 'indicador-rol jefe';
      break;
    case 'coordinador':
      nombreUsuario = "Coordinador Auditorio";
      indicadorRol.textContent = 'Coordinador Auditorio';
      indicadorRol.className = 'indicador-rol coordinador';
      break;
    case 'secretario':
      nombreUsuario = "Secretario";
      indicadorRol.textContent = 'Secretario';
      indicadorRol.className = 'indicador-rol secretario';
      break;
  }
  
  indicadorRol.style.display = 'block';
  modalRol.style.display = 'none';
  
  // Habilitar el chat
  chatInput.disabled = false;
  chatSendBtn.disabled = false;
  
  // Guardar en localStorage para persistencia entre sesiones
  localStorage.setItem('rolUsuario', rol);
  localStorage.setItem('nombreUsuario', nombreUsuario);
  
  // Cargar tachados del usuario
  cargarTachadosUsuario();
  
  // Aplicar restricciones según el rol
  aplicarRestriccionesRol();
  
  // Agregar clase al body según el rol
  document.body.classList.add('rol-' + rolUsuario);
  
  // Cargar datos después de seleccionar el rol
  cargarDatosDesdeFirebase();
  cargarMensajesChat();
  
  // Mostrar botón de cambio de usuario
  cambiarUsuarioBtn.style.display = 'block';
  
  // Registrar usuario en Firebase
  usuarioId = generarIdUnico();
  registrarUsuarioEnFirebase();
  
  // Si es secretario, monitorear estados de roles
  if (rolUsuario === 'secretario') {
    indicadorRoles.classList.add('visible');
    monitorearEstadosRoles();
  }
}

// Función para cambiar de usuario
function cambiarUsuario() {
  modalCambiarUsuario.style.display = 'flex';
  inputContrasenaCambio.focus();
}

// Función para verificar contraseña de cambio
function verificarContrasenaCambio() {
  // Remover clase del body al cambiar usuario
  document.body.classList.remove('rol-' + rolUsuario);
  
  const contrasena = inputContrasenaCambio.value.trim();
  
  if (contrasena === "1510") {
    // Limpiar datos de usuario actual
    if (usuarioId) {
      database.ref('usuarios/' + usuarioId).remove();
    }
    
    // Limpiar localStorage
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem('nombreUsuario');
    localStorage.removeItem(`tachados_${nombreUsuario}`);
    localStorage.removeItem('ultimoMensajeTimestamp');
    
    // Ocultar elementos de interfaz
    indicadorRol.style.display = 'none';
    cambiarUsuarioBtn.style.display = 'none';
    indicadorRoles.classList.remove('visible');
    
    // Deshabilitar chat
    chatInput.disabled = true;
    chatSendBtn.disabled = true;
    
    // Cerrar modales abiertos
    modalCambiarUsuario.style.display = 'none';
    modalContrasena.style.display = 'none';
    
    // Mostrar modal de selección de rol
    modalRol.style.display = 'flex';
    
    // Resetear variables
    rolUsuario = null;
    nombreUsuario = "";
    usuarioId = null;
    
    // Limpiar input
    inputContrasenaCambio.value = '';
  } else {
    alert("Contraseña incorrecta. Intente nuevamente.");
    inputContrasenaCambio.value = '';
    inputContrasenaCambio.focus();
  }
}

// Función para verificar contraseña de secretario
function verificarContrasena() {
  const contrasena = inputContrasena.value.trim();
  
  if (contrasena === "1510") {
    rolUsuario = 'secretario';
    nombreUsuario = "Secretario";
    
    // Actualizar interfaz
    indicadorRol.textContent = 'Secretario';
    indicadorRol.className = 'indicador-rol secretario';
    indicadorRol.style.display = 'block';
    
    // Habilitar el chat
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    
    // Guardar en localStorage
    localStorage.setItem('rolUsuario', rolUsuario);
    localStorage.setItem('nombreUsuario', nombreUsuario);
    
    // Cargar tachados del usuario
    cargarTachadosUsuario();
    
    // Aplicar restricciones según el rol
    aplicarRestriccionesRol();
    
    // Agregar clase al body según el rol
    document.body.classList.add('rol-' + rolUsuario);
    
    // Cargar datos
    cargarDatosDesdeFirebase();
    cargarMensajesChat();
    
    // Ocultar modal de contraseña
    modalContrasena.style.display = 'none';
    inputContrasena.value = '';
    
    // Mostrar botón de cambio de usuario
    cambiarUsuarioBtn.style.display = 'block';
    
    // Registrar usuario en Firebase
    usuarioId = generarIdUnico();
    registrarUsuarioEnFirebase();
    
    // Monitorear estados de roles
    indicadorRoles.classList.add('visible');
    monitorearEstadosRoles();
  } else {
    alert("Contraseña incorrecta. Intente nuevamente.");
    inputContrasena.value = '';
    inputContrasena.focus();
  }
}

// Configurar eventos para selección de rol
opcionesRol.forEach(opcion => {
  opcion.addEventListener('click', function() {
    // Quitar selección anterior
    opcionesRol.forEach(o => o.classList.remove('seleccionado'));
    
    // Marcar como seleccionado
    this.classList.add('seleccionado');
    
    // Habilitar botón de confirmar
    btnConfirmarRol.disabled = false;
    
    // Guardar rol seleccionado
    btnConfirmarRol.dataset.rol = this.dataset.rol;
  });
});

btnConfirmarRol.addEventListener('click', function() {
  if (this.dataset.rol) {
    seleccionarRol(this.dataset.rol);
  }
});

// Configurar eventos para el modal de contraseña
btnCancelarContrasena.addEventListener('click', function() {
  modalContrasena.style.display = 'none';
  modalRol.style.display = 'flex';
  inputContrasena.value = '';
});

btnVerificarContrasena.addEventListener('click', function() {
  verificarContrasena();
});

inputContrasena.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    verificarContrasena();
  }
});

modalContrasena.addEventListener('click', function(e) {
  if (e.target === modalContrasena) {
    modalContrasena.style.display = 'none';
    inputContrasena.value = '';
  }
});

// Configurar eventos para el modal de cambio de usuario
btnCancelarCambio.addEventListener('click', function() {
  modalCambiarUsuario.style.display = 'none';
  inputContrasenaCambio.value = '';
});

btnVerificarCambio.addEventListener('click', function() {
  verificarContrasenaCambio();
});

inputContrasenaCambio.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    btnVerificarCambio.click();
  }
});

modalCambiarUsuario.addEventListener('click', function(e) {
  if (e.target === modalCambiarUsuario) {
    modalCambiarUsuario.style.display = 'none';
    inputContrasenaCambio.value = '';
  }
});

cambiarUsuarioBtn.addEventListener('click', cambiarUsuario);

// Configurar eventos para el chat
chatMinimizeBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  chatContainer.classList.toggle('minimized');
  // Si se está minimizando, quitar notificación
  if (chatContainer.classList.contains('minimized')) {
    quitarNotificacionChat();
  } else {
    // If se está expandiendo, marcar mensajes como leídos
    marcarMensajesComoLeidos();
  }
});

chatCloseBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  chatContainer.classList.add('minimized');
  quitarNotificacionChat();
});

chatClearBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  limpiarChat();
});

chatHeader.addEventListener('click', function() {
  if (chatContainer.classList.contains('minimized')) {
    chatContainer.classList.remove('minimized');
    chatInput.focus();
    marcarMensajesComoLeidos();
  }
});

chatInput.addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    enviarMensaje();
  }
});

chatSendBtn.addEventListener('click', enviarMensaje);

function enviarMensaje() {
  const texto = chatInput.value.trim();
  if (texto === '') return;
  
  const timestamp = new Date().getTime();
  const mensaje = {
    texto: texto,
    usuario: nombreUsuario,
    rol: rolUsuario,
    timestamp: timestamp
  };
  
  // Guardar mensaje en Firebase
  database.ref('chat').push(mensaje)
    .then(() => {
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;
      // Actualizar timestamp del último mensaje enviado
      ultimoMensajeTimestamp = timestamp;
      localStorage.setItem('ultimoMensajeTimestamp', ultimoMensajeTimestamp.toString());
    })
    .catch(error => {
      console.error("Error al enviar mensaje:", error);
    });
}

// Función para marcar mensajes como leídos
function marcarMensajesComoLeidos() {
  if (ultimoMensajeTimestamp > 0) {
    localStorage.setItem('ultimoMensajeTimestamp', ultimoMensajeTimestamp.toString());
  }
  quitarNotificacionChat();
}

// Función para quitar la notificación del chat
function quitarNotificacionChat() {
  chatHeader.classList.remove('notification');
  notificacionActiva = false;
  contadorMensajesNoVistos = 0;
  
  // Eliminar badge de notificación si existe
  const existingBadge = document.querySelector('.chat-notification-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
}

// Función para mostrar notificación de nuevo mensaje
function mostrarNotificacionChat() {
  if (chatContainer.classList.contains('minimized') || !notificacionActiva) {
    chatHeader.classList.add('notification');
  }
}

function cargarMensajesChat() {
  const ref = database.ref('chat');
  
  // Cargar timestamp del último mensaje visto
  const ultimoMensajeVisto = localStorage.getItem('ultimoMensajeTimestamp');
  if (ultimoMensajeVisto) {
    ultimoMensajeTimestamp = parseInt(ultimoMensajeVisto);
  }
  
  ref.on('child_added', (snapshot) => {
    const mensaje = snapshot.val();
    
    // Verificar si es un mensaje nuevo
    if (mensaje.timestamp > ultimoMensajeTimestamp) {
      if (chatContainer.classList.contains('minimized') || mensaje.usuario !== nombreUsuario) {
        contadorMensajesNoVistos++;
        mostrarNotificacionChat();
      }
      
      // Actualizar el timestamp del último mensaje
      if (mensaje.timestamp > ultimoMensajeTimestamp) {
        ultimoMensajeTimestamp = mensaje.timestamp;
      }
    }
    
    mostrarMensaje(mensaje);
  });
}

function mostrarMensaje(mensaje) {
  const div = document.createElement('div');
  const esPropio = mensaje.usuario === nombreUsuario;
  
  const fecha = new Date(mensaje.timestamp);
  const hora = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  
  div.classList.add('message');
  div.classList.add(esPropio ? 'own' : 'other');
  
  div.innerHTML = `
    <div class="message-sender">${mensaje.usuario}</div>
    <div>${mensaje.texto}</div>
    <div class="message-time">${hora}</div>
  `;
  
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Verificar si ya hay un rol guardado en localStorage
function verificarRolGuardado() {
  const rolGuardado = localStorage.getItem('rolUsuario');
  const nombreGuardado = localStorage.getItem('nombreUsuario');
  
  if (rolGuardado && nombreGuardado) {
    rolUsuario = rolGuardado;
    nombreUsuario = nombreGuardado;
    
    // Actualizar interfaz según el rol
    switch(rolUsuario) {
      case 'registro':
        indicadorRol.textContent = 'Registro Estudiantes';
        indicadorRol.className = 'indicador-rol registro';
        break;
      case 'invitados':
        indicadorRol.textContent = 'Registro Invitados';
        indicadorRol.className = 'indicador-rol invitados';
        break;
      case 'jefe':
        indicadorRol.textContent = 'Jefe de Escuela';
        indicadorRol.className = 'indicador-rol jefe';
        break;
      case 'coordinador':
        indicadorRol.textContent = 'Coordinador Auditorio';
        indicadorRol.className = 'indicador-rol coordinador';
        break;
      case 'secretario':
        indicadorRol.textContent = 'Secretario';
        indicadorRol.className = 'indicador-rol secretario';
        break;
    }
    
    indicadorRol.style.display = 'block';
    
    // Habilitar el chat
    chatInput.disabled = false;
    chatSendBtn.disabled = false;
    
    // Cargar tachados del usuario
    cargarTachadosUsuario();
    
    // Aplicar restricciones según el rol
    aplicarRestriccionesRol();
    
    // Agregar clase al body según el rol
    document.body.classList.add('rol-' + rolUsuario);
    
    // Cargar datos
    cargarDatosDesdeFirebase();
    cargarMensajesChat();
    
    // Ocultar el modal de selección de rol
    modalRol.style.display = 'none';
    
    // Mostrar botón de cambio de usuario
    cambiarUsuarioBtn.style.display = 'block';
    
    // Registrar usuario en Firebase
    usuarioId = generarIdUnico();
    registrarUsuarioEnFirebase();
    
    // Si es secretario, monitorear estados de roles
    if (rolUsuario === 'secretario') {
      indicadorRoles.classList.add('visible');
      monitorearEstadosRoles();
    }
    
    return true;
  }
  
  return false;
}

// Función para editar OBS manualmente
function editarOBSManual() {
  // Solo el secretario puede editar OBS
  if (rolUsuario !== 'secretario') {
    alert('Solo el Secretario puede editar el protagonismo.');
    return;
  }
  
  modalEditarObs.style.display = 'flex';
  inputRutEditarObs.focus();
}

// Función para confirmar edición de OBS
function confirmarEdicionOBS() {
  const rut = inputRutEditarObs.value.trim();
  const tipoObs = selectTipoObs.value;
  
  if (!rut) {
    alert('Por favor, ingrese un RUT');
    return;
  }
  
  // Validar RUT
  if (!validarRUT(rut)) {
    alert('El RUT ingresado no es válido. Debe tener el formato 12345678-9 o 12345678-K');
    return;
  }
  
  const alumno = datos.find(d => d.AlumnoRUT.toString().toLowerCase() === rut.toLowerCase());
  
  if (!alumno) {
    alert('No se encontró ningún estudiante con el RUT: ' + rut);
    return;
  }
  
  // Actualizar OBS
  alumno.OBS = tipoObs;
  
  // Actualizar también en datos filtrados si existe
  const alumnoFiltrado = datosFiltrados.find(d => d.AlumnoRUT.toString().toLowerCase() === rut.toLowerCase());
  if (alumnoFiltrado) {
    alumnoFiltrado.OBS = tipoObs;
  }
  
  guardarEnFirebase();
  actualizarFilaPorRUT(rut);
  modalEditarObs.style.display = 'none';
  inputRutEditarObs.value = '';
  selectTipoObs.selectedIndex = 0;
  
  alert('Protagonismo actualizado correctamente para: ' + alumno.Nombre);
}

// MEJORA N°3: Función para mostrar los atrasados
function mostrarAtrasados() {
  // Filtrar solo los atrasados
  const atrasados = datos.filter(d => d.LLEGADA === "Atrasado");
  
  // Ordenar por hora de llegada
  atrasados.sort((a, b) => {
    if (!a.HORA) return 1;
    if (!b.HORA) return -1;
    return a.HORA.localeCompare(b.HORA);
  });
  
  // Generar la tabla
  tablaAtrasadosBody.innerHTML = "";
  
  if (atrasados.length === 0) {
    tablaAtrasadosBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;padding:20px;">
          No hay estudiantes atrasados
        </td>
      </tr>
    `;
    return;
  }
  
  atrasados.forEach(estudiante => {
    const tr = document.createElement("tr");
    
    // Para la ventana emergente, mostrar el valor pero no hacerlo editable
    let ordenHtml = estudiante.OrdenAtrasado || "Sin definir";
    
    tr.innerHTML = `
      <td>${estudiante.NUMERO}</td>
      <td>${estudiante.Nombre}</td>
      <td>${estudiante.Carrera}</td>
      <td>${estudiante.HORA || "Sin registrar"}</td>
      <td>${ordenHtml}</td>
    `;
    
    tablaAtrasadosBody.appendChild(tr);
  });
}

// Configurar eventos cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Verificar si hay un rol guardado
  const tieneRolGuardado = verificarRolGuardado();
  
  // Si no hay rol guardado, mostrar el modal
  if (!tieneRolGuardado) {
    modalRol.style.display = 'flex';
  }
  
  // Configurar posición del thead en móviles
  if (window.innerWidth <= 768) {
    document.querySelector('thead th').style.top = '60px';
  }
  
  // Configurar eventos para el modal de restablecimiento
  btnRestablecerLinea.addEventListener('click', function() {
    modalRestablecer.style.display = 'flex';
    inputRutRestablecer.focus();
  });
  
  btnCancelarRestablecer.addEventListener('click', function() {
    modalRestablecer.style.display = 'none';
    inputRutRestablecer.value = '';
  });
  
  modalRestablecer.addEventListener('click', function(e) {
    if (e.target === modalRestablecer) {
      modalRestablecer.style.display = 'none';
      inputRutRestablecer.value = '';
    }
  });
  
  btnConfirmarRestablecer.addEventListener('click', function() {
    const rut = inputRutRestablecer.value.trim();
    
    if (!rut) {
    alert('Por favor, ingrese un RUT');
    return;
    }
    
    // Validar RUT
    if (!validarRUT(rut)) {
      alert('El RUT ingresado no es válido. Debe tener el formato 12345678-9 o 12345678-K');
      return;
    }
    
    restablecerLineaPorRUT(rut);
    modalRestablecer.style.display = 'none';
    inputRutRestablecer.value = '';
  });
  
  inputRutRestablecer.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      btnConfirmarRestablecer.click();
    }
  });
  
  // Configurar eventos para el modal de protagonismo
  btnCerrarProtagonismo.addEventListener('click', function() {
    modalProtagonismo.style.display = 'none';
  });
  
  modalProtagonismo.addEventListener('click', function(e) {
    if (e.target === modalProtagonismo) {
      modalProtagonismo.style.display = 'none';
    }
  });
  
  // Configurar eventos para el modal de edición OBS
  btnCancelarEditarObs.addEventListener('click', function() {
    modalEditarObs.style.display = 'none';
    inputRutEditarObs.value = '';
    selectTipoObs.selectedIndex = 0;
  });
  
  btnConfirmarEditarObs.addEventListener('click', function() {
    confirmarEdicionOBS();
  });
  
  modalEditarObs.addEventListener('click', function(e) {
    if (e.target === modalEditarObs) {
      modalEditarObs.style.display = 'none';
      inputRutEditarObs.value = '';
      selectTipoObs.selectedIndex = 0;
    }
  });
  
  inputRutEditarObs.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      btnConfirmarEditarObs.click();
    }
  });
  
  // Evento para tachado de nombres
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('nombre-estudiante')) {
      const rut = e.target.getAttribute('data-rut');
      if (rut) {
        toggleTachadoEstudiante(rut);
      }
    }
  });
  
  // Restaurar color del header al hacer clic en cualquier parte de la página
  document.addEventListener('click', function() {
    restaurarColorHeader();
  });
  
  // MEJORA N°3: Configurar eventos para el modal de atrasados
  btnVerAtrasados.addEventListener('click', function() {
    mostrarAtrasados();
    modalAtrasados.style.display = 'flex';
  });
  
  btnCerrarAtrasados.addEventListener('click', function() {
    modalAtrasados.style.display = 'none';
  });
  
  modalAtrasados.addEventListener('click', function(e) {
    if (e.target === modalAtrasados) {
      modalAtrasados.style.display = 'none';
    }
  });

  // Configurar evento para el nuevo botón flotante de protagonismo
  const btnProtagonismoFlotante = document.getElementById('btn-detalle-protagonismo-flotante');
  btnProtagonismoFlotante.addEventListener('click', function() {
    // Solo el secretario puede ver el detalle de protagonismo
    if (rolUsuario !== 'secretario') return;
    
    mostrarDetalleProtagonismo();
    modalProtagonismo.style.display = 'flex';
  });
  
  // Ajustar inicialmente la visibilidad según el rol
  actualizarBotonesFlotantes();
});

// Cargar datos desde Firebase
function cargarDatosDesdeFirebase() {
  const ref = database.ref('asistencia');
  
  ref.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      datos = data.lista || [];
      // Asegurar que cada estudiante tenga la propiedad OrdenAtrasado
      datos.forEach(estudiante => {
        if (!estudiante.hasOwnProperty('OrdenAtrasado')) {
          estudiante.OrdenAtrasado = "";
        }
      });
      datosFiltrados = [...datos];
      mostrarTabla();
      actualizarContadores();
      
      // Actualizar hora del evento si existe
      if (data.horaEvento) {
        horaEventoInput.value = data.horaEvento;
      }
      
      // Actualizar nombre de archivo si existe
      if (data.nombreArchivo) {
        nombreArchivoElement.textContent = data.nombreArchivo;
        archivoCargado = { nombre: data.nombreArchivo };
      }
    }
  });
}

// Guardar datos en Firebase
function guardarEnFirebase() {
  const datosParaGuardar = {
    lista: datos,
    horaEvento: horaEventoInput.value,
    nombreArchivo: archivoCargado ? archivoCargado.nombre : null
  };
  
  database.ref('asistencia').set(datosParaGuardar)
    .catch(error => {
      console.error("Error al guardar en Firebase:", error);
    });
}

// Función para procesar el archivo Excel
function procesarArchivoExcel(data) {
  const workbook = XLSX.read(data, {type: "array"});
  const sheetName = workbook.SheetNames[0];
  
  // Leer los datos del Excel
  const excelData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  console.log("Datos crudos del Excel:", excelData); // Para debug
  
  // Procesar los datos
  datos = excelData.map((item, index) => {
    // Obtener los valores usando las claves correctas
    const alumnoRUT = item.AlumnoRUT || item.RUT || "";
    const nombre = item.Nombre || "";
    const carrera = item.Carrera || "";
    const ceremonia = item.Ceremonia || "";
    const obs = item.OBS || "";
    
    return {
      NUMERO: index + 1,
      AlumnoRUT: alumnoRUT.toString(),
      Nombre: nombre,
      Carrera: carrera,
      Ceremonia: ceremonia.toString(), // Asegurar que sea string
      HORA: "",
      LLEGADA: "",
      DESHABILITADO: false,
      OBS: obs,
      NumeroInvitados: 0,
      OrdenAtrasado: "" // Nueva propiedad
    };
  });
  
  console.log("Datos procesados:", datos); // Para debug
  guardarEnFirebase();
  mostrarTabla();
  actualizarContadores();
  
  // Mostrar mensaje de éxito
  alert(`✅ Excel cargado correctamente\n📊 ${datos.length} estudiantes importados`);
}

// MEJORA N°4: Función para actualizar contadores
function actualizarContadores() {
  const puntual = datos.filter(d => d.LLEGADA === "Puntual").length;
  const atrasado = datos.filter(d => d.LLEGADA === "Atrasado").length;
  const presentes = puntual + atrasado;
  const totalEstudiantes = datos.length; // MEJORA N°4: Total de estudiantes

  // MEJORA N°4: Actualizar el contador de total de estudiantes
  const contadorTotalElement = document.getElementById('contador-total');
  if (contadorTotalElement) {
    contadorTotalElement.textContent = totalEstudiantes;
  }

  // MEJORA N°3: Actualizar contador en el botón de atrasados
  if (btnVerAtrasados) {
    if (atrasado > 0) {
      btnVerAtrasados.innerHTML = `⏰<span style="position:absolute; top:-5px; right:-5px; background:#e74c3c; color:white; border-radius:50%; width:20px; height:20px; font-size:12px; display:flex; align-items:center; justify-content:center;">${atrasado}</span>`;
    } else {
      btnVerAtrasados.innerHTML = '⏰';
    }
  }

  // Verificar si aumentó el contador de atrasados
  if (atrasado > contadorAtrasadosAnterior) {
    // Cambiar el color del encabezado a rojo suave
    headerPrincipal.classList.add('header-alerta');
  }
  
  contadorAtrasadosAnterior = atrasado;
  
  contadorPresentes.textContent = presentes;
  contadorPuntual.textContent = puntual;
  contadorAtrasado.textContent = atrasado;
}

// Función para restaurar el color del encabezado
function restaurarColorHeader() {
  headerPrincipal.classList.remove('header-alerta');
}

// Guardar la hora cuando cambia
horaEventoInput.addEventListener('change', function() {
  // MEJORA N°1: Solo guardar si el usuario es secretario
  if (rolUsuario === 'secretario') {
    guardarEnFirebase();
  }
});

// Manejar carga de nuevo archivo Excel
inputExcel.addEventListener("change", function(e) {
  // MEJORA N°2: Solo permitir carga si el usuario es secretario
  if (rolUsuario !== 'secretario') {
    alert('Solo el Secretario puede cargar archivos Excel.');
    this.value = '';
    return;
  }
  
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      archivoCargado = { nombre: file.name };
      procesarArchivoExcel(e.target.result);
    };
    
    reader.readAsArrayBuffer(file);
  }
});

// Función para generar el encabezado de la tabla dinámicamente
function generarThead() {
  const thead = document.getElementById('tabla-header');
  thead.innerHTML = '';
  
  configColumnas.forEach(columna => {
    if (columna.roles.includes(rolUsuario)) {
      const th = document.createElement('th');
      th.textContent = columna.titulo;
      th.style.width = columna.ancho;
      
      // Añadir clase especial para la columna OBS
      if (columna.id === 'obs' && rolUsuario === 'secretario') {
        th.classList.add('obs-header-editable');
        th.addEventListener('click', editarOBSManual);
      }
      
      thead.appendChild(th);
    }
  });
}

function mostrarTabla() {
  const tbody = document.getElementById('tabla-body');
  if (!tbody) {
    console.error("No se encontró el elemento tabla-body");
    return;
  }
  
  tbody.innerHTML = '';
  
  if (datosFiltrados.length === 0) {
    const columnCount = configColumnas.filter(c => c.roles.includes(rolUsuario)).length;
    tbody.innerHTML = `<tr><td colspan="${columnCount}" style="text-align:center;padding:20px;">No se encontraron resultados</td></tr>`;
    return;
  }

  datosFiltrados.forEach((fila) => {
  const tr = document.createElement("tr");
  tr.setAttribute('data-rut', fila.AlumnoRUT);
  
  if (fila.LLEGADA === "Puntual") tr.classList.add("puntual");
  if (fila.LLEGADA === "Atrasado") tr.classList.add("atrasado");
  
  if (fila.OBS && (fila.OBS === "Mérito" || fila.OBS === "Discurso" || fila.OBS === "Discurso y Mérito")) {
    tr.classList.add("fila-protagonismo");
  }
  
  // Generar celdas según configuración de columnas
  configColumnas.forEach(columna => {
    if (columna.roles.includes(rolUsuario)) {
      const td = document.createElement("td");
      
      try {
        const contenido = columna.render(fila);
        
        if (typeof contenido === 'string') {
          td.textContent = contenido;
        } else if (contenido instanceof Node) {
          td.appendChild(contenido);
        } else {
          td.textContent = String(contenido);
        }
      } catch (error) {
        console.error("Error al renderizar celda:", error, columna, fila);
        td.textContent = "Error";
      }
      
      tr.appendChild(td);
    }
  });
  
  tbody.appendChild(tr);
  });
  
  // AGREGAR FILA ADICIONAL VACÍA AL FINAL
  const trAdicional = document.createElement("tr");
  trAdicional.className = "fila-adicional";
  
  // Obtener el número de columnas visibles para este rol
  const columnCount = configColumnas.filter(c => c.roles.includes(rolUsuario)).length;
  
  // Crear una celda que abarque todas las columnas
  const tdAdicional = document.createElement("td");
  tdAdicional.colSpan = columnCount;
  tdAdicional.style.height = "40px"; // Altura de la fila adicional
  tdAdicional.style.backgroundColor = "transparent";
  
  trAdicional.appendChild(tdAdicional);
  tbody.appendChild(trAdicional);
  
  console.log("Tabla mostrada correctamente con", datosFiltrados.length, "filas + 1 fila adicional");
}