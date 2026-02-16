import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddPlantModalOpen, setIsAddPlantModalOpen] = useState(false);
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [plantsToRemove, setPlantsToRemove] = useState([]);
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const [formData, setFormData] = useState({
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
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [gardenProgressModal, setGardenProgressModal] = useState(null); 
  const [gardenProgressData, setGardenProgressData] = useState({}); 
  const [gardenPhotoPreview, setGardenPhotoPreview] = useState(null); 

  const USER_LOCATION = { lat: 10.3157, lon: 123.8854, city: 'Cebu' };
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
  const GITHUB_USERNAME = process.env.REACT_APP_GITHUB_USERNAME;
  const GITHUB_REPO = process.env.REACT_APP_GITHUB_REPO;
  const GITHUB_API = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`;

  const toFolderName = (commonName) => commonName.toLowerCase().replace(/\s+/g, '_');

  const formatDateForFilename = () => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  const getWeatherEmoji = (main, description) => {
    const mainLower = main.toLowerCase();
    const descLower = description.toLowerCase();
    if (mainLower.includes('clear')) return '☀️';
    if (mainLower.includes('cloud')) return descLower.includes('few') ? '⛅' : '☁️';
    if (mainLower.includes('rain')) return descLower.includes('thunder') ? '⛈️' : '🌦️';
    return '☁️';
  };

  const getGardenProgressMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    return months;
  };

  const gardenLocations = [
    'Hanging Pots 1', 'Grotto', 'Garden', 'Fortune Plant', 'Stairs',
    'Hanging Pots 2', 'Hanging Pots 3', 'Trellis', 'Hanging Pots 4', 'Side Stairs'
  ];

  const handleGardenLocationClick = (location) => {
    setGardenProgressModal({ location, monthIndex: 4 });
  };

  const handleGardenPreviousMonth = () => {
    setGardenProgressModal(prev => ({ ...prev, monthIndex: prev.monthIndex === 0 ? 4 : prev.monthIndex - 1 }));
  };

  const handleGardenNextMonth = () => {
    setGardenProgressModal(prev => ({ ...prev, monthIndex: prev.monthIndex === 4 ? 0 : prev.monthIndex + 1 }));
  };

  const handleGardenPhotoCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setGardenPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // FIXED: Confirmation logic now uses local preview for instant UI update
  const handleConfirmGardenPhoto = async () => {
    if (!gardenPhotoPreview) return;
    setIsUploading(true);

    const folderName = toFolderName(gardenProgressModal.location);
    const months = getGardenProgressMonths();
    const currentMonth = months[gardenProgressModal.monthIndex];
    const monthFormatted = currentMonth.toLowerCase().replace(' ', '-');
    
    // Save locally immediately for instant feedback
    const updatedData = {
      ...gardenProgressData,
      [folderName]: {
        ...(gardenProgressData[folderName] || {}),
        [currentMonth]: gardenPhotoPreview
      }
    };
    setGardenProgressData(updatedData);

    try {
      const photoUrl = await uploadGardenPhotoToGitHub(folderName, monthFormatted, gardenPhotoPreview);
      if (photoUrl) {
        const finalData = {
          ...gardenProgressData,
          [folderName]: {
            ...(gardenProgressData[folderName] || {}),
            [currentMonth]: photoUrl
          }
        };
        setGardenProgressData(finalData);
        await saveGardenProgressToGitHub(finalData);
      }
    } catch (error) {
      console.error('❌ Error uploading garden photo:', error);
    }
    setIsUploading(false);
    setGardenPhotoPreview(null);
    setGardenProgressModal(null);
  };

  const handleCancelGardenPhoto = () => setGardenPhotoPreview(null);

  // FIXED: Returns base64 immediately after upload to bypass CDN delay
  const uploadGardenPhotoToGitHub = async (folderName, monthFormatted, photoBase64) => {
    try {
      const base64Data = photoBase64.split(',')[1];
      const fileName = `${folderName}_${monthFormatted}_${Date.now()}.jpg`;
      const filePath = `locations/${folderName}/${fileName}`;

      await axios.put(`${GITHUB_API}/contents/${filePath}`, {
        message: `Add garden photo for ${folderName}`,
        content: base64Data,
      }, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });

      return photoBase64; // Return the base64 we just uploaded for instant display
    } catch (error) {
      console.error('Error uploading garden photo:', error);
      throw error;
    }
  };

  const saveGardenProgressToGitHub = async (data) => {
    try {
      const months = getGardenProgressMonths();
      const headers = `Location,${months.join(',')}`;
      const rows = gardenLocations.map(location => {
        const folderName = toFolderName(location);
        const rowData = [location];
        months.forEach(month => rowData.push(data[folderName]?.[month] || '-'));
        return rowData.join(',');
      });
      const csvContent = [headers, ...rows].join('\n');

      let sha = null;
      try {
        const existingFile = await axios.get(`${GITHUB_API}/contents/gardenprogress.csv`, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        });
        sha = existingFile.data.sha;
      } catch (e) {}

      await axios.put(`${GITHUB_API}/contents/gardenprogress.csv`, {
        message: 'Update garden progress',
        content: btoa(unescape(encodeURIComponent(csvContent))),
        sha: sha,
      }, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
    } catch (error) {
      console.error('Error saving garden progress:', error);
    }
  };

  useEffect(() => {
    loadPlantDataFromGitHub();
    loadGardenProgressFromGitHub();
    fetchWeatherForecast();
  }, []);

  const loadGardenProgressFromGitHub = async () => {
    try {
      const response = await axios.get(`${GITHUB_API}/contents/gardenprogress.csv`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      });
      const csvContent = atob(response.data.content);
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',');
      const months = headers.slice(1);
      const data = {};
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const folderName = toFolderName(values[0]);
        data[folderName] = {};
        for (let j = 1; j < values.length; j++) {
          if (values[j] && values[j] !== '-') data[folderName][months[j - 1]] = values[j];
        }
      }
      setGardenProgressData(data);
    } catch (error) { console.log('No garden progress found'); }
  };

  const loadPlantDataFromGitHub = async () => {
    try {
      const response = await axios.get(`${GITHUB_API}/contents/plantlist.csv`, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      });
      const csvContent = atob(response.data.content);
      const lines = csvContent.split('\n').filter(line => line.trim());
      const plants = [];
      const statuses = [];

      const parseCSVLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
          else current += char;
        }
        values.push(current.trim());
        return values;
      };

      for (let i = 1; i < lines.length; i++) {
        const v = parseCSVLine(lines[i]);
        if (v.length >= 11) {
          plants.push({ commonName: v[0], scientificName: v[1], zone: v[2], sunlight: v[3], watering: v[4], height: v[5] });
          statuses.push({ lastWatered: v[6], pestCheck: v[7], wilting: v[8], healthStatus: v[9], photoUrl: v[10] });
        }
      }
      setPlantList(plants);
      setPlantStatusList(statuses);
    } catch (error) { console.log('Error loading plantlist'); }
  };

  const fetchWeatherForecast = async () => {
    setIsLoadingWeather(true);
    try {
      const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${USER_LOCATION.lat}&lon=${USER_LOCATION.lon}&units=metric&appid=${API_KEY}`);
      const daily = [];
      const seen = new Set();
      response.data.list.forEach(item => {
        const d = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!seen.has(d) && daily.length < 7) {
          seen.add(d);
          daily.push({
            dateStr: new Date(item.dt * 1000).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
            day: daily.length === 0 ? 'Today' : new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
            temp: Math.round(item.main.temp),
            precipitation: Math.round(item.pop * 100),
            wind: Math.round(item.wind.speed * 3.6),
            weather: getWeatherEmoji(item.weather[0].main, item.weather[0].description)
          });
        }
      });
      setWeatherForecast(daily);
    } catch (e) { /* Fallback to dummy */ }
    setIsLoadingWeather(false);
  };

  const savePlantListToGitHub = async (plants, statuses) => {
    try {
      const headers = 'Common Name,Scientific Name,Zone,Sunlight,Watering,Height,Last Watered,Pest Check,Wilting,Health Status,Photo URL';
      const rows = plants.map((p, i) => {
        const s = statuses[i];
        const esc = (v) => { const str = String(v || ''); return str.includes(',') ? `"${str}"` : str; };
        return `${esc(p.commonName)},${esc(p.scientificName)},${esc(p.zone)},${esc(p.sunlight)},${esc(p.watering)},${esc(p.height)},${esc(s.lastWatered)},${esc(s.pestCheck)},${esc(s.wilting)},${esc(s.healthStatus)},${esc(s.photoUrl)}`;
      });
      const csv = [headers, ...rows].join('\n');
      let sha = null;
      try {
        const res = await axios.get(`${GITHUB_API}/contents/plantlist.csv`, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
        sha = res.data.sha;
      } catch (e) {}
      await axios.put(`${GITHUB_API}/contents/plantlist.csv`, {
        message: 'Update plants', content: btoa(unescape(encodeURIComponent(csv))), sha
      }, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
    } catch (e) { alert('Save failed'); }
  };

  const uploadPhotoToGitHub = async (commonName, photoBase64) => {
    if (!photoBase64) return null;
    try {
      const folderName = toFolderName(commonName);
      const fileName = `${folderName}_${Date.now()}.jpg`;
      const filePath = `plants/${folderName}/${fileName}`;
      await axios.put(`${GITHUB_API}/contents/${filePath}`, {
        message: `Photo for ${commonName}`, content: photoBase64.split(',')[1]
      }, { headers: { Authorization: `token ${GITHUB_TOKEN}` } });
      return photoBase64; // Return base64 for immediate UI display
    } catch (e) { return null; }
  };

  const handleOpenUpdateModal = (index) => {
    setCurrentUpdateIndex(index);
    const s = plantStatusList[index];
    setFormData({
      lastWatered: s.lastWatered === 'N/A' ? '' : new Date(s.lastWatered).toISOString().split('T')[0],
      pestCheck: s.pestCheck, wilting: s.wilting, healthStatus: s.healthStatus, photo: null
    });
    setIsUpdateModalOpen(true);
  };

  const handleCloseUpdateModal = () => setIsUpdateModalOpen(false);

  const handleSubmit = async () => {
    setIsUploading(true);
    let photoUrl = plantStatusList[currentUpdateIndex].photoUrl;
    if (formData.photo) {
      const uploaded = await uploadPhotoToGitHub(plantList[currentUpdateIndex].commonName, formData.photo);
      if (uploaded) photoUrl = uploaded;
    }

    const updated = [...plantStatusList];
    updated[currentUpdateIndex] = {
      lastWatered: formatDateForDisplay(formData.lastWatered),
      pestCheck: formData.pestCheck,
      wilting: formData.wilting,
      healthStatus: formData.healthStatus,
      photoUrl: photoUrl
    };
    setPlantStatusList(updated);
    await savePlantListToGitHub(plantList, updated);
    setIsUploading(false);
    setIsUpdateModalOpen(false);
  };

  const handleManualPlantSubmit = async () => {
    if (!manualPlantData.commonName) return;
    setIsUploading(true);
    let photoUrl = 'Latest Pic';
    if (manualPlantData.statusPhoto) {
      const uploaded = await uploadPhotoToGitHub(manualPlantData.commonName, manualPlantData.statusPhoto);
      if (uploaded) photoUrl = uploaded;
    }
    const newP = { commonName: manualPlantData.commonName, scientificName: manualPlantData.scientificName, zone: manualPlantData.zone, sunlight: manualPlantData.sunlight, watering: manualPlantData.watering, height: manualPlantData.height };
    const newS = { lastWatered: formatDateForDisplay(manualPlantData.lastWatered), pestCheck: manualPlantData.pestCheck, wilting: manualPlantData.wilting, healthStatus: manualPlantData.healthStatus, photoUrl };
    
    setPlantList([...plantList, newP]);
    setPlantStatusList([...plantStatusList, newS]);
    await savePlantListToGitHub([...plantList, newP], [...plantStatusList, newS]);
    setIsUploading(false);
    setIsAddPlantModalOpen(false);
  };

  return (
    <div className="dashboard-container">
      {/* Plant List */}
      <div className="section plant-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2>Plant List</h2>
          <div>
            <button className="add-plant-btn-small" onClick={() => setIsAddPlantModalOpen(true)}>Add Plant</button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead><tr><th>Name</th><th>Scientific</th><th>Sun</th><th>Water</th></tr></thead>
            <tbody>
              {plantList.map((p, i) => (
                <tr key={i}><td>{p.commonName}</td><td>{p.scientificName}</td><td>{p.sunlight}</td><td>{p.watering}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plant Status */}
      <div className="section plant-status">
        <h2>Plant Status</h2>
        <div className="table-container">
          <table>
            <thead><tr><th>Update</th><th>Watered</th><th>Health</th><th>Photo</th></tr></thead>
            <tbody>
              {plantStatusList.map((s, i) => (
                <tr key={i}>
                  <td><button className="update-btn" onClick={() => handleOpenUpdateModal(i)}>Update</button></td>
                  <td>{s.lastWatered}</td>
                  <td>{s.healthStatus}</td>
                  <td>
                    {s.photoUrl.startsWith('data:') || s.photoUrl.startsWith('http') ? (
                      <img src={s.photoUrl} alt="p" style={{ width: '40px', height: '40px', borderRadius: '4px' }} onClick={() => setLightboxPhoto(s.photoUrl)} />
                    ) : 'No Photo'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Garden Progress */}
      <div className="section garden-progress">
        <h2>Garden Progress</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Location</th>{getGardenProgressMonths().map((m, i) => <th key={i}>{m}</th>)}</tr>
            </thead>
            <tbody>
              {gardenLocations.map((loc, i) => (
                <tr key={i}>
                  <td onClick={() => handleGardenLocationClick(loc)} style={{ cursor: 'pointer', color: '#2e7d32', textDecoration: 'underline' }}>{loc}</td>
                  {getGardenProgressMonths().map((m, mi) => {
                    const url = gardenProgressData[toFolderName(loc)]?.[m];
                    return <td key={mi} style={{ textAlign: 'center' }}>
                      {url ? <img src={url} alt="g" style={{ width: '40px', height: '40px', borderRadius: '4px' }} onClick={() => setGardenProgressModal({ location: loc, monthIndex: mi })} /> : '-'}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weather */}
      <div className="section weather-forecast">
        <h2>7-Day Forecast</h2>
        <div className="table-container">
          <table>
            <thead><tr><th>Date</th><th>Day</th><th>☁️</th><th>Temp</th></tr></thead>
            <tbody>
              {weatherForecast.map((f, i) => (
                <tr key={i}><td>{f.dateStr}</td><td>{f.day}</td><td style={{ fontSize: '1.2rem' }}>{f.weather}</td><td>{f.temp}°C</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isUpdateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsUpdateModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Update {plantList[currentUpdateIndex].commonName}</h2>
            <input type="date" value={formData.lastWatered} onChange={e => setFormData({...formData, lastWatered: e.target.value})} />
            <select value={formData.healthStatus} onChange={e => setFormData({...formData, healthStatus: e.target.value})}>
              <option value="Healthy">Healthy</option><option value="Unhealthy">Unhealthy</option>
            </select>
            <input type="file" accept="image/*" capture="environment" onChange={e => {
              const reader = new FileReader();
              reader.onloadend = () => setFormData({...formData, photo: reader.result});
              reader.readAsDataURL(e.target.files[0]);
            }} />
            <div className="modal-buttons">
              <button onClick={() => setIsUpdateModalOpen(false)}>Cancel</button>
              <button onClick={handleSubmit} disabled={isUploading}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {isAddPlantModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddPlantModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Plant</h2>
            <input placeholder="Name" onChange={e => setManualPlantData({...manualPlantData, commonName: e.target.value})} />
            <input placeholder="Scientific" onChange={e => setManualPlantData({...manualPlantData, scientificName: e.target.value})} />
            <input type="file" onChange={e => {
              const reader = new FileReader();
              reader.onloadend = () => setManualPlantData({...manualPlantData, statusPhoto: reader.result});
              reader.readAsDataURL(e.target.files[0]);
            }} />
            <button onClick={handleManualPlantSubmit}>Add</button>
          </div>
        </div>
      )}

      {gardenProgressModal && (
        <div className="lightbox-overlay" onClick={() => {setGardenProgressModal(null); setGardenPhotoPreview(null);}}>
          <div className="garden-progress-modal" onClick={e => e.stopPropagation()}>
            <h2 style={{ color: 'white' }}>{gardenProgressModal.location} - {getGardenProgressMonths()[gardenProgressModal.monthIndex]}</h2>
            <div style={{ minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              {gardenPhotoPreview ? (
                <>
                  <img src={gardenPhotoPreview} alt="prev" style={{ maxWidth: '100%', borderRadius: '8px' }} />
                  <div style={{ marginTop: '10px' }}>
                    <button onClick={handleConfirmGardenPhoto} style={{ padding: '10px 20px', background: '#2e7d32', color: 'white', border: 'none', borderRadius: '5px' }}>OK</button>
                    <button onClick={() => setGardenPhotoPreview(null)} style={{ marginLeft: '10px' }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  {gardenProgressData[toFolderName(gardenProgressModal.location)]?.[getGardenProgressMonths()[gardenProgressModal.monthIndex]] ? (
                    <img src={gardenProgressData[toFolderName(gardenProgressModal.location)][getGardenProgressMonths()[gardenProgressModal.monthIndex]]} style={{ maxWidth: '100%', borderRadius: '8px' }} alt="current" />
                  ) : <div style={{ color: 'white' }}>No Record</div>}
                  {gardenProgressModal.monthIndex === 4 && (
                    <label style={{ marginTop: '20px', padding: '10px 20px', background: 'white', borderRadius: '5px', cursor: 'pointer' }}>
                      📸 Take Picture
                      <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleGardenPhotoCapture} />
                    </label>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {lightboxPhoto && (
        <div className="lightbox-overlay" onClick={() => setLightboxPhoto(null)}>
          <img src={lightboxPhoto} alt="large" style={{ maxWidth: '90%', maxHeight: '90%' }} />
        </div>
      )}

      {isUploading && <div className="loading-overlay"><h3>Processing...</h3></div>}
    </div>
  );
}

export default App;