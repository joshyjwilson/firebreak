// Map rendering and marker management
(function() {
  let map = null;
  let markers = [];

  /**
   * Initialize the Leaflet map centered on Devon.
   * If loadError is set, show error message instead.
   */
  function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      console.error('Map container with id="map" not found');
      return;
    }

    // Check for load error first
    if (window.AppState.loadError) {
      mapContainer.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.style.padding = '20px';
      errorDiv.style.color = '#d32f2f';
      errorDiv.style.fontSize = '16px';
      errorDiv.textContent = window.AppState.loadError;
      mapContainer.appendChild(errorDiv);
      return;
    }

    // Only initialize map once
    if (map) {
      return;
    }

    // Clear any error messages
    mapContainer.innerHTML = '';

    // Initialize Leaflet map
    map = L.map('map').setView([50.7156, -3.7], 9);

    // Add OpenStreetMap tiles with attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  }

  /**
   * Clear all markers from the map.
   */
  function clearMarkers() {
    markers.forEach(marker => {
      marker.remove();
    });
    markers = [];
  }

  /**
   * Format cost for display.
   */
  function formatCost(costGbp) {
    if (costGbp === null || costGbp === undefined) {
      return 'cost not confirmed';
    }
    return '£' + costGbp;
  }

  /**
   * Format rating for display.
   */
  function formatRating(rating, ratingCount) {
    if (rating === null || rating === undefined) {
      return 'not yet rated';
    }
    const count = ratingCount || 0;
    return rating.toFixed(1) + ' / 5 (' + count + ' reviews)';
  }

  /**
   * Render markers for all venues in filteredVenues.
   */
  function renderMarkers() {
    clearMarkers();

    if (!map) {
      return;
    }

    window.AppState.filteredVenues.forEach(venue => {
      // Skip venues without coordinates
      if (venue.lat === null || venue.lat === undefined || venue.lng === null || venue.lng === undefined) {
        return;
      }

      // Create marker
      const marker = L.marker([venue.lat, venue.lng]).addTo(map);

      // Build popup content
      const popupContent = '<div>' +
        '<strong>' + escapeHtml(venue.name) + '</strong><br>' +
        escapeHtml(venue.address) + '<br>' +
        '<strong>Cost:</strong> ' + formatCost(venue.cost_gbp) + '<br>' +
        '<strong>Rating:</strong> ' + formatRating(venue.rating, venue.rating_count) +
        '</div>';

      marker.bindPopup(popupContent);
      markers.push(marker);
    });
  }

  /**
   * Escape HTML to prevent injection.
   */
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Handle state changes: re-render markers and handle load errors.
   */
  function onStateChange() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer) {
      return;
    }

    // If there's a load error, show it instead of the map
    if (window.AppState.loadError) {
      // Clear map if it exists
      if (map) {
        map.remove();
        map = null;
        markers = [];
      }
      mapContainer.innerHTML = '';
      const errorDiv = document.createElement('div');
      errorDiv.style.padding = '20px';
      errorDiv.style.color = '#d32f2f';
      errorDiv.style.fontSize = '16px';
      errorDiv.textContent = window.AppState.loadError;
      mapContainer.appendChild(errorDiv);
      return;
    }

    // No error, ensure map is initialized
    if (!map) {
      initMap();
    }

    // Re-render markers for current filtered venues
    renderMarkers();
  }

  // Initialize map and subscribe to state changes
  window.addEventListener('DOMContentLoaded', () => {
    initMap();
  });

  window.AppState.subscribe(onStateChange);
})();
