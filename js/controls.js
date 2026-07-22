// Sort, filter, and theme controls for venue list
(function() {
  const controlsElement = document.getElementById('controls');
  if (!controlsElement) return;

  // State for active filters and sort
  let activeSort = null;
  let activeSortDescending = false;
  let minRatingFilter = null;
  let maxCostFilter = null;

  // Initialize theme from localStorage or default to 'light'
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const theme = savedTheme || 'light';
    document.body.setAttribute('data-theme', theme);
  }

  // Create theme toggle button
  const themeButton = document.createElement('button');
  themeButton.className = 'theme-toggle';
  themeButton.textContent = '🌙 Dark Mode';
  themeButton.addEventListener('click', () => toggleTheme());
  controlsElement.appendChild(themeButton);

  /**
   * Toggle between light and dark themes.
   */
  function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButtonText(newTheme);
  }

  /**
   * Update the theme button text based on current theme.
   */
  function updateThemeButtonText(theme) {
    themeButton.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
  }

  // Create sort button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'sort-controls';

  // Create "Cost: low to high" button
  const costButton = document.createElement('button');
  costButton.textContent = 'Cost: low to high';
  costButton.className = 'sort-button';
  costButton.dataset.sortField = 'cost';
  costButton.addEventListener('click', () => setSortAndRecompute('cost_gbp', false));

  // Create "Rating: high to low" button
  const ratingButton = document.createElement('button');
  ratingButton.textContent = 'Rating: high to low';
  ratingButton.className = 'sort-button';
  ratingButton.dataset.sortField = 'rating';
  ratingButton.addEventListener('click', () => setSortAndRecompute('rating', true));

  buttonContainer.appendChild(costButton);
  buttonContainer.appendChild(ratingButton);
  controlsElement.appendChild(buttonContainer);

  // Create filter container
  const filterContainer = document.createElement('div');
  filterContainer.className = 'filter-controls';
  filterContainer.style.marginTop = '16px';

  // Create minimum rating filter
  const minRatingLabel = document.createElement('label');
  minRatingLabel.style.display = 'block';
  minRatingLabel.style.marginBottom = '12px';
  minRatingLabel.style.fontSize = '14px';
  minRatingLabel.textContent = 'Minimum rating (0–5): ';
  const minRatingInput = document.createElement('input');
  minRatingInput.type = 'number';
  minRatingInput.min = '0';
  minRatingInput.max = '5';
  minRatingInput.step = '0.1';
  minRatingInput.placeholder = 'No minimum';
  minRatingInput.style.width = '80px';
  minRatingInput.addEventListener('change', () => {
    const value = minRatingInput.value;
    minRatingFilter = value === '' ? null : parseFloat(value);
    recomputeFilters();
  });
  minRatingLabel.appendChild(minRatingInput);
  filterContainer.appendChild(minRatingLabel);

  // Create maximum cost filter
  const maxCostLabel = document.createElement('label');
  maxCostLabel.style.display = 'block';
  maxCostLabel.style.marginBottom = '12px';
  maxCostLabel.style.fontSize = '14px';
  maxCostLabel.textContent = 'Maximum cost (£): ';
  const maxCostInput = document.createElement('input');
  maxCostInput.type = 'number';
  maxCostInput.min = '0';
  maxCostInput.step = '0.01';
  maxCostInput.placeholder = 'No maximum';
  maxCostInput.style.width = '80px';
  maxCostInput.addEventListener('change', () => {
    const value = maxCostInput.value;
    maxCostFilter = value === '' ? null : parseFloat(value);
    recomputeFilters();
  });
  maxCostLabel.appendChild(maxCostInput);
  filterContainer.appendChild(maxCostLabel);

  controlsElement.appendChild(filterContainer);

  /**
   * Set the active sort and recompute filtered venues with that sort applied.
   * @param {string} field - The venue property to sort by
   * @param {boolean} descending - If true, sort descending; otherwise ascending
   */
  function setSortAndRecompute(field, descending = false) {
    activeSort = field;
    activeSortDescending = descending;
    recomputeFilters();
  }

  /**
   * Recompute filteredVenues from allVenues by applying both filters,
   * then apply the active sort if one is set.
   */
  function recomputeFilters() {
    // Start from allVenues
    let filtered = window.AppState.allVenues.slice();

    // Apply minimum rating filter
    if (minRatingFilter !== null) {
      filtered = filtered.filter(venue => {
        return venue.rating !== null && venue.rating >= minRatingFilter;
      });
    }

    // Apply maximum cost filter
    if (maxCostFilter !== null) {
      filtered = filtered.filter(venue => {
        return venue.cost_gbp !== null && venue.cost_gbp <= maxCostFilter;
      });
    }

    // Update filteredVenues
    window.AppState.filteredVenues = filtered;

    // Reapply active sort if one is set
    if (activeSort !== null) {
      sortVenues(activeSort, activeSortDescending);
    } else {
      // Notify subscribers that state has changed
      window.AppState.notify();
    }
  }

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

  // Initialize theme on page load
  initializeTheme();
  updateThemeButtonText(document.body.getAttribute('data-theme'));
})();