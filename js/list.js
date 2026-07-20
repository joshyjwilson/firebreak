// List rendering and venue display
(function() {
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
  function formatRating(rating) {
    if (rating === null || rating === undefined) {
      return 'not yet rated';
    }
    return rating.toFixed(1) + ' / 5';
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
   * Render the venue list.
   */
  function renderList() {
    const listContainer = document.getElementById('venue-list');
    if (!listContainer) {
      console.error('List container with id="venue-list" not found');
      return;
    }

    // Clear the container
    listContainer.innerHTML = '';

    // If there's a load error, show it
    if (window.AppState.loadError) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'list-error';
      errorDiv.style.padding = '20px';
      errorDiv.style.color = '#d32f2f';
      errorDiv.style.fontSize = '14px';
      errorDiv.textContent = window.AppState.loadError;
      listContainer.appendChild(errorDiv);
      return;
    }

    // Render each venue as a row
    window.AppState.filteredVenues.forEach(venue => {
      const row = document.createElement('div');
      row.className = 'list-row';
      row.style.cursor = 'pointer';
      row.style.borderBottom = '1px solid #e0e0e0';
      row.style.padding = '12px';
      row.style.transition = 'background-color 0.2s';
      row.addEventListener('mouseenter', () => {
        row.style.backgroundColor = '#f5f5f5';
      });
      row.addEventListener('mouseleave', () => {
        row.style.backgroundColor = 'transparent';
      });

      // Build row content
      let html = '<div style="margin-bottom: 4px;"><strong>' + escapeHtml(venue.name) + '</strong>';

      // Add location unavailable note if no coordinates
      if (venue.lat === null || venue.lat === undefined || venue.lng === null || venue.lng === undefined) {
        html += ' <span style="font-size: 12px; color: #999;">(location unavailable)</span>';
      }

      html += '</div>';
      html += '<div style="font-size: 13px; color: #666; margin-bottom: 8px;">' + escapeHtml(venue.address) + '</div>';
      html += '<div style="font-size: 13px; color: #666; margin-bottom: 4px;"><strong>Cost:</strong> ' + formatCost(venue.cost_gbp) + '</div>';
      html += '<div style="font-size: 13px; color: #666;"><strong>Rating:</strong> ' + formatRating(venue.rating) + '</div>';

      row.innerHTML = html;

      // Attach click handler to open popup if map.openPopup exists
      row.addEventListener('click', () => {
        if (window.map && typeof window.map.openPopup === 'function') {
          window.map.openPopup(venue.id);
        }
      });

      listContainer.appendChild(row);
    });
  }

  /**
   * Handle state changes: re-render the list.
   */
  function onStateChange() {
    renderList();
  }

  // Subscribe to state changes
  window.AppState.subscribe(onStateChange);
})();