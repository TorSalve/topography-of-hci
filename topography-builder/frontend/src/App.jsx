import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./styles/App.scss";
import Logo from "./components/Logo";
import Landing from "./pages/Landing";
import MapGeneratorPage from "./pages/MapGeneratorPage";
import MapEditorPage from "./pages/MapEditorPage";

function App() {
  return (
    <Router>
      <div className="app">
        {/* Navigation Bar */}
        <nav className="main-nav">
          <div className="nav-container">
            <Link to="/" className="nav-logo">
              <Logo size="small" />
              Topography
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">
                Home
              </Link>
              <Link to="/generate" className="nav-link">
                Generate Map
              </Link>
              <Link to="/editor" className="nav-link">
                Map Editor
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/generate" element={<MapGeneratorPage />} />
            <Route path="/editor" element={<MapEditorPage />} />
            <Route path="/editor/:mapId" element={<MapEditorPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
