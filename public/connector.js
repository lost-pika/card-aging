// Helper function to calculate exact days between a given date and today
function calculateDays(dateString) {
  if (!dateString) return 0;
  const start = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// The functional popup menu that actually saves/removes data
const showSettingsMenu = function(t) {
  return t.popup({
    title: 'Card Aging Settings',
    items: [
      {
        text: 'Hide Badge / Disable',
        callback: function(t) {
          // Saves a hidden flag to Trello's database for this card
          return t.set('card', 'shared', 'badgeHidden', true)
            .then(() => t.closePopup());
        }
      },
      {
        text: 'Reset Card age to 0',
        callback: function(t) {
          // Overrides the start date with right now
          return t.set('card', 'shared', 'customStartDate', new Date().toISOString())
            .then(() => t.closePopup());
        }
      },
      {
        text: 'Set to last Updated',
        callback: function(t) {
          // Deletes the custom override, falling back to Trello's default activity date
          return t.remove('card', 'shared', 'customStartDate')
            .then(() => t.closePopup());
        }
      },
      {
        text: 'Select Age starting date',
        callback: function(t) {
          // Opens a custom UI to pick a specific date
          return t.popup({
            title: 'Select Date',
            url: '/date-picker.html', // Ensure you create this file in your Vite public folder
            height: 250
          });
        }
      }
    ]
  });
};

// Power-Up Initialization
window.TrelloPowerUp.initialize({
  'card-detail-badges': function (t, opts) {
    // Fetch both the Trello card data AND our custom saved data at the same time
    return Promise.all([
      t.card('dateLastActivity'),
      t.get('card', 'shared')
    ]).then(function([card, data]) {
      
      // 1. If the user clicked "Hide Badge", return an empty array to remove it from the UI
      if (data && data.badgeHidden) {
        return []; 
      }

      // 2. Determine which date to calculate from
      // Use the custom date if they reset/changed it, otherwise use Trello's default last activity
      const targetDate = (data && data.customStartDate) ? data.customStartDate : card.dateLastActivity;
      
      // 3. Perform the actual math
      const daysAge = calculateDays(targetDate);

      // 4. Render the functional badge
      return [{
        title: 'Last updated',
        text: `${daysAge} Days`,
        callback: function (t) {
          return showSettingsMenu(t);
        }
      }];
    });
  },
  'show-settings': function(t, options) {
    return t.popup({
      title: 'Stale Card Automations',
      url: './settings.html',
      height: 200
    });
  },

  // 2. Add the Board Button (Only shows if feature is enabled)
  'board-buttons': function(t, options) {
    // Check if the team enabled the feature in settings
    return t.get('board', 'shared', 'sweepEnabled', false).then(function(isEnabled) {
      if (!isEnabled) return []; // Hide button if disabled

      return [{
        icon: {
          dark: 'https://cdn.hyperdev.com/us-east-1%3A3d311d30-503d-4299-9432-03d872f2d924%2Fgray-dot.svg',
          light: 'https://cdn.hyperdev.com/us-east-1%3A3d311d30-503d-4299-9432-03d872f2d924%2Fgray-dot.svg'
        },
        text: '🧹 Sweep Stale Cards',
        callback: function(t) {
          // Opens a modal to execute the moving script
          return t.modal({
            title: 'Sweeping Stale Cards...',
            url: './sweep.html',
            height: 300
          });
        }
      }];
    });
  }
});
