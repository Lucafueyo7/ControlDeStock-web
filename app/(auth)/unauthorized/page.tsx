import { SignOutButton } from '@clerk/nextjs';

export default function UnauthorizedPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        gap: 16,
        textAlign: 'center',
        padding: '0 24px',
      }}
    >
      <div style={{ fontSize: 48, lineHeight: 1 }}>🔒</div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Sin acceso</h1>
      <p style={{ margin: 0, opacity: 0.6, maxWidth: 320 }}>
        Tu cuenta no tiene permisos para ingresar a esta aplicación. Contactá al administrador.
      </p>
      <SignOutButton redirectUrl="/sign-in">
        <button className="btn btn-sm" style={{ marginTop: 8 }}>
          Cerrar sesión
        </button>
      </SignOutButton>
    </div>
  );
}
