import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ApplicationPage from "./pages/ApplicationPage";
import NewApplicationPage from "./pages/NewApplicationPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:id" element={<ApplicationPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="*" element={<Navigate to="/applications" replace />} />
        <Route path="/applications/new" element={<NewApplicationPage />}/>
      </Routes>
    </BrowserRouter>
  );
}