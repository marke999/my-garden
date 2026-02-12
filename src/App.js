import React, { useState } from 'react';
import './index.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const [formData, setFormData] = useState({
    lastWatered: '2026-02-09',
    pestCheck: 'None',
    wilting: 'None',
    healthStatus: 'Healthy',
    photo: null
  });

  const [newPlantData, setNewPlantData] = useState({
    lastWatered: '',
    pestCheck: 'None',
    wilting: 'None',
    healthStatus: 'Healthy',
    photo: null
  });

  const [plantStatus, setPlantStatus] = useState({
    lastWatered: 'February 9, 2026',
    pestCheck: 'None',
    wilting: 'None',
    healthStatus: 'Healthy',
    photoURL: 'Latest Pic'
  });

  const [plantList, setPlantList] = useState([
    {
      commonName: 'Snake Plant',
      scientificName: 'Dracaena trifasciata',
      picture: 'Pic here',
      zone: '9-12',
      sunlight: 'Low to Bright',
      watering: 'Every 2 weeks',
      height: '2-3 ft'
    }
  ]);

  // Perenual API key (free tier)
  const API_KEY = 'sk-tKDI698ca4985701714764';

  // Search for plants
  const handlePlantSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoadingSearch(true);
    try {
      const response = await fetch(
        `https://perenual.com/api/species-list?key=${API_KEY}&q=${searchQuery}`
      );
      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching plants:', error);
      alert('Error searching for plants. Please try again.');
    }
    setIsLoadingSearch(false);
  };

  // Get plant details
  const handleSelectPlant = async (plant) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(
        `https://perenual.com/api/species/details/${plant.id}?key=${API_KEY}`
      );
      const details = await response.json();
      setSelectedPlant(details);
    } catch(error) {
      console.error('Error fetching plant details:', error);
      alert('Error loading plant details. Please try again.');
    }
    setIsLoadingDetails(false);
  };

  const handleOpenUpdateModal = () => {
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };

  const handleOpenAddPlantModal = () => {
    setIsAddPlantModalOpen(true);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlant(null);
  };

  const handleCloseAddPlantModal = () => {
    setIsAddPlantModalOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlant(null);
    setNewPlantData({
      lastWatered: '',
      pestCheck: 'None',
      wilting: 'None',
      healthStatus: 'Healthy',
      photo: null
    });
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNewPlantInputChange = (field, value) => {
    setNewPlantData({ ...newPlantData, [field]: value });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNewPlantPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPlantData({ ...newPlantData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    // Convert date to readable format
    const date = new Date(formData.lastWatered);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    setPlantStatus({
      lastWatered: formattedDate,
      pestCheck: formData.pestCheck,
      wilting: formData.wilting,
      healthStatus: formData.healthStatus,
      photoURL: formData.photo || 'Latest Pic'
    });

    setIsModalOpen(false);
  };

  const handleAddPlantSubmit = () => {
    if (!selectedPlant) {
      alert('Please select a plant first');
      return;
    }

    const newPlant = {
      commonName: selectedPlant.common_name || 'Unknown',
      scientificName: selectedPlant.scientific_name?.[0] || 'Unknown',
      picture: selectedPlant.default_image?.thumbnail || 'No image',
      zone: selectedPlant.hardiness?.min && selectedPlant.hardiness?.max
       ? `${selectedPlant.hardiness.min}-${selectedPlant.hardiness.max}`
       : 'N/A'
    };

    setPlantList([...plantList, newPlant]);
    handleCloseAddPlantModal();
  };

  return (
    <div className="dashboard-container">
      {/* Upper Left: Plant List (1.5/4 width) */}
      <div className="section plant-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ marginBottom: 0 }}>Plant List</h2>
          <button className="add-plant-btn" onClick={handleOpenAddPlantModal}>
            Add Plant
          </button>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Common Name</th>
                <th>Scientific Name</th>
                <th>Picture</th>
                <th>Zone</th>
                <th>Sunlight</th>
                <th>Watering</th>
                <th>Height</th>
              </tr>
            </thead>
            <tbody>
              {plantList.map((plant, index) => (
                <tr key={index}>
                  <td>{plant.commonName}</td>
                  <td>{plant.scientificName}</td>
                  <td>
                    {plant.picture === 'Pic here' || plant.picture === 'No image' ? (
                      'Pic here'
                    ) : (
                      <img src={plant.picture} alt={plant.commonName} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                    )}
                  </td>
                  <td>{plant.zone}</td>
                  <td>{plant.sunlight}</td>
                  <td>{plant.watering}</td>
                  <td>{plant.height}</td>
                </tr>
              ))}
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
                <th>Update</th>
                <th>Last Watered</th>
                <th>Pest Check</th>
                <th>Wilting?</th>
                <th>Health Status</th>
                <th>Latest Photo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><button className="update-btn" onClick={handleOpenModal}>Update</button></td>
                <td>{plantStatus.lastWatered}</td>
                <td>{plantStatus.pestCheck}</td>
                <td>{plantStatus.wilting}</td>
                <td>{plantStatus.healthStatus}</td>
                <td>
                  {plantStatus.photoURL === 'Latest Pic' ? (
                    'Latest Pic'
                  ) : (
                    <img
                      src={plantStatus.photoURL}
                      alt="Plant"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                  )}
                </td>
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

      {/* Update Plant Status Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Update Plant Status</h2>

            <div className="form-group">
              <label>Last Watered</label>
              <input
                type="date"
                value={formData.lastWatered}
                onChange={(e) => handleInputChange('lastWatered', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Pest Check</label>
              <select
                value={formData.pestCheck}
                onChange={(e) => handleInputChange('pestCheck', e.target.value)}
              >
                <option value="None">None</option>
                <option value="Present">Present</option>
              </select>
            </div>

            <div className="form-group">
              <label>Wilting</label>
              <select
                value={formData.wilting}
                onChange={(e) => handleInputChange('wilting', e.target.value)}
              >
                <option value="None">None</option>
                <option value="Present">Present</option>
              </select>
            </div>

            <div className="form-group">
              <label>Health Status</label>
              <select
                value={formData.healthStatus}
                onChange={(e) => handleInputChange('healthStatus', e.target.value)}
              >
                <option value="Healthy">Healthy</option>
                <option value="Unhealthy">Unhealthy</option>
              </select>
            </div>

            <div className="form-group">
              <label>Latest Photo</label>
              <input
                type="file"
                accept="image/&#42;"
                capture="environment"
                onChange={handlePhotoUpload}
              />
              {formData.photo && (
                <img
                  src={formData.photo}
                  alt="Preview"
                  style={{ marginTop: '10px', maxWidth: '200px', maxHeight: '200px' }}
                />
              )}
            </div>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button className="btn-submit" onClick={handleSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Plant Modal */}
      {isAddPlantModalOpen && (
        <div className="modal-overlay" onClick={handleCloseAddPlantModal}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Plant</h2>

            {!selectedPlant ? (
              <>
                <div className="form-group">
                  <label>Search Plant by Scientific Name</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePlantSearch()}
                      placeholder="e.g., Dracaena, Rosa, Ficus..."
                    />
                    <button
                      className="btn-submit"
                      onClick={handlePlantSearch}
                      disabled={isLoadingSearch}
                    >
                      {isLoadingSearch ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="search-results">
                    <h3> Select a Plant:</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {searchResults.map((plant) => (
                        <div
                          key={plant.id}
                          className="search-result-item"
                          onClick={() => handleSelectPlant(plant)}
                        >
                          <strong>{plant.common_name}</strong>
                          <br />
                          <em>{plant.scientific_name?.[0]}</em>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {isLoadingDetails ? (
                  <p>Loading plant details...</p>
                ) : (
                  <>
                    <div className="plant-info">
                       <h3>{selectedPlant.common_name}</h3>
                       <p><em>{selectedPlant.scientific_name?.[0]}</em></p>
                       <button className="btn-back" onClick={() => setSelectedPlant(null)}>
                         ← Back to Search
                       </button>
                     </div>

                     <div className="form-group">
                       <label>Last Watered</label>
                       <input
                         type="date"
                         value={newPlantData.lastWatered}
                         onChange={(e) => handleNewPlantInputChange('lastWatered', e.target.value)}
                       />
                     </div>

                     <div className="form-group">
                       <label>Pest Check</label>
                       <select
                         value={newPlantData.pestCheck}
                         onChange={(e) => handleNewPlantInputChange('pestCheck', e.target.value)}
                       >
                         <option value="None">None</option>
                         <option value="Present">Present</option>
                       </select>
                     </div>

                     <div className="form-group">
                       <label>Wilting</label>
                       <select
                         value={newPlantData.wilting}
                         onChange={(e) => handleNewPlantInputChange('wilting', e.target.value)}
                       >
                         <option value="None">None</option>
                         <option value="Present">Present</option>
                       </select>
                     </div>

                     <div className="form-group">
                       <label>Health Status</label>
                       <select
                         value={newPlantData.healthStatus}
                         onChange={(e) => handleNewPlantInputChange('healthStatus, e.target.value)}
                       >
                         <option value="Healthy">Healthy</option>
                         <option value="Unhealthy">Unhealthy</option>
                       </select>
                     </div>

                     <div className="form-group">
                       <label>Latest Photo</label>
                       <input
                         type="file"
                         accept={"image/&#42"}
                         capture="environment"
                         onChange={handleNewPlantPhotoUpload}
                       />
                       {newPlantData.photo && (
                         <img
                           src={newPlantData.photo}
                           alt="Preview"
                           style={{ marginTop: '10px', maxWidth: '200px', maxHeight: '200px' }}
                       />
                     )}
                   </div>

                   <div className="modal-buttons">
                      <button className="btn-cancel" onClick={handleCloseAddPlantModal}>
                        Cancel
                      </button>
                      <button className="btn-submit" onClick={handleAddPlantSubmit}>
                        Add Plant
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {!selectedPlant && searchResults.length === 0 && (
              <div className="modal-buttons">
                <button className="btn-cancel" onClick={handleCloseAddPlantModal}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;






































