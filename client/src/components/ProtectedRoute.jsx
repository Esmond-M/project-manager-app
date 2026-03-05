import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [loading]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" />
      {slow && (
        <p className="loading-slow-msg">
          Taking longer than usual — the server may be starting up.
        </p>
      )}
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
