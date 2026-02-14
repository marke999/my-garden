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
