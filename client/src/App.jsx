
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import TaskFeed from "./pages/TaskFeed";
import Login from "./pages/Login";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<TaskFeed />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
