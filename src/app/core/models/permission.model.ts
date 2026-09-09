export type AppPermission =
  | 'events.view' // Ver el evento y su detalle sin sesion
  | 'events.reserve' // Reservar un ticket requiere sesion y rol user
  | 'events.review' //dejar reseña requiere sesion y rol user
  | 'events.manage' // ver los eventos del organizador y requiere session y rol organizer
  | 'approvals.review' // Revisar y aprobar o rechazar eventos requiere sesion y rol approver
  | 'roles.switch' // Poder ver el componente de cambio de rol
  | 'admin.users' //Administrar usuarios y roles solo el rol admin puede ver esta pagina.
  | 'admin.settings'; //Configuracion de variables de la app solo para rol admin.