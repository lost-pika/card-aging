const SAFE_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1ZTZjODQiIHN0cm9rZS13aWR0aD0iMiIgY3g9IjEyIiBjeT0iMTIiIHI9IjkiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjkiLz48L3N2Zz4=';

function calculateAgeFromId(cardId, customDateString) {
  const now = new Date();
  let targetDate;
  if (customDateString) {
    targetDate = new Date(customDateString);
  } else {
    const timestamp = parseInt(cardId.substring(0, 8), 16) * 1000;
    targetDate = new Date(timestamp);
  }
  return Math.floor(Math.abs(now - targetDate) / (1000 * 60 * 60 * 24));
}

const showSettingsMenu = function(t) {
  return t.popup({
    title: 'Card Aging Settings',
    items: [
      { text: 'Hide Badge for THIS card', callback: t => t.set('card', 'shared', 'badgeHidden', true).then(() => t.closePopup()) },
      { text: 'Reset Card age to 0', callback: t => t.set('card', 'shared', 'customStartDate', new Date().toISOString()).then(() => t.closePopup()) },
      { text: 'Set to Creation Date (Default)', callback: t => t.remove('card', 'shared', 'customStartDate').then(() => t.closePopup()) },
      { text: 'Select Age starting date', callback: t => t.popup({ title: 'Select Date', url: './date-picker.html', height: 250 }) }
    ]
  });
};

window.TrelloPowerUp.initialize({

  // 1. FRONT OF CARD
  'card-badges': function(t, opts) {
    return Promise.all([
      t.card('id'), 
      t.get('card', 'shared'),
      t.get('board', 'shared') // Fetch board settings to check the global toggle
    ]).then(function([card, cardData, boardData]) {
      
      // If user toggled "Hide Badges" globally, or locally for this card, show nothing.
      if ((boardData && boardData.hideBadges) || (cardData && cardData.badgeHidden)) return []; 

      const daysAge = calculateAgeFromId(card.id, cardData?.customStartDate);
      if (daysAge <= 2) return []; 

      let badgeColor = 'light-gray';
      if (daysAge >= 3 && daysAge <= 5) badgeColor = 'yellow';
      if (daysAge >= 6 && daysAge <= 10) badgeColor = 'orange';
      if (daysAge > 10) badgeColor = 'red';

      return [{ text: `Age: ${daysAge}d`, color: badgeColor }];
    }).catch(e => { return []; });
  },

  // 2. INSIDE CARD (Small Badge)
  'card-detail-badges': function (t, opts) {
    return Promise.all([
      t.card('id'),
      t.get('card', 'shared'),
      t.get('board', 'shared')
    ]).then(function([card, cardData, boardData]) {
      
      if ((boardData && boardData.hideBadges) || (cardData && cardData.badgeHidden)) return []; 
      
      const daysAge = calculateAgeFromId(card.id, cardData?.customStartDate);
      return [{
        title: 'Total Age',
        text: `${daysAge} Days Old`,
        callback: function (t) { return showSettingsMenu(t); }
      }];
    }).catch(e => { return []; });
  },

  // 3. INSIDE CARD (The big health bar section)
  'card-back-section': function(t, options) {
    return t.get('board', 'shared', 'hideBadges').then(function(hideBadges) {
      // If the setting is checked, return null to completely remove the section
      if (hideBadges) return null; 

      return {
        title: 'Card Health',
        icon: SAFE_ICON,
        content: { type: 'iframe', url: t.signUrl('./status.html'), height: 120 }
      };
    }).catch(e => { return null; });
  },

  // BOARD BUTTONS & SETTINGS
  'show-settings': function(t, options) {
    return t.popup({ title: 'Stale Card Automations', url: './settings.html', height: 260 }); // Increased height slightly to fit new option
  },

  'board-buttons': function(t, options) {
    return t.get('board', 'shared', 'sweepEnabled', false).then(function(isEnabled) {
      if (!isEnabled) return [];
      return [{
        icon: { dark: SAFE_ICON, light: SAFE_ICON },
        text: '🧹 Sweep Stale Cards',
        callback: function(t) {
          return t.modal({ title: 'Sweeping Stale Cards...', url: './sweep.html', height: 300 });
        }
      }];
    }).catch(e => { return []; });
  }
});