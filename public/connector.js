console.log("✅ connector.js loaded");

if (window.TrelloPowerUp) {

  window.TrelloPowerUp.initialize({

    'card-detail-badges': function(t) {
      return t.card('dateLastActivity', 'name')
        .then(function(card) {

          const last = new Date(card.dateLastActivity);
          const now = new Date();
          const days = Math.floor((now - last) / (1000 * 60 * 60 * 24));

          let color = 'green';
          if (days >= 3) color = 'yellow';
          if (days >= 6) color = 'orange';
          if (days >= 10) color = 'red';

          console.log(`📊 ${card.name} → ${days} days`);

          return [{
            title: 'Card Aging',
            text: `${days} days inactive`,
            color: color
          }];
        });
    }

  });

} else {
  console.log("❌ TrelloPowerUp not found");
}