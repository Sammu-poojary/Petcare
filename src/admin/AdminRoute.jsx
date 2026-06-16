import { Navigate } from "react-router-dom";

function AdminRoute({ children }) {
  const isAdminLocal = localStorage.getItem("isAdminLocal");

  if (!isAdminLocal) {
    return <Navigate to="/admin/login" />;
  }

  return children;
}

export default AdminRoute;
