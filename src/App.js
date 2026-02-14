import React, { useState, useEffect } from 'react';
import axios from 'axios';
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
  const [isUploading, setIsUploading] = useState(false);

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

  const [plantList, setPlantList] = useState([]);
  const [plantStatusList, setPlantStatusList] = useState([]);

  // GitHub configuration
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
  const GITHUB_USERNAME = process.env.REACT_APP_GITHUB_USERNAME;
  const GITHUB_REPO = process.env.REACT_APP_GITHUB_REPO;
  const GITHUB_API = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`;

  // Perenual API key
  const API_KEY = 'sk-tKDI698ca4985701714764';

  // Helper function to convert common name to folder name
  const toFolderName = (commonName) => {
    return commonName.toLowerCase().replace(/\s+/g, '_');
  };

  // Helper function to format date for filenames
  const formatDateForFilename = () => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const day = now.getDate();
    const year = now.getFullYear();
    return `${month}-${day}-${year}`;
  };

  // Load plant data from GitHub CSV on component mount
  useEffect(() => {
    loadPlantDataFromGitHub();
  }, []);

  // Load plantlist.csv from GitHub
  const loadPlantDataFromGitHub = async () => {
    try {
      const response = await axios.get(`${GITHUB_API}/contents/plantlist.csv`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      // Decode base64 content
      const csvContent = atob(response.data.content);
      
      // Parse CSV
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      
      const plants = [];
      const statuses = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 11) {
          plants.push({
            commonName: values[0],
            scientificName: values[1],
            picture: values[2] || 'Pic here',
            zone: values[3],
            sunlight: values[4],
            watering: values[5],
            height: values[6]
          });

          statuses.push({
            lastWatered: values[7],
            pestCheck: values[8],
            wilting: values[9],
            healthStatus: values[10],
            photoUrl: values[11] || 'Latest Pic'
          });
        }
      }

      setPlantList(plants);
      setPlantStatusList(statuses);
    } catch (error) {
      console.log('No existing plantlist.csv found, starting fresh');
      // Initialize with default plant
      setPlantList([{
        commonName: 'Snake Plant',
        scientificName: 'Dracaena trifasciata',
        picture: 'Pic here',
        zone: '9-12',
        sunlight: 'Low to Bright',
        watering: 'Every 2 weeks',
        height: '2-3 ft'
      }]);
      setPlantStatusList([{
        lastWatered: 'February 9, 2026',
        pestCheck: 'None',
        wilting: 'None',
        healthStatus: 'Healthy',
        photoUrl: 'Latest Pic'
      }]);
    }
  };

  // Save plantlist.csv to GitHub
  const savePlantListToGitHub = async (plants, statuses) => {
    try {
      // Create CSV content
      const headers = 'Common Name,Scientific Name,Picture,Zone,Sunlight,Watering,Height,Last Watered,Pest Check,Wilting,Health Status,Photo URL';
      const rows = plants.map((plant, index) => {
        const status = statuses[index];
        return `${plant.commonName},${plant.scientificName},${plant.picture},${plant.zone},${plant.sunlight},${plant.watering},${plant.height},${status.lastWatered},${status.pestCheck},${status.wilting},${status.healthStatus},${status.photoUrl}`;
      });
      const csvContent = [headers, ...rows].join('\n');

      // Check if file exists to get SHA
      let sha = null;
      try {
        const existingFile = await axios.get(`${GITHUB_API}/contents/plantlist.csv`, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        });
        sha = existingFile.data.sha;
      } catch (error) {
        // File doesn't exist yet
      }

      // Upload or update file
      await axios.put(
        `${GITHUB_API}/contents/plantlist.csv`,
        {
          message: 'Update plant list',
          content: btoa(csvContent),
          sha: sha,
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      console.log('Plant list saved to GitHub');
    } catch (error) {
      console.error('Error saving to GitHub:', error);
      alert('Error saving plant data to GitHub');
    }
  };

  // Upload photo to GitHub
  const uploadPhotoToGitHub = async (commonName, photoBase64) => {
    if (!photoBase64) return null;

    try {
      const folderName = toFolderName(commonName);
      const dateStr = formatDateForFilename();
      const fileName = `${folderName}_${dateStr}.jpg`;
      const filePath = `${folderName}/${fileName}`;

      // Remove data URL prefix if present
      const base64Data = photoBase64.includes(',') 
        ? photoBase64.split(',')[1] 
        : photoBase64;

      // Upload photo
      await axios.put(
        `${GITHUB_API}/contents/${filePath}`,
        {
          message: `Add photo for ${commonName}`,
          content: base64Data,
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      // Return the GitHub URL to the photo
      return `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${filePath}`;
    } catch (error) {
      console.error('Error uploading photo to GitHub:', error);
      alert('Error uploading photo to GitHub');
      return null;
    }
  };

  // Create folder in GitHub (by uploading a placeholder file)
  const createFolderInGitHub = async (folderName) => {
    try {
      await axios.put(
        `${GITHUB_API}/contents/${folderName}/.gitkeep`,
        {
          message: `Create folder for ${folderName}`,
          content: btoa(''), // Empty file
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );
    } catch (error) {
      console.log('Folder creation note:', error.message);
      // Ignore if folder already exists
    }
  };

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
      photo: null
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

  const handleSubmit = async () => {
    setIsUploading(true);

    const date = new Date(formData.lastWatered);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);

    // Upload photo to GitHub if present
    let photoUrl = 'Latest Pic';
    if (formData.photo) {
      const commonName = plantList[currentUpdateIndex].commonName;
      photoUrl = await uploadPhotoToGitHub(commonName, formData.photo);
      if (!photoUrl) photoUrl = 'Latest Pic';
    }

    const updatedStatusList = [...plantStatusList];
    updatedStatusList[currentUpdateIndex] = {
      lastWatered: formattedDate,
      pestCheck: formData.pestCheck,
      wilting: formData.wilting,
      healthStatus: formData.healthStatus,
      photoUrl: photoUrl
    };

    setPlantStatusList(updatedStatusList);
    
    // Save to GitHub
    await savePlantListToGitHub(plantList, updatedStatusList);
    
    setIsUploading(false);
    setIsUpdateModalOpen(false);
  };

  const handleAddPlantSubmit = async () => {
    if (!selectedPlant) {
      alert('Please select a plant first');
      return;
    }

    setIsUploading(true);

    const newPlant = {
      commonName: selectedPlant.common_name || 'Unknown',
      scientificName: selectedPlant.scientific_name?.[0] || 'Unknown',
      picture: selectedPlant.default_image?.thumbnail || 'Pic here',
      zone: selectedPlant.hardiness?.min && selectedPlant.hardiness?.max
       ? `${selectedPlant.hardiness.min}-${selectedPlant.hardiness.max}`
       : 'N/A',
      sunlight: selectedPlant.sunlight?.join(', ') || 'N/A',
      watering: selectedPlant.watering || 'N/A',
      height: selectedPlant.dimension?.max_value
        ? `Up to ${selectedPlant.dimension.max_value} ${selectedPlant.dimension.unit}`
        : 'N/A'
    };

    // Create folder for the plant
    const folderName = toFolderName(newPlant.commonName);
    await createFolderInGitHub(folderName);

    // Format the date from the form
    let formattedDate = 'N/A';
    if (newPlantData.lastWatered) {
      const date = new Date(newPlantData.lastWatered);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      formattedDate = date.toLocaleDateString('en-US', options);
    }

    // Upload photo if present
    let photoUrl = 'Latest Pic';
    if (newPlantData.photo) {
      photoUrl = await uploadPhotoToGitHub(newPlant.commonName, newPlantData.photo);
      if (!photoUrl) photoUrl = 'Latest Pic';
    }

    // Create corresponding plant status entry
    const newPlantStatus = {
      lastWatered: formattedDate,
      pestCheck: newPlantData.pestCheck,
      wilting: newPlantData.wilting,
      healthStatus: newPlantData.healthStatus,
      photoUrl: photoUrl
    };

    const updatedPlants = [...plantList, newPlant];
    const updatedStatuses = [...plantStatusList, newPlantStatus];

    setPlantList(updatedPlants);
    setPlantStatusList(updatedStatuses);

    // Save to GitHub
    await savePlantListToGitHub(updatedPlants, updatedStatuses);

    setIsUploading(false);
    handleCloseAddPlantModal();
  };

  const handleManualPlantSubmit = async () => {
    // Validate required fields
    if (!manualPlantData.commonName || !manualPlantData.scientificName) {
      alert('Please fill in at least Common Name and Scientific Name');
      return;
    }

    setIsUploading(true);

    const newPlant = {
      commonName: manualPlantData.commonName,
      scientificName: manualPlantData.scientificName,
      picture: manualPlantData.picture || 'Pic here',
      zone: manualPlantData.zone || 'N/A',
      sunlight: manualPlantData.sunlight || 'N/A',
      watering: manualPlantData.watering || 'N/A',
      height: manualPlantData.height || 'N/A'
    };

    // Create folder for the plant
    const folderName = toFolderName(newPlant.commonName);
    await createFolderInGitHub(folderName);

    // Format the date from the form
    let formattedDate = 'N/A';
    if (manualPlantData.lastWatered) {
      const date = new Date(manualPlantData.lastWatered);
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      formattedDate = date.toLocaleDateString('en-US', options);
    }

    // Upload status photo if present
    let photoUrl = 'Latest Pic';
    if (manualPlantData.statusPhoto) {
      photoUrl = await uploadPhotoToGitHub(newPlant.commonName, manualPlantData.statusPhoto);
      if (!photoUrl) photoUrl = 'Latest Pic';
    }

    // Create corresponding plant status entry
    const newPlantStatus = {
      lastWatered: formattedDate,
      pestCheck: manualPlantData.pestCheck,
      wilting: manualPlantData.wilting,
      healthStatus: manualPlantData.healthStatus,
      photoUrl: photoUrl
    };

    const updatedPlants = [...plantList, newPlant];
    const updatedStatuses = [...plantStatusList, newPlantStatus];

    setPlantList(updatedPlants);
    setPlantStatusList(updatedStatuses);

    // Save to GitHub
    await savePlantListToGitHub(updatedPlants, updatedStatuses);

    setIsUploading(false);
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

      {/* Loading Overlay */}
      {isUploading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3>Uploading to GitHub...</h3>
            <p>Please wait</p>
          </div>
        </div>
      )}

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
              <button className="btn-submit" onClick={handleSubmit} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Submit'}
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
                  <button className="btn-submit" onClick={handleManualPlantSubmit} disabled={isUploading}>
                    {isUploading ? 'Uploading...' : 'Submit'}
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

                   <div className="modal-buttons">
                      <button className="btn-cancel" onClick={handleCloseAddPlantModal}>
                        Cancel
                      </button>
                      <button className="btn-submit" onClick={handleAddPlantSubmit} disabled={isUploading}>
                        {isUploading ? 'Uploading...' : 'Add Plant'}
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