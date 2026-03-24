// Helper function to calculate exact days between a given date and today
function calculateDays(dateString) {
  if (!dateString) return 0;
  const start = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - start);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

// The functional popup menu
const showSettingsMenu = function(t) {
  return t.popup({
    title: 'Card Aging Settings',
    items: [
      {
        text: 'Hide Badge / Disable',
        callback: function(t) {
          return t.set('card', 'shared', 'badgeHidden', true).then(() => t.closePopup());
        }
      },
      {
        text: 'Reset Card age to 0',
        callback: function(t) {
          return t.set('card', 'shared', 'customStartDate', new Date().toISOString()).then(() => t.closePopup());
        }
      },
      {
        text: 'Set to last Updated (Default)',
        callback: function(t) {
          return t.remove('card', 'shared', 'customStartDate').then(() => t.closePopup());
        }
      },
      {
        text: 'Select Age starting date',
        callback: function(t) {
          return t.popup({ title: 'Select Date', url: './date-picker.html', height: 250 });
        }
      }
    ]
  });
};

// --- POWER-UP INITIALIZATION ---
window.TrelloPowerUp.initialize({

  // 1. FRONT OF CARD BADGES (The visual colored indicator on the board)
  'card-badges': function(t, opts) {
    return Promise.all([
      t.card('dateLastActivity'),
      t.get('card', 'shared')
    ]).then(function([card, data]) {
      
      if (data && data.badgeHidden) return []; // Respect user settings

      const targetDate = (data && data.customStartDate) ? data.customStartDate : card.dateLastActivity;
      const daysAge = calculateDays(targetDate);

      // Threshold Logic (0-2: Hidden, 3-5: Yellow, 6-10: Orange, 10+: Red)
      if (daysAge <= 2) return []; 

      let badgeColor = 'light-gray';
      if (daysAge >= 3 && daysAge <= 5) badgeColor = 'yellow';
      if (daysAge >= 6 && daysAge <= 10) badgeColor = 'orange';
      if (daysAge > 10) badgeColor = 'red';

      return [{
        text: `Inactive: ${daysAge}d`, // This acts as the text and the tooltip
        color: badgeColor
      }];
    });
  },

  // 2. CARD DETAIL BADGES (Inside the card, clicks to open settings)
  'card-detail-badges': function (t, opts) {
    return Promise.all([
      t.card('dateLastActivity'),
      t.get('card', 'shared')
    ]).then(function([card, data]) {
      
      if (data && data.badgeHidden) return []; 

      const targetDate = (data && data.customStartDate) ? data.customStartDate : card.dateLastActivity;
      const daysAge = calculateDays(targetDate);

      return [{
        title: 'Aging Status',
        text: `${daysAge} Days Inactive`,
        callback: function (t) { return showSettingsMenu(t); }
      }];
    });
  },

  // 3. VISUAL AGING ENGINE (Loads the visual iframe inside the card)
  'card-back-section': function(t, options) {
    return {
      title: 'Card Health',
      icon: 'https://cdn.hyperdev.com/us-east-1%3A3d311d30-503d-4299-9432-03d872f2d924%2Fgray-dot.svg',
      content: {
        type: 'iframe',
        url: t.signUrl('./status.html'),
        height: 120 // Height for the health bar
      }
    };
  }
});