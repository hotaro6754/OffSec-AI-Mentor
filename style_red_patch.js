const fs = require('fs');
let css = fs.readFileSync('/app/style.css', 'utf8');

// Replace color
css = css.replace(/#00ff00/g, '#ff3e00');
css = css.replace(/#0F0/g, '#ff3e00'); // For matrix rain too? Or should I keep it green? User said "Icons are too harsh and make it red colour"
// User also mentioned "Those green letters raining in background = Matrix Digital Rain Animation" earlier.
// If I change matrix to red it might look cooler and match the "Icons are red" request.

// Soften borders
css = css.replace(/border: 4px solid #ff3e00/g, 'border: 2.5px solid #ff3e00');
css = css.replace(/border: 3px solid #ff3e00/g, 'border: 2px solid #ff3e00');
css = css.replace(/border-top: 4px solid #000/g, 'border-top: 2.5px solid #000');
css = css.replace(/border: 4px solid #000/g, 'border: 2.5px solid #000');

// Soften shadows
css = css.replace(/box-shadow: 10px 10px 0 rgba\(255, 62, 0, 0.2\)/g, 'box-shadow: 6px 6px 0 rgba(255, 62, 0, 0.15)');
css = css.replace(/box-shadow: 4px 4px 0 #ff3e00/g, 'box-shadow: 3px 3px 0 #ff3e00');

fs.writeFileSync('/app/style.css', css);
