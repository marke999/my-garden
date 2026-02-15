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
  const [gardenProgressModal, setGardenProgressModal] = useState(null); // { location: 'Hanging Pots 1', monthIndex: 0 }
  const [gardenProgressData, setGardenProgressData] = useState({}); // { 'hanging_pots_1': { 'Feb-2026': 'url', ... } }
  const [gardenPhotoPreview, setGardenPhotoPreview] = useState(null); // Preview before confirming upload

  // User location (Cebu, Philippines)
  const USER_LOCATION = {
    lat: 10.3157,
    lon: 123.8854,
    city: 'Cebu'
  };

  // GitHub configuration
  const GITHUB_TOKEN = process.env.REACT_APP_GITHUB_TOKEN;
  const GITHUB_USERNAME = process.env.REACT_APP_GITHUB_USERNAME;
  const GITHUB_REPO = process.env.REACT_APP_GITHUB_REPO;
  const GITHUB_API = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`;

  // Helper function to convert common name to folder name
  const toFolderName = (commonName) => {
    return commonName.toLowerCase().replace(/\s+/g, '_');
  };

  // Helper function to format date for filenames
  const formatDateForFilename = () => {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'short' });
    const day = String(now.getDate()).padStart(2, '0');
    const year = now.getFullYear();
    return `${month}-${day}-${year}`;
  };

  // Helper function to format date for display (MMM-DD-YYYY)
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };

  // Helper function to get weather emoji based on condition
  const getWeatherEmoji = (main, description) => {
    const mainLower = main.toLowerCase();
    const descLower = description.toLowerCase();
    
    if (mainLower.includes('clear')) return '☀️';
    if (mainLower.includes('cloud')) {
      if (descLower.includes('few') || descLower.includes('scattered')) return '⛅';
      return '☁️';
    }
    if (mainLower.includes('rain')) {
      if (descLower.includes('thunder')) return '⛈️';
      if (descLower.includes('shower') || descLower.includes('heavy')) return '🌧️';
      return '🌦️';
    }
    if (mainLower.includes('thunder')) return '⛈️';
    if (mainLower.includes('drizzle')) return '🌦️';
    if (mainLower.includes('snow')) return '🌨️';
    if (mainLower.includes('mist') || mainLower.includes('fog') || mainLower.includes('haze')) return '🌫️';
    
    return '☁️'; // Default
  };

  // Helper function to generate 5 months ending at current month (backwards)
  const getGardenProgressMonths = () => {
    const months = [];
    const today = new Date();
    
    // Start from 4 months ago and go to current month
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push(monthStr);
    }
    
    return months;
  };

  // Garden locations
  const gardenLocations = [
    'Hanging Pots 1',
    'Grotto',
    'Garden',
    'Fortune Plant',
    'Stairs',
    'Hanging Pots 2',
    'Hanging Pots 3',
    'Trellis',
    'Hanging Pots 4'
  ];

  // Handle garden progress location click
  const handleGardenLocationClick = (location) => {
    // Open modal for current month (last column, index 4)
    setGardenProgressModal({
      location: location,
      monthIndex: 4 // Always open to current month (Feb-2026)
    });
  };

  // Navigate to previous month
  const handleGardenPreviousMonth = () => {
    setGardenProgressModal(prev => ({
      ...prev,
      monthIndex: prev.monthIndex === 0 ? 4 : prev.monthIndex - 1
    }));
  };

  // Navigate to next month
  const handleGardenNextMonth = () => {
    setGardenProgressModal(prev => ({
      ...prev,
      monthIndex: prev.monthIndex === 4 ? 0 : prev.monthIndex + 1
    }));
  };

  // Handle garden photo upload
  const handleGardenPhotoCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setGardenPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Confirm and upload garden photo
  const handleConfirmGardenPhoto = async () => {
    if (!gardenPhotoPreview) return;

    setIsUploading(true);

    const folderName = toFolderName(gardenProgressModal.location);
    const months = getGardenProgressMonths();
    const currentMonth = months[gardenProgressModal.monthIndex];
    const monthFormatted = currentMonth.toLowerCase().replace(' ', '-'); // 'feb-2026'
    
    try {
      const photoUrl = await uploadGardenPhotoToGitHub(
        folderName,
        monthFormatted,
        gardenPhotoPreview
      );

      if (photoUrl) {
        // Update garden progress data
        const updatedData = {
          ...gardenProgressData,
          [folderName]: {
            ...(gardenProgressData[folderName] || {}),
            [currentMonth]: photoUrl
          }
        };
        
        setGardenProgressData(updatedData);

        // Save to gardenprogress.csv
        await saveGardenProgressToGitHub(updatedData);

        console.log('✅ Garden photo uploaded:', photoUrl);
        setGardenPhotoPreview(null);
        setGardenProgressModal(null);
      }
    } catch (error) {
      console.error('❌ Error uploading garden photo:', error);
      alert('Failed to upload photo');
    }

    setIsUploading(false);
  };

  // Cancel garden photo
  const handleCancelGardenPhoto = () => {
    setGardenPhotoPreview(null);
  };

  // Upload garden photo to GitHub
  const uploadGardenPhotoToGitHub = async (folderName, monthFormatted, photoBase64) => {
    try {
      const base64Data = photoBase64.includes(',') 
        ? photoBase64.split(',')[1] 
        : photoBase64;

      // Check for existing photos in the entire folder
      let existingPhotos = [];
      try {
        const response = await axios.get(`${GITHUB_API}/contents/locations/${folderName}`, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        });
        existingPhotos = response.data.filter(file => 
          file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png')
        );
        console.log(`📁 Found ${existingPhotos.length} existing photos in location folder`);
      } catch (error) {
        console.log('📁 Folder does not exist yet, will create with first photo');
      }

      // Check for existing photos this month to determine version number
      const monthPhotos = existingPhotos.filter(photo => photo.name.includes(monthFormatted));
      const versionNumber = monthPhotos.length + 1;
      const paddedVersion = String(versionNumber).padStart(2, '0');
      const fileName = `${folderName}_${monthFormatted}_${paddedVersion}.jpg`;
      const filePath = `locations/${folderName}/${fileName}`;

      console.log(`📸 Uploading garden photo: ${fileName}`);

      await axios.put(
        `${GITHUB_API}/contents/${filePath}`,
        {
          message: `Add garden photo for ${folderName}`,
          content: base64Data,
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      // Use permanent raw GitHub URL with cache-busting parameter
      const timestamp = Date.now();
      const newPhotoUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${filePath}?t=${timestamp}`;

      // Check if we have more than 20 photos now
      const allPhotos = [...existingPhotos, { name: fileName, path: filePath }];
      if (allPhotos.length > 20) {
        console.log(`🗑️ Location folder has ${allPhotos.length} photos, deleting oldest to keep only 20`);
        
        // Sort by filename (oldest first) and delete the oldest ones
        const sortedPhotos = allPhotos
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, allPhotos.length - 20); // Get photos to delete
        
        for (const photo of sortedPhotos) {
          try {
            // Get the SHA for the file to delete
            const fileInfo = await axios.get(`${GITHUB_API}/contents/${photo.path}`, {
              headers: { Authorization: `token ${GITHUB_TOKEN}` },
            });
            
            await axios.delete(`${GITHUB_API}/contents/${photo.path}`, {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
              },
              data: {
                message: `Delete old garden photo ${photo.name}`,
                sha: fileInfo.data.sha,
              },
            });
            console.log(`🗑️ Deleted old garden photo: ${photo.name}`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete ${photo.name}:`, deleteError.message);
          }
        }
      }

      console.log(`✅ Garden photo uploaded successfully: ${newPhotoUrl}`);
      return newPhotoUrl;
    } catch (error) {
      console.error('Error uploading garden photo:', error);
      throw error;
    }
  };

  // Save garden progress to CSV
  const saveGardenProgressToGitHub = async (data) => {
    try {
      console.log('Saving garden progress to GitHub');
      
      const months = getGardenProgressMonths();
      
      // Create CSV content - columns: Location, Oct-2025, Nov-2025, Dec-2025, Jan-2026, Feb-2026
      const headers = `Location,${months.join(',')}`;
      const rows = [];
      
      gardenLocations.forEach(location => {
        const folderName = toFolderName(location);
        const rowData = [location];
        
        months.forEach(month => {
          const photoUrl = data[folderName]?.[month];
          rowData.push(photoUrl || '-');
        });
        
        rows.push(rowData.join(','));
      });
      
      const csvContent = [headers, ...rows].join('\n');

      console.log('CSV Preview:', csvContent);

      // Check if file exists
      let sha = null;
      try {
        const existingFile = await axios.get(`${GITHUB_API}/contents/gardenprogress.csv`, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        });
        sha = existingFile.data.sha;
      } catch (error) {
        console.log('Creating new gardenprogress.csv');
      }

      // Upload
      await axios.put(
        `${GITHUB_API}/contents/gardenprogress.csv`,
        {
          message: 'Update garden progress',
          content: btoa(csvContent),
          sha: sha,
        },
        {
          headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
          },
        }
      );

      console.log('✅ Garden progress saved');
    } catch (error) {
      console.error('Error saving garden progress:', error);
    }
  };

  // Load plant data from GitHub CSV on component mount
  useEffect(() => {
    loadPlantDataFromGitHub();
    loadGardenProgressFromGitHub();
    fetchWeatherForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load garden progress from CSV
  const loadGardenProgressFromGitHub = async () => {
    if (!GITHUB_TOKEN || !GITHUB_USERNAME || !GITHUB_REPO) {
      console.log('GitHub credentials not set');
      return;
    }

    try {
      const response = await axios.get(`${GITHUB_API}/contents/gardenprogress.csv`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      const csvContent = atob(response.data.content);
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) {
        console.log('Garden progress CSV is empty');
        return;
      }

      // Parse CSV: Location,Oct-2025,Nov-2025,Dec-2025,Jan-2026,Feb-2026
      const headers = lines[0].split(',');
      const months = headers.slice(1); // Remove 'Location' header
      
      const data = {};
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const location = values[0];
        const folderName = toFolderName(location);
        
        data[folderName] = {};
        
        for (let j = 1; j < values.length && j - 1 < months.length; j++) {
          let photoUrl = values[j];
          
          // Migrate old photo URLs to new structure
          if (photoUrl && photoUrl !== '-' && !photoUrl.includes('/locations/')) {
            // Old format: .../hanging_pots_1/hanging_pots_1_...jpg
            // New format: .../locations/hanging_pots_1/hanging_pots_1_...jpg
            photoUrl = photoUrl.replace('/main/', '/main/locations/');
            console.log('🔄 Migrated garden photo URL to new structure');
          }
          
          if (photoUrl && photoUrl !== '-') {
            data[folderName][months[j - 1]] = photoUrl;
          }
        }
      }
      
      setGardenProgressData(data);
      console.log('✅ Garden progress loaded:', Object.keys(data).length, 'locations');
      
    } catch (error) {
      console.log('No garden progress CSV found:', error.message);
    }
  };

  // Load plantlist.csv from GitHub
  const loadPlantDataFromGitHub = async () => {
    if (!GITHUB_TOKEN || !GITHUB_USERNAME || !GITHUB_REPO) {
      console.log('GitHub credentials not set');
      return;
    }

    try {
      const response = await axios.get(`${GITHUB_API}/contents/plantlist.csv`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      // Decode base64 content
      const csvContent = atob(response.data.content);
      
      // Parse CSV with better handling of quoted values
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length <= 1) {
        console.log('CSV file is empty or only has headers');
        return;
      }
      
      const plants = [];
      const statuses = [];

      // Simple CSV parser that handles quoted values
      const parseCSVLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        return values;
      };

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        console.log('Parsed row:', values);
        
        if (values.length >= 11) {
          plants.push({
            commonName: values[0] || 'Unknown',
            scientificName: values[1] || 'Unknown',
            zone: values[2] || 'N/A',
            sunlight: values[3] || 'N/A',
            watering: values[4] || 'N/A',
            height: values[5] || 'N/A'
          });

          // Migrate old photo URLs to new structure
          let photoUrl = values[10] || 'Latest Pic';
          if (photoUrl && photoUrl !== 'Latest Pic' && photoUrl !== 'Pic here' && !photoUrl.includes('/plants/')) {
            // Old format: .../snake_plant/snake_plant_...jpg
            // New format: .../plants/snake_plant/snake_plant_...jpg
            photoUrl = photoUrl.replace('/main/', '/main/plants/');
            console.log('🔄 Migrated photo URL to new structure');
          }

          statuses.push({
            lastWatered: values[6] || 'N/A',
            pestCheck: values[7] || 'None',
            wilting: values[8] || 'None',
            healthStatus: values[9] || 'Healthy',
            photoUrl: photoUrl
          });
        }
      }

      if (plants.length > 0) {
        setPlantList(plants);
        setPlantStatusList(statuses);
        console.log(`Loaded ${plants.length} plants from GitHub`);
      }
    } catch (error) {
      console.log('No existing plantlist.csv found or error loading:', error.message);
    }
  };

  // Fetch weather forecast from OpenWeatherMap API
  const fetchWeatherForecast = async () => {
    setIsLoadingWeather(true);
    try {
      const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
      
      if (!API_KEY) {
        console.log('⚠️ No OpenWeather API key found, using dummy data');
        throw new Error('No API key configured');
      }
      
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${USER_LOCATION.lat}&lon=${USER_LOCATION.lon}&units=metric&appid=${API_KEY}`
      );

      const dailyForecasts = [];
      const processedDates = new Set();
      
      response.data.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        if (!processedDates.has(dateStr) && dailyForecasts.length < 7) {
          const hour = date.getHours();
          if (hour >= 11 && hour <= 14) {
            processedDates.add(dateStr);
            
            const isToday = date.toDateString() === new Date().toDateString();
            
            dailyForecasts.push({
              date: date,
              dateStr: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
              day: isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
              temp: Math.round(item.main.temp),
              precipitation: item.pop ? Math.round(item.pop * 100) : 0,
              wind: Math.round(item.wind.speed * 3.6),
              weather: getWeatherEmoji(item.weather[0].main, item.weather[0].description)
            });
          }
        }
      });

      // Fill in remaining days if less than 7 (OpenWeather free only gives 5 days)
      // Use the last available day's forecast for the remaining days
      while (dailyForecasts.length < 7) {
        const lastForecast = dailyForecasts[dailyForecasts.length - 1];
        const lastDate = new Date(lastForecast.date);
        
        const nextDate = new Date(lastDate);
        nextDate.setDate(lastDate.getDate() + 1);
        
        dailyForecasts.push({
          date: nextDate,
          dateStr: nextDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          day: nextDate.toLocaleDateString('en-US', { weekday: 'short' }),
          temp: lastForecast.temp,
          precipitation: lastForecast.precipitation,
          wind: lastForecast.wind,
          weather: lastForecast.weather
        });
      }

      setWeatherForecast(dailyForecasts);
      console.log('✅ Weather forecast loaded:', dailyForecasts.length, 'days');
    } catch (error) {
      console.error('⚠️ Weather API error:', error.response?.status, error.message);
      
      // Dummy data - 7 days starting from TODAY
      const dummyForecast = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const isToday = i === 0;
        
        return {
          date: date,
          dateStr: date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          day: isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' }),
          temp: 28,
          precipitation: 20,
          wind: 15,
          weather: i % 3 === 0 ? '☀️' : i % 3 === 1 ? '⛅' : '☁️'
        };
      });
      setWeatherForecast(dummyForecast);
      console.log('ℹ️ Using dummy weather data');
    }
    setIsLoadingWeather(false);
  };

  // Save plantlist.csv to GitHub
  const savePlantListToGitHub = async (plants, statuses) => {
    try {
      console.log('Saving to GitHub:', plants.length, 'plants');
      
      // Create CSV content with escaped values (NO PICTURE COLUMN)
      const headers = 'Common Name,Scientific Name,Zone,Sunlight,Watering,Height,Last Watered,Pest Check,Wilting,Health Status,Photo URL';
      const rows = plants.map((plant, index) => {
        const status = statuses[index];
        // Escape commas in values by wrapping in quotes if needed
        const escapeCsv = (val) => {
          const str = String(val || '');
          return str.includes(',') ? `"${str}"` : str;
        };
        return `${escapeCsv(plant.commonName)},${escapeCsv(plant.scientificName)},${escapeCsv(plant.zone)},${escapeCsv(plant.sunlight)},${escapeCsv(plant.watering)},${escapeCsv(plant.height)},${escapeCsv(status.lastWatered)},${escapeCsv(status.pestCheck)},${escapeCsv(status.wilting)},${escapeCsv(status.healthStatus)},${escapeCsv(status.photoUrl)}`;
      });
      const csvContent = [headers, ...rows].join('\n');
      
      console.log('CSV Content preview:', csvContent.substring(0, 200));

      // Check if file exists to get SHA
      let sha = null;
      try {
        const existingFile = await axios.get(`${GITHUB_API}/contents/plantlist.csv`, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        });
        sha = existingFile.data.sha;
      } catch (error) {
        console.log('Creating new CSV file');
      }

      // Upload or update file
      const response = await axios.put(
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

      console.log('Plant list saved to GitHub successfully', response.status);
    } catch (error) {
      console.error('Error saving to GitHub:', error.response?.data || error.message);
      alert('Error saving plant data to GitHub: ' + (error.response?.data?.message || error.message));
    }
  };

  // Upload photo to GitHub
  const uploadPhotoToGitHub = async (commonName, photoBase64) => {
    if (!photoBase64) return null;

    try {
      const folderName = toFolderName(commonName);
      const dateStr = formatDateForFilename().toLowerCase();
      
      // Remove data URL prefix if present
      const base64Data = photoBase64.includes(',') 
        ? photoBase64.split(',')[1] 
        : photoBase64;

      // Get all existing photos in the folder
      let existingPhotos = [];
      try {
        const response = await axios.get(`${GITHUB_API}/contents/plants/${folderName}`, {
          headers: { Authorization: `token ${GITHUB_TOKEN}` },
        });
        existingPhotos = response.data.filter(file => 
          file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png')
        );
        console.log(`📁 Found ${existingPhotos.length} existing photos in folder`);
      } catch (error) {
        console.log('📁 Folder does not exist yet, will create with first photo');
      }

      // Find next available number for today's date
      const todayPhotos = existingPhotos.filter(photo => photo.name.includes(dateStr));
      let photoNumber = todayPhotos.length + 1;
      const paddedNumber = String(photoNumber).padStart(2, '0');
      const fileName = `${folderName}_${dateStr}_${paddedNumber}.jpg`;
      const filePath = `plants/${folderName}/${fileName}`;

      console.log(`📸 Uploading photo: ${fileName}`);

      // Upload new photo
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

      // Use permanent raw GitHub URL with cache-busting parameter
      const timestamp = Date.now();
      const newPhotoUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/main/${filePath}?t=${timestamp}`;

      // Check if we have more than 20 photos now
      const allPhotos = [...existingPhotos, { name: fileName, path: filePath }];
      if (allPhotos.length > 20) {
        console.log(`🗑️ Folder has ${allPhotos.length} photos, deleting oldest to keep only 20`);
        
        // Sort by filename (oldest first) and delete the oldest ones
        const sortedPhotos = allPhotos
          .sort((a, b) => a.name.localeCompare(b.name))
          .slice(0, allPhotos.length - 20); // Get photos to delete
        
        for (const photo of sortedPhotos) {
          try {
            // Get the SHA for the file to delete
            const fileInfo = await axios.get(`${GITHUB_API}/contents/${photo.path}`, {
              headers: { Authorization: `token ${GITHUB_TOKEN}` },
            });
            
            await axios.delete(`${GITHUB_API}/contents/${photo.path}`, {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
              },
              data: {
                message: `Delete old photo ${photo.name}`,
                sha: fileInfo.data.sha,
              },
            });
            console.log(`🗑️ Deleted old photo: ${photo.name}`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete ${photo.name}:`, deleteError.message);
          }
        }
      }

      console.log(`✅ Photo uploaded successfully: ${newPhotoUrl}`);
      return newPhotoUrl;
      
    } catch (error) {
      console.error('Error uploading photo to GitHub:', error);
      alert('Error uploading photo to GitHub');
      return null;
    }
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
  };

  const handleCloseAddPlantModal = () => {
    setIsAddPlantModalOpen(false);
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

  const handleToggleRemoveMode = () => {
    if (isRemoveMode && plantsToRemove.length > 0) {
      // Confirm deletion
      if (window.confirm(`Are you sure you want to delete ${plantsToRemove.length} plant(s)?`)) {
        handleDeletePlants();
      }
    } else {
      setIsRemoveMode(!isRemoveMode);
      setPlantsToRemove([]);
    }
  };

  const handleTogglePlantSelection = (index) => {
    if (plantsToRemove.includes(index)) {
      setPlantsToRemove(plantsToRemove.filter(i => i !== index));
    } else {
      setPlantsToRemove([...plantsToRemove, index]);
    }
  };

  // Delete folder and all photos from GitHub
  const deleteFolderFromGitHub = async (folderName) => {
    try {
      console.log(`🗑️ Attempting to delete folder: plants/${folderName}`);
      
      // Get all files in the folder
      const response = await axios.get(`${GITHUB_API}/contents/plants/${folderName}`, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      });

      const files = response.data;
      console.log(`📁 Found ${files.length} files:`, files.map(f => f.name));

      // Delete each file one by one (not in parallel to avoid conflicts)
      for (const file of files) {
        try {
          console.log(`🔥 Deleting: ${file.path}`);
          await axios.delete(`${GITHUB_API}/contents/${file.path}`, {
            headers: {
              Authorization: `token ${GITHUB_TOKEN}`,
              'Content-Type': 'application/json',
            },
            data: {
              message: `Delete ${file.name}`,
              sha: file.sha,
            },
          });
          console.log(`✅ Deleted: ${file.name}`);
        } catch (deleteError) {
          console.error(`❌ Failed to delete ${file.name}:`, deleteError.response?.data || deleteError.message);
        }
      }

      console.log(`✅ Folder deletion complete: plants/${folderName}`);
      
    } catch (error) {
      console.error('❌ Error accessing folder:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        console.log('Folder already deleted or does not exist');
      }
    }
  };

  const handleDeletePlants = async () => {
    if (plantsToRemove.length === 0) return;

    setIsUploading(true);

    // Get plants to delete BEFORE removing them from the list
    const plantsToDelete = plantsToRemove.map(index => ({
      commonName: plantList[index].commonName,
      folderName: toFolderName(plantList[index].commonName)
    }));

    console.log('🗑️ Deleting plants:', plantsToDelete);

    // Remove selected plants (sort in reverse to avoid index shifting)
    const sortedIndices = [...plantsToRemove].sort((a, b) => b - a);
    let updatedPlants = [...plantList];
    let updatedStatuses = [...plantStatusList];

    sortedIndices.forEach(index => {
      updatedPlants.splice(index, 1);
      updatedStatuses.splice(index, 1);
    });

    setPlantList(updatedPlants);
    setPlantStatusList(updatedStatuses);

    // Save to GitHub CSV
    await savePlantListToGitHub(updatedPlants, updatedStatuses);

    // Delete folders from GitHub (one by one to avoid race conditions)
    for (const plant of plantsToDelete) {
      console.log(`🗑️ Deleting folder for: ${plant.commonName}`);
      await deleteFolderFromGitHub(plant.folderName);
    }

    setIsRemoveMode(false);
    setPlantsToRemove([]);
    setIsUploading(false);
    
    console.log('✅ All deletions complete!');
  };

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
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

    // Format date as MMM-DD-YYYY
    const formattedDate = formatDateForDisplay(formData.lastWatered);

    // Upload photo to GitHub if present
    let photoUrl = plantStatusList[currentUpdateIndex].photoUrl;
    if (formData.photo) {
      const commonName = plantList[currentUpdateIndex].commonName;
      console.log('📸 Uploading new photo for:', commonName);
      const uploadedUrl = await uploadPhotoToGitHub(commonName, formData.photo);
      console.log('📸 Photo uploaded, URL:', uploadedUrl);
      if (uploadedUrl) {
        photoUrl = uploadedUrl;
      } else {
        console.error('❌ Photo upload failed, keeping old URL');
      }
    }

    console.log('💾 Saving plant status with photo URL:', photoUrl);

    const updatedStatusList = [...plantStatusList];
    updatedStatusList[currentUpdateIndex] = {
      lastWatered: formattedDate,
      pestCheck: formData.pestCheck,
      wilting: formData.wilting,
      healthStatus: formData.healthStatus,
      photoUrl: photoUrl
    };

    setPlantStatusList(updatedStatusList);
    
    // Save to GitHub CSV
    await savePlantListToGitHub(plantList, updatedStatusList);
    
    console.log('✅ Plant status updated successfully');
    
    setIsUploading(false);
    setIsUpdateModalOpen(false);
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
      zone: manualPlantData.zone || 'N/A',
      sunlight: manualPlantData.sunlight || 'N/A',
      watering: manualPlantData.watering || 'N/A',
      height: manualPlantData.height || 'N/A'
    };

    // Format the date as MMM-DD-YYYY
    let formattedDate = 'N/A';
    if (manualPlantData.lastWatered) {
      formattedDate = formatDateForDisplay(manualPlantData.lastWatered);
    }

    // Upload status photo if present (this will automatically create the folder)
    let photoUrl = 'Latest Pic';
    if (manualPlantData.statusPhoto) {
      const uploadedUrl = await uploadPhotoToGitHub(newPlant.commonName, manualPlantData.statusPhoto);
      if (uploadedUrl) photoUrl = uploadedUrl;
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
      {/* Upper Left: Plant List */}
      <div className="section plant-list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2 style={{ marginBottom: 0 }}>Plant List</h2>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <button className="add-plant-btn-small" onClick={handleOpenAddPlantModal}>
              Add Plant
            </button>
            <button 
              className={isRemoveMode ? "remove-plant-btn-active" : "remove-plant-btn"} 
              onClick={handleToggleRemoveMode}
            >
              {isRemoveMode ? 'Done' : 'Remove Plant'}
            </button>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {isRemoveMode && <th style={{ width: '50px' }}>Select</th>}
                <th>Common Name</th>
                <th>Scientific Name</th>
                <th>Zone</th>
                <th>Sunlight</th>
                <th>Watering</th>
                <th>Height</th>
              </tr>
            </thead>
            <tbody>
              {plantList.map((plant, index) => (
                <tr key={index}>
                  {isRemoveMode && (
                    <td>
                      <input
                        type="checkbox"
                        checked={plantsToRemove.includes(index)}
                        onChange={() => handleTogglePlantSelection(index)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                  )}
                  <td>{plant.commonName}</td>
                  <td>{plant.scientificName}</td>
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

      {/* Upper Right: Plant Status */}
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
                    {status.photoUrl === 'Latest Pic' || status.photoUrl === 'Pic here' ? (
                      'Latest Pic'
                    ) : (
                      <img
                        src={status.photoUrl}
                        alt="Plant"
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => setLightboxPhoto(status.photoUrl)}
                        onError={(e) => { 
                          console.error('❌ Failed to load image:', status.photoUrl);
                          e.target.style.display = 'none'; 
                          e.target.parentNode.textContent = 'Error loading'; 
                        }}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Left: Garden Progress */}
      <div className="section garden-progress">
        <h2>Garden Progress</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Location</th>
                {getGardenProgressMonths().map((month, index) => (
                  <th key={index} style={{ textAlign: 'center' }}>{month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gardenLocations.map((location, index) => {
                const folderName = toFolderName(location);
                return (
                  <tr key={index}>
                    <td>
                      <span 
                        onClick={() => handleGardenLocationClick(location)}
                        style={{ 
                          cursor: 'pointer', 
                          textDecoration: 'underline',
                          color: '#2e7d32'
                        }}
                      >
                        {location}
                      </span>
                    </td>
                    {getGardenProgressMonths().map((month, monthIndex) => {
                      const photoUrl = gardenProgressData[folderName]?.[month];
                      return (
                        <td key={monthIndex} style={{ textAlign: 'center' }}>
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={`${location} - ${month}`}
                              style={{ 
                                width: '40px', 
                                height: '40px', 
                                objectFit: 'cover', 
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                              onClick={() => setGardenProgressModal({ location, monthIndex })}
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Right: Weather Forecast */}
      <div className="section weather-forecast">
        <h2>7-Day Forecast</h2>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Date</th>
                <th style={{ textAlign: 'center' }}>Day</th>
                <th style={{ textAlign: 'center' }}>☁️</th>
                <th style={{ textAlign: 'center' }}>🌡️</th>
                <th style={{ textAlign: 'center' }}>💧</th>
                <th style={{ textAlign: 'center' }}>💨</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingWeather ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Loading weather...</td>
                </tr>
              ) : weatherForecast.length > 0 ? (
                weatherForecast.map((forecast, index) => (
                  <tr key={index}>
                    <td style={{ textAlign: 'center' }}>{forecast.dateStr}</td>
                    <td style={{ textAlign: 'center' }}>{forecast.day}</td>
                    <td style={{ textAlign: 'center', fontSize: '1.5rem' }}>{forecast.weather}</td>
                    <td style={{ textAlign: 'center' }}>{forecast.temp}°C</td>
                    <td style={{ textAlign: 'center' }}>{forecast.precipitation}%</td>
                    <td style={{ textAlign: 'center' }}>{forecast.wind} km/h</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>Weather data unavailable</td>
                </tr>
              )}
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
            <h2>Update {plantList[currentUpdateIndex].commonName}</h2>

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
              <label>Recent Photo</label>
              {plantStatusList[currentUpdateIndex].photoUrl && 
               plantStatusList[currentUpdateIndex].photoUrl !== 'Latest Pic' && 
               plantStatusList[currentUpdateIndex].photoUrl !== 'Pic here' ? (
                <img
                  src={plantStatusList[currentUpdateIndex].photoUrl}
                  alt={plantList[currentUpdateIndex].commonName}
                  style={{ 
                    maxWidth: '200px', 
                    maxHeight: '200px', 
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              ) : (
                <p style={{ color: '#999', fontSize: '0.9rem', margin: '10px 0' }}>No photo available</p>
              )}
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
            <h2>Add New Plant</h2>

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
          </div>
        </div>
      )}

      {/* Photo Lightbox */}
      {lightboxPhoto && (
        <div 
          className="lightbox-overlay" 
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="lightbox-close" 
              onClick={() => setLightboxPhoto(null)}
            >
              ×
            </button>
            <img 
              src={lightboxPhoto} 
              alt="Plant enlarged" 
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}

      {/* Garden Progress Modal */}
      {gardenProgressModal && (
        <div 
          className="lightbox-overlay" 
          onClick={() => {
            setGardenProgressModal(null);
            setGardenPhotoPreview(null);
          }}
        >
          <div 
            className="garden-progress-modal" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="lightbox-close" 
              onClick={() => {
                setGardenProgressModal(null);
                setGardenPhotoPreview(null);
              }}
              style={{ top: '10px', right: '10px' }}
            >
              ×
            </button>
            
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: 'white', marginBottom: '20px' }}>
                {gardenProgressModal.location} for {getGardenProgressMonths()[gardenProgressModal.monthIndex]}
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
                <button
                  onClick={handleGardenPreviousMonth}
                  style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ◀
                </button>
                
                <span style={{ color: 'white', fontSize: '1.2rem', minWidth: '120px' }}>
                  {getGardenProgressMonths()[gardenProgressModal.monthIndex]}
                </span>
                
                <button
                  onClick={handleGardenNextMonth}
                  style={{
                    background: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ▶
                </button>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '400px',
              flexDirection: 'column'
            }}>
              {(() => {
                const folderName = toFolderName(gardenProgressModal.location);
                const currentMonth = getGardenProgressMonths()[gardenProgressModal.monthIndex];
                const photoUrl = gardenProgressData[folderName]?.[currentMonth];
                
                // Check if this is a past month (index 0-3) or current/future month (index 4)
                const isPastMonth = gardenProgressModal.monthIndex < 4;
                
                // Show preview if photo was just taken
                if (gardenPhotoPreview) {
                  return (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={gardenPhotoPreview}
                        alt="Preview"
                        style={{
                          maxWidth: '600px',
                          maxHeight: '600px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '2px solid white',
                          marginBottom: '20px'
                        }}
                      />
                      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <button
                          onClick={handleCancelGardenPhoto}
                          disabled={isUploading}
                          style={{
                            padding: '10px 30px',
                            backgroundColor: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmGardenPhoto}
                          disabled={isUploading}
                          style={{
                            padding: '10px 30px',
                            backgroundColor: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                          }}
                        >
                          {isUploading ? 'Uploading...' : 'OK'}
                        </button>
                      </div>
                    </div>
                  );
                }
                
                // Show existing photo with Update button
                if (photoUrl) {
                  return (
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={photoUrl}
                        alt={`${gardenProgressModal.location} - ${currentMonth}`}
                        style={{
                          maxWidth: '600px',
                          maxHeight: '600px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                          border: '2px solid white'
                        }}
                      />
                      {!isPastMonth && (
                        <div style={{ marginTop: '20px' }}>
                          <label 
                            htmlFor="garden-photo-update"
                            style={{
                              display: 'inline-block',
                              padding: '10px 20px',
                              backgroundColor: '#2e7d32',
                              color: 'white',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              border: '2px solid white'
                            }}
                          >
                            📸 Update Photo
                          </label>
                          <input
                            id="garden-photo-update"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleGardenPhotoCapture}
                            style={{ display: 'none' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // No photo exists
                  if (isPastMonth) {
                    // Past month - show "No Record"
                    return (
                      <div style={{ 
                        textAlign: 'center',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}>
                        No Record
                      </div>
                    );
                  } else {
                    // Current month - show "Take a Picture"
                    return (
                      <div style={{ textAlign: 'center' }}>
                        <label 
                          htmlFor="garden-photo-upload"
                          style={{
                            display: 'inline-block',
                            padding: '20px 40px',
                            backgroundColor: '#2e7d32',
                            color: 'white',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            border: '2px solid white'
                          }}
                        >
                          📸 Take a Picture
                        </label>
                        <input
                          id="garden-photo-upload"
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleGardenPhotoCapture}
                          style={{ display: 'none' }}
                        />
                      </div>
                    );
                  }
                }
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;