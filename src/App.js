import React from 'react';
import './index.css';

function App() {
  return (
    <div className="dashboard-container">
      {/* Upper Left: Plant List (1.5/4 width) */}
      <div className="section plant-list">
        <h2>Plant List</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Plant Name</th>
                <th>Scientific Name</th>
                <th>Picture<th>
                <th>Zone</th>
                <th>Sunlight</th>
                <th>Watering</th>
                <th>Height</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Snake Plant</td>
                <td>Dracaena trifasciata</td>
                <td>Pic here</td>
                <td>9-12</td>
                <td>Low to Bright</td>
                <td>Every 2 weeks</td>
                <td>2-3 ft</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upper Right: Plant Status (1/4 width) */}
      <div className="section plant-status">
        <h2>Plant Status</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Last Watered</th>
                <th>Pest Check</th>
                <th>Wilting?</th>
                <th>Health Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>February 9, 2026</td>
                <td>None</td>
                <td>None</td>
                <td>Healthy</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Left: Garden Progress (1/4 height/space) */}
      <div className="section garden-progress">
        <h2>Garden Progress</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Venue 1</th>
                <th>Venue 2</th>
                <th>Venue 3</th>
                <th>Venue 4</th>
                <th>Venue 5</th>
              </tr>
            </thead>
          </table>
        </div>
      </div>

      {/* Lower Right: Weather Forecast (0.5/4 width) */}
      <div className="section weather-forecast">
        <h2>7-Day Forecast</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Temp</th>
                <th>Precipitation</th>
                <th>Wind</th>
              </tr>
            </thead>
            <tbody>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <tr key={day}>
                  <td>{day}</td>
                  <td>22 C</td>
                  <td>10%</td>
                  <td>12km/h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
