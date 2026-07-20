// Sort controls for venue list
(function() {
  const controlsElement = document.getElementById('controls');
  if (!controlsElement) return;

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'sort-controls';

  // Create "Cost: low to high" button
  const costButton = document.createElement('button');
  costButton.textContent = 'Cost: low to high';
  costButton.className = 'sort-button';
  costButton.dataset.sortField = 'cost';
  costButton.addEventListener('click', () => sortVenues('cost_gbp'));

  // Create "Rating: high to low" button
  const ratingButton = document.createElement('button');
  ratingButton.textContent = 'Rating: high to low';
  ratingButton.className = 'sort-button';
  ratingButton.dataset.sortField = 'rating';
  ratingButton.addEventListener('click', () => sortVenues('rating', true));

  buttonContainer.appendChild(costButton);
  buttonContainer.appendChild(ratingButton);
  controlsElement.appendChild(buttonContainer);

  /**
   * Sort filteredVenues in place by the specified field.
   * Venues with null values for the field always sort to the end.
   * @param {string} field - The venue property to sort by (e.g., 'cost_gbp', 'rating')
   * @param {boolean} descending - If true, sort descending (high to low); otherwise ascending (low to high)
   */
  function sortVenues(field, descending = false) {
    window.AppState.filteredVenues.sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      // Nulls always go to the end
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Both non-null: compare
      if (descending) {
        return bValue - aValue;
      } else {
        return aValue - bValue;
      }
    });

    // Notify subscribers that state has changed
    window.AppState.notify();
  }
})();
