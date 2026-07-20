// Global application state
window.AppState = {
  allVenues: [],
  filteredVenues: [],
  loadError: null,
  _subscribers: [],

  /**
   * Fetch venue data from data/devon_venues.json, parse it, and populate state.
   * On success, sets allVenues and filteredVenues, calls subscribers.
   * On failure, sets loadError and calls subscribers with error state.
   */
  async load() {
    try {
      const response = await fetch('data/devon_venues.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Unable to load venue data`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Venue data is not an array');
      }
      this.allVenues = data;
      this.filteredVenues = data;
      this.loadError = null;
    } catch (error) {
      this.loadError = 'Failed to load venue data. Please refresh the page.';
      this.allVenues = [];
      this.filteredVenues = [];
    }
    this._notifySubscribers();
  },

  /**
   * Register a callback to be invoked whenever filteredVenues changes.
   * Callback is called immediately after load() completes (success or failure).
   */
  subscribe(callback) {
    if (typeof callback === 'function') {
      this._subscribers.push(callback);
    }
  },

  /**
   * Internal: notify all subscribers that state has changed.
   */
  _notifySubscribers() {
    this._subscribers.forEach(callback => {
      callback();
    });
  }
};
