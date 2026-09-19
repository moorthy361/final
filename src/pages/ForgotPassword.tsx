import { Link } from 'react-router-dom';
import { AuthShell } from './Login';

export default function ForgotPassword() {
  return <AuthShell title="Password Reset" subtitle="Password reset will be available when the authentication backend is connected."><div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">For security, this demo does not collect or store password-reset information without a connected authentication provider.</div><Link className="auth-submit mt-6" to="/login">Return to sign in</Link></AuthShell>;
}
