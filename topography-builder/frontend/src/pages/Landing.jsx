import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import "../styles/Landing.scss";

function Landing() {
  const navigate = useNavigate();
  const modelFileRef = useRef(null);
  const svgFileRef = useRef(null);

  const handle3DFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Store file in sessionStorage and navigate to generator
      const reader = new FileReader();
      reader.onload = (e) => {
        sessionStorage.setItem("uploadedModel", e.target.result);
        sessionStorage.setItem("uploadedModelName", file.name);
        navigate("/generate");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSVGFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Store SVG in sessionStorage and navigate to editor
      const reader = new FileReader();
      reader.onload = (e) => {
        sessionStorage.setItem("svgToEdit", e.target.result);
        navigate("/editor");
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="landing-page">
      <div className="container">
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-logo">
            <Logo size="xlarge" />
          </div>
          <h1 className="hero-title">Topography Builder</h1>
          <p className="hero-subtitle">
            Transform 3D models into beautiful topographical hiking maps
          </p>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions">
          <div className="action-cards">
            {/* Generate New Map Card */}
            <div className="action-card">
              <div className="card-icon">🗻</div>
              <h3>Generate Topography</h3>
              <p>
                Upload a 3D model (STL, OBJ, PLY) and generate a topographical
                map
              </p>

              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/generate")}
                >
                  Start Generating
                </button>

                <div className="quick-upload">
                  <input
                    ref={modelFileRef}
                    type="file"
                    accept=".stl,.obj,.ply"
                    onChange={handle3DFileUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => modelFileRef.current?.click()}
                  >
                    📁 Quick Upload 3D Model
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Existing Map Card */}
            <div className="action-card">
              <div className="card-icon">✏️</div>
              <h3>Edit Topography</h3>
              <p>
                Import an existing SVG map and customize it with hiking trails
                and symbols
              </p>

              <div className="card-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/editor")}
                >
                  Open Editor
                </button>

                <div className="quick-upload">
                  <input
                    ref={svgFileRef}
                    type="file"
                    accept=".svg"
                    onChange={handleSVGFileUpload}
                    style={{ display: "none" }}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => svgFileRef.current?.click()}
                  >
                    📁 Quick Upload SVG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Landing;
