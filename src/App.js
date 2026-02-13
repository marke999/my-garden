import React, { useState } from 'react';
import './index.css';

function App() {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);

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

  const [manualPlantData, setManualPlantData] = useState({
    commonName: '',
    scientificName: '',
    zone: '',
    sunlight: '',
    watering: '',
    height: '',
    picture: null,
    lastWatered: '',
    pestCheck: 'None',
    wilting: 'None',
    healthStatus: 'Healthy',
    statusPhoto: null
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

  const [plantStatusList, setPlantStatusList] = useState([
    {
      lastWatered: 'February 9, 2026',
      pestCheck: 'None',
      wilting: 'None',
      healthStatus: 'Healthy',
      photoUrl: 'Latest Pic'
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

  const handleOpenUpdateModal = (index) => {
    setCurrentUpdateIndex(index);
    setFormData({
      lastWatered: plantStatusList[index].lastWatered === 'N/A' 
        ? '' 
        : new Date(plantStatusList[index].lastWatered).toISOString().split('T')[0],
      pestCheck: plantStatusList[index].pestCheck,
      wilting: plantStatusList[index].wilting,
      healthStatus: plantStatusList[index].healthStatus,
      photo: plantStatusList[index].photoUrl === 'Latest Pic' ? null : plantStatusList[index].photoUrl
    });
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };

  const handleOpenAddPlantModal = () => {
    setIsAddPlantModalOpen(true);
    setIsManualEntry(false);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedPlant(null);
  };

  const handleCloseAddPlantModal = () => {
    setIsAddPlantModalOpen(false);
    setIsManualEntry(false);
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
    setManualPlantData({
      commonName: '',
      scientificName: '',
      zone: '',
      sunlight: '',
      watering: '',
      height: '',
      picture: null,
      lastWatered: '',
      pestCheck: 'None',
      wilting: 'None',
      healthStatus: 'Healthy',
      statusPhoto: null
    });
  };

  const handleSwitchToManual = () => {
    setIsManualEntry(true);
    setSelectedPlant(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNewPlantInputChange = (field, value) => {
    setNewPlantData({ ...newPlantData, [field]: value });
  };

  const handleManualPlantInputChange = (field, value) => {
    setManualPlantData({ ...manualPlantData, [field]: value });
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

  const handleManualPlantPictureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualPlantData({ ...manualPlantData, picture: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualStatusPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setManualPlantData({ ...manualPlantData, statusPhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const date = new Date(formData.lastWatered);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    const updatedStatusList = [...plantStatusList];
    updatedStatusList[currentUpdateIndex] = {
      lastWatered: formattedDate,
      pestCheck: formData.pestCheck,
      wilting: formData.wilting,
      healthStatus: formData.healthStatus,
      photoUrl: formData.photo || 'Latest Pic'
    };

    setPlantStatusList(updatedStatusList);
    setIsUpdateModalOpen(false);
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
       : 'N/A',
      sunlight: selectedPlant.sunlight?.join(', ') || 'N/A',
      watering: selectedPlant.watering || 'N/A',
      height: selectedPlant.dimension?.max_value
        ? `Up to ${selectedPlant.dimension.max_value} ${selectedPlant.dimension.unit}`
        : 'N/A'
    };

    // Format the date from the form
    let formattedDate = 'N/A';
    if (newPlantData.lastWatered) {
      const date = new Date(newPlantData.lastWatered);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      formattedDate = date.toLocaleDateString('en-US', options);
    }

    // Create corresponding plant status entry
    const newPlantStatus = {
      lastWatered: formattedDate,
      pestCheck: newPlantData.pestCheck,
      wilting: newPlantData.wilting,
      healthStatus: newPlantData.healthStatus,
      photoUrl: newPlantData.photo || 'Latest Pic'
    };

    setPlantList([...plantList, newPlant]);
    setPlantStatusList([...plantStatusList, newPlantStatus]);
    handleCloseAddPlantModal();
  };

  const handleManualPlantSubmit = () => {
    // Validate required fields
    if (!manualPlantData.commonName || !manualPlantData.scientificName) {
      alert('Please fill in at least Common Name and Scientific Name');
      return;
    }

    const newPlant = {
      commonName: manualPlantData.commonName,
      scientificName: manualPlantData.scientificName,
      picture: manualPlantData.picture || 'Pic here',
      zone: manualPlantData.zone || 'N/A',
      sunlight: manualPlantData.sunlight || 'N/A',
      watering: manualPlantData.watering || 'N/A',
      height: manualPlantData.height || 'N/A'
    };

    // Format the date from the form
    let formattedDate = 'N/A';
    if (manualPlantData.lastWatered) {
      const date = new Date(manualPlantData.lastWatered);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      formattedDate = date.toLocaleDateString('en-US', options);
    }

    // Create corresponding plant status entry
    const newPlantStatus = {
      lastWatered: formattedDate,
      pestCheck: manualPlantData.pestCheck,
      wilting: manualPlantData.wilting,
      healthStatus: manualPlantData.healthStatus,
      photoUrl: manualPlantData.statusPhoto || 'Latest Pic'
    };

    setPlantList([...plantList, newPlant]);
    setPlantStatusList([...plantStatusList, newPlantStatus]);
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
              {plantStatusList.map((status, index) => (
                <tr key={index}>
                  <td>
                    <button className="update-btn" onClick={() => handleOpenUpdateModal(index)}>
                      Update
                    </button>
                  </td>
                  <td>{status.lastWatered}</td>
                  <td>{status.pestCheck}</td>
                  <td>{status.wilting}</td>
                  <td>{status.healthStatus}</td>
                  <td>
                    {status.photoUrl === 'Latest Pic' ? (
                      'Latest Pic'
                    ) : (
                      <img
                        src={status.photoUrl}
                        alt="Plant"
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    )}
                  </td>
                </tr>
              ))}
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
      {isUpdateModalOpen && (
        <div className="modal-overlay" onClick={handleCloseUpdateModal}>
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
                accept={"image/*"}
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
              <button className="btn-cancel" onClick={handleCloseUpdateModal}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ marginBottom: 0 }}>Add New Plant</h2>
              {!isManualEntry && (
                <button className="btn-submit" onClick={handleSwitchToManual}>
                  Add Manually
                </button>
              )}
            </div>

            {isManualEntry ? (
              <>
                {/* Manual Entry Form */}
                <div className="form-group">
                  <label>Common Name *</label>
                  <input
                    type="text"
                    value={manualPlantData.commonName}
                    onChange={(e) => handleManualPlantInputChange('commonName', e.target.value)}
                    placeholder="e.g., Snake Plant"
                  />
                </div>

                <div className="form-group">
                  <label>Scientific Name *</label>
                  <input
                    type="text"
                    value={manualPlantData.scientificName}
                    onChange={(e) => handleManualPlantInputChange('scientificName', e.target.value)}
                    placeholder="e.g., Dracaena trifasciata"
                  />
                </div>

                <div className="form-group">
                  <label>Zone</label>
                  <input
                    type="text"
                    value={manualPlantData.zone}
                    onChange={(e) => handleManualPlantInputChange('zone', e.target.value)}
                    placeholder="e.g., 9-12"
                  />
                </div>

                <div className="form-group">
                  <label>Sunlight</label>
                  <input
                    type="text"
                    value={manualPlantData.sunlight}
                    onChange={(e) => handleManualPlantInputChange('sunlight', e.target.value)}
                    placeholder="e.g., Low to Bright"
                  />
                </div>

                <div className="form-group">
                  <label>Watering</label>
                  <input
                    type="text"
                    value={manualPlantData.watering}
                    onChange={(e) => handleManualPlantInputChange('watering', e.target.value)}
                    placeholder="e.g., Every 2 weeks"
                  />
                </div>

                <div className="form-group">
                  <label>Height</label>
                  <input
                    type="text"
                    value={manualPlantData.height}
                    onChange={(e) => handleManualPlantInputChange('height', e.target.value)}
                    placeholder="e.g., 2-3 ft"
                  />
                </div>

                <div className="form-group">
                  <label>Plant Picture</label>
                  <input
                    type="file"
                    accept={"image/*"}
                    capture="environment"
                    onChange={handleManualPlantPictureUpload}
                  />
                  {manualPlantData.picture && (
                    <img
                      src={manualPlantData.picture}
                      alt="Plant Preview"
                      style={{ marginTop: '10px', maxWidth: '200px', maxHeight: '200px' }}
                    />
                  )}
                </div>

                <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #ddd' }} />
                <h3 style={{ fontSize: '1rem', color: '#2e7d32', marginBottom: '15px' }}>Plant Status</h3>

                <div className="form-group">
                  <label>Last Watered</label>
                  <input
                    type="date"
                    value={manualPlantData.lastWatered}
                    onChange={(e) => handleManualPlantInputChange('lastWatered', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Pest Check</label>
                  <select
                    value={manualPlantData.pestCheck}
                    onChange={(e) => handleManualPlantInputChange('pestCheck', e.target.value)}
                  >
                    <option value="None">None</option>
                    <option value="Present">Present</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Wilting</label>
                  <select
                    value={manualPlantData.wilting}
                    onChange={(e) => handleManualPlantInputChange('wilting', e.target.value)}
                  >
                    <option value="None">None</option>
                    <option value="Present">Present</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Health Status</label>
                  <select
                    value={manualPlantData.healthStatus}
                    onChange={(e) => handleManualPlantInputChange('healthStatus', e.target.value)}
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Unhealthy">Unhealthy</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status Photo</label>
                  <input
                    type="file"
                    accept={"image/*"}
                    capture="environment"
                    onChange={handleManualStatusPhotoUpload}
                  />
                  {manualPlantData.statusPhoto && (
                    <img
                      src={manualPlantData.statusPhoto}
                      alt="Status Preview"
                      style={{ marginTop: '10px', maxWidth: '200px', maxHeight: '200px' }}
                    />
                  )}
                </div>

                <div className="modal-buttons">
                  <button className="btn-cancel" onClick={handleCloseAddPlantModal}>
                    Cancel
                  </button>
                  <button className="btn-submit" onClick={handleManualPlantSubmit}>
                    Submit
                  </button>
                </div>
              </>
            ) : !selectedPlant ? (
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
                    <h3>Select a Plant:</h3>
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
                         onChange={(e) => handleNewPlantInputChange('healthStatus', e.target.value)}
                       >
                         <option value="Healthy">Healthy</option>
                         <option value="Unhealthy">Unhealthy</option>
                       </select>
                     </div>

                     <div className="form-group">
                       <label>Latest Photo</label>
                       <input
                         type="file"
                         accept={"image/*"}
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

            {!isManualEntry && !selectedPlant && searchResults.length === 0 && (
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
