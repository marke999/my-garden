import React from 'react';
import './App.css';

function App() {
  return (
    <div className="dashboard-container">
      {/* Upper Left: Plant List (1.5/4 width) */}
      <section className="section plant-list">
        <h2>Plant Section</h2>
        <ul>
          <li>Snake Plant</li>
          <li>Chinese Violet</li>
          <li>Hibiscus</li>
        </ul>
      </section>

      {/* Upper Right: Last Watered (1/4 width) */}
      <section className="section water-info">
         <h2>Watering Status</h2>
         <p>Last Watered: Today</p>
         <p>Pest check: None</p>
         <p>Wilting: No</p>
      </section>

      {/* Lower Left: Garden Progress (1/4 height/space) */}
      <section className="section garden-progress">
        <h2>Garden Progress</h2>
        <div className="progress-bar">
          <div className="fill" style={{ width: '65%'}}></div>
        </div>
        <p>February 5, 2026</p>
        <p>March 6, 2026</p>
        <p>April 6, 2026</p>
      </section>

      {/* Lower Right: Weather Forecast (0.5/4 width) */}
      <section className="section weather-forecast">
        <h2>Monday</h2>
        <p>24C</p>
      </section>
    </div>
  );
}

export default App;