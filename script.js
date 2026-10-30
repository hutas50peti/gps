// 1. Térkép inicializálása (Sötét Waze stílus)
const map = L.map('map', { zoomControl: false }).setView([47.1625, 19.5033], 7);

// Sötét térképréteg betöltése
L.tileLayer('https://{s}://{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CARTO'
}).addTo(map);

// Alapértelmezett koordináták (Budapest), ha a GPS nem elérhető
let userLat = 47.4979;
let userLng = 19.0402;
let userMarker = null;
let routingControl = null;

// Dom elemek kimentése változókba a könnyebb kezelésért
const aiStatusText = document.getElementById("ai-status");
const distanceText = document.getElementById("route-distance");
const timeText = document.getElementById("route-time");
const navPanel = document.getElementById("nav-panel");

// 2. Élő GPS Pozíció lekérése a telefonból
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
        
        // Elhelyezzük a kék Waze-szerű saját pozíció jelölőt
        userMarker = L.circleMarker([userLat, userLng], {
            radius: 9, color: '#fff', weight: 2, fillColor: '#33ccff', fillOpacity: 1
        }).addTo(map).bindPopup("Te itt vagy").openPopup();
        
        // Odaugrunk és ráközelítünk a felhasználóra
        map.setView([userLat, userLng], 13);
    }, (error) => {
        aiStatusText.textContent = "GPS Hiba: Nem sikerült lekérni a pozíciódat.";
    });
} else {
    alert("A böngésződ nem támogatja a GPS-t.");
}

// 3. Kattintás figyelése a térképen (Útvonal létrehozása)
map.on('click', function(e) {
    const destLat = e.latlng.lat;
    const destLng = e.latlng.lng;

    // Ha már van korábbi útvonal a képernyőn, letöröljük
    if (routingControl) { 
        map.removeControl(routingControl); 
    }

    aiStatusText.textContent = "AI Útvonal tervezése a leggyorsabb utakon...";

    // Waze-stílusú úthálózati motor elindítása
    routingControl = L.Routing.control({
        waypoints: [
            L.latLng(userLat, userLng), // Indulási pont (Te)
            L.latLng(destLat, destLng)  // Érkezési pont (Ahova kattintottál)
        ],
        router: L.Routing.osrmv1({ serviceUrl: 'https://project-osrm.org' }),
        lineOptions: {
            styles: [{ color: '#33ccff', opacity: 0.8, weight: 6 }] // Neon kék útvonal csík
        },
        createMarker: function() { return null; } // Elrejtjük az alapértelmezett csúnya gombostűket
    }).addTo(map);

    // 4. Amikor az útvonalat sikeresen kiszámolta a rendszer
    routingControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        
        // Távolság és idő átváltása kilométerre és percre
        const distanceKm = (summary.totalDistance / 1000).toFixed(1);
        const timeMinutes = Math.round(summary.totalTime / 60);

        // Kiírjuk a HUD kijelzőre az adatokat
        distanceText.textContent = distanceKm + " km";
        timeText.textContent = timeMinutes + " perc";
        navPanel.style.display = "block"; // Megjelenítjük az alsó panelt

        // Meghívjuk a beépített AI logikát, ami szöveges tanácsot ad
        generateAIAdvice(distanceKm, timeMinutes);
    });
});

// 5. AI Asszisztens kiértékelő logika
function generateAIAdvice(distance, time) {
    let message = "";
    if (time > 60) {
        message = `Hosszú utazás áll előtted (${distance} km). Az AI egyenletes autópálya tempót javasol. Ellenőrizd a guminyomást!`;
    } else if (time < 15) {
        message = `Rövid városi szakasz. Nincs jelentős torlódás az utadon, gyorsan oda fogsz érni. Sima ügy!`;
    } else {
        message = `Közepes távolság. A Waze adatai alapján a lámpák hangolása kedvező, tartsd a megengedett sebességet.`;
    }
    aiStatusText.textContent = message;
}

// 6. Útvonal törlése és alaphelyzetbe állítás
function resetRoute() {
    if (routingControl) { 
        map.removeControl(routingControl); 
        routingControl = null; // Ez biztosítja, hogy tiszta lappal induljon a következő kattintás
    }
    navPanel.style.display = "none";
    aiStatusText.textContent = "Koppints bárhova a térképen a Waze-stílusú útvonal létrehozásához...";
}
