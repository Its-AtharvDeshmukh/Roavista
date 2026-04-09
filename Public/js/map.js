mapboxgl.accessToken = mapToken;

const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v12', // style URL
    center: listing.geometry.coordinates, // [lng, lat]
    zoom: 9 // starting zoom
});

// Create a gold marker for Roavista
new mapboxgl.Marker({ color: '#C4805A' })
    .setLngLat(listing.geometry.coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
        .setHTML(`<h4>${listing.title}</h4><p>Exact location provided after booking</p>`)
    )
    .addTo(map);


const popupHtml = `<h4>${escapeHTML(listing.title)}</h4><p>Exact Location provided after booking</p>`;

new mapboxgl.Popup({ offset: 25 })
    .setHTML(popupHtml)
    .addTo(map);

// Add this helper function at the top of your map.js file to sanitize text:
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}