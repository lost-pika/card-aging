const SAFE_ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM1ZTZjODQiIHN0cm9rZS13aWR0aD0iMiIgY3g9IjEyIiBjeT0iMTIiIHI9IjkiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjkiLz48L3N2Zz4=';

// Calculates age based on Trello Card ID (Creation Date)
function calculateAgeFromId(cardId, customDateString) {
  const now = new Date();
  let targetDate;
  if (customDateString) {
    targetDate = new Date(customDateString);
  } else {
    // Extract timestamp from the first 8 chars of the MongoDB ObjectId
    const timestamp = parseInt(cardId.substring(0, 8), 16) * 1000;
    targetDate = new Date(timestamp);
  }
  return Math.floor(Math.abs(now - targetDate) / (1000 * 60 * 60 * 24));
}


const showSettingsMenu = function(t) {
  return t.popup({
    title: 'Card Aging Settings',
    items: [
      { text: 'Hide Badge / Disable', callback: t => t.set('card', 'shared', 'badgeHidden', true).then(() => t.closePopup()) },
      { text: 'Reset Card age to 0', callback: t => t.set('card', 'shared', 'customStartDate', new Date().toISOString()).then(() => t.closePopup()) },
      { text: 'Set to Creation Date (Default)', callback: t => t.remove('card', 'shared', 'customStartDate').then(() => t.closePopup()) },
      { text: 'Select Age starting date', callback: t => t.popup({ title: 'Select Date', url: './date-picker.html', height: 250 }) }
    ]
  });
};

window.TrelloPowerUp.initialize({

  'card-badges': function(t, opts) {
    return Promise.all([
      t.card('id'), // Requesting ID instead of activity date
      t.get('card', 'shared')
    ]).then(function([card, data]) {
      if (data && data.badgeHidden) return []; 

      const daysAge = calculateAgeFromId(card.id, data?.customStartDate);

      if (daysAge <= 2) return []; 

      let badgeColor = 'light-gray';
      if (daysAge >= 3 && daysAge <= 5) badgeColor = 'yellow';
      if (daysAge >= 6 && daysAge <= 10) badgeColor = 'orange';
      if (daysAge > 10) badgeColor = 'red';

      return [{ text: `Age: ${daysAge}d`, color: badgeColor }];
    }).catch(e => { return []; }); // Fails gracefully to prevent console spam
  },

  'card-detail-badges': function (t, opts) {
    return Promise.all([
      t.card('id'),
      t.get('card', 'shared')
    ]).then(function([card, data]) {
      if (data && data.badgeHidden) return []; 
      const daysAge = calculateAgeFromId(card.id, data?.customStartDate);
      return [{
        title: 'Total Age',
        text: `${daysAge} Days Old`,
        callback: function (t) { return showSettingsMenu(t); }
      }];
    }).catch(e => { return []; });
  },

  'card-back-section': function(t, options) {
    return {
      title: 'Card Health',
      icon: SAFE_ICON,
      content: { type: 'iframe', url: t.signUrl('./status.html'), height: 120 }
    };
  },

  'show-settings': function(t, options) {
    return t.popup({ title: 'Stale Card Automations', url: './settings.html', height: 200 });
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