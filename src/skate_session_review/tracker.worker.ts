export const workerString = `

// --- Worker Scope ---
let intervalId = null;

// Session state
let userStance = 'REGULAR';
let startTime = null;
let lastTimestamp = null;
let totalDistance = 0;
let timeOnBoard = 0;
let timeOffBoard = 0;
let topSpeed = 0;
let isRolling = false;

// Buffers
let path = [];
let highlights = [];
let lastPosition = null;
let accelBuffer = [];
let gyroBuffer = [];

const BUFFER_SIZE = 40;

// Trick state
let counts = { pumps: 0, ollies: 0, airs: 0, fsGrinds: 0, bsGrinds: 0, stalls: 0, slams: 0 };

// --- THRESHOLDS & DETECTION STATE ---
const FREEFALL_THRESHOLD = 0.5;
const IMPACT_THRESHOLD = 2.5;
const SLAM_THRESHOLD = 5.0;
const ROTATION_THRESHOLD = 220; // deg/s
const PUMP_MIN_G = 1.3;
const PUMP_MAX_G = 2.5;

let freefallStart = 0;
let inAir = false;

let grindState = {
    active: false,
    startTime: 0,
    startRotation: 0,
    type: ''
};

let lastPumpTime = 0;
let pumpPhase = 'none'; // 'compress' or 'decompress'

// ===========================================================================
// GEOLOCATION
// ===========================================================================

function haversineDistance(p1, p2) {
    const R = 6371e3; // meters
    const phi1 = p1.lat * Math.PI / 180;
    const phi2 = p2.lat * Math.PI / 180;
    const dPhi = (p2.lat - p1.lat) * Math.PI / 180;
    const dLambda = (p2.lon - p1.lon) * Math.PI / 180;

    const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function handlePositionUpdate(position) {
    const { latitude, longitude, speed } = position.coords;
    const timestamp = position.timestamp;

    if (latitude == null || longitude == null) return;
    const current = { lat: latitude, lon: longitude, timestamp, speed };

    if (!lastPosition) {
        lastPosition = current;
        path.push(current);
        return;
    }

    const dt = (timestamp - lastPosition.timestamp) / 1000 || 1;
    const dist = haversineDistance(lastPosition, current);
    let effectiveSpeed = speed ?? (dist / dt);

    if (effectiveSpeed < 0.2 || effectiveSpeed > 30 || (dist > 20 && dt < 5)) {
        lastPosition = current;
        return;
    }

    path.push(current);
    totalDistance += dist;
    if (effectiveSpeed > topSpeed) topSpeed = effectiveSpeed;
    lastPosition = current;
}

// ===========================================================================
// SENSOR DATA HANDLING
// ===========================================================================

function handleDeviceMotion(data) {
    const acc = data.acc;
    const rot = data.rot;
    if (!acc || !rot) return;

    accelBuffer.push({ x: acc.x, y: acc.y, z: acc.z, timestamp: data.timestamp });
    gyroBuffer.push({ alpha: rot.alpha, beta: rot.beta, gamma: rot.gamma, timestamp: data.timestamp });

    if (accelBuffer.length > BUFFER_SIZE) accelBuffer.shift();
    if (gyroBuffer.length > BUFFER_SIZE) gyroBuffer.shift();
}

// ===========================================================================
// ACTIVITY & TRICK DETECTION LOGIC
// ===========================================================================

function classifyActivity(speed, stdDev) {
    if (speed > 1.8) return true;
    if (speed < 0.3 && stdDev < 0.1) return false;
    if (stdDev > 0.8) return false; // Likely walking/running
    if (stdDev > 0.08) return true; // Micro-vibrations of rolling
    return false;
}

function detectTricks() {
    if (accelBuffer.length < 5) return;
    const a = accelBuffer[accelBuffer.length - 1];
    const g = gyroBuffer[gyroBuffer.length - 1];
    const gForce = Math.sqrt(a.x**2 + a.y**2 + a.z**2) / 9.81;

    // --- GRIND DETECTION & ENDING ---
    if (grindState.active) {
        // End grind if we jump, slam, or rotate out
        if (inAir || gForce > SLAM_THRESHOLD || Math.abs(g.alpha) > ROTATION_THRESHOLD * 0.8) {
            const duration = (a.timestamp - grindState.startTime) / 1000;
            addHighlight(grindState.type, a.timestamp, duration, 0);
            grindState.active = false;
        }
    }

    // --- FREEFALL / JUMP DETECTION ---
    if (gForce < FREEFALL_THRESHOLD && !inAir && !grindState.active) {
        inAir = true;
        freefallStart = a.timestamp;
    } else if (gForce > 1.2 && inAir) { // LANDING
        inAir = false;
        const airTime = (a.timestamp - freefallStart) / 1000;
        
        if (gForce > SLAM_THRESHOLD) {
            addHighlight("SLAM", a.timestamp, airTime, gForce);
            counts.slams++;
        } else if (gForce > IMPACT_THRESHOLD) {
            if (airTime > 0.35) {
                addHighlight("AIR", a.timestamp, airTime, gForce);
                counts.airs++;
            } else if (airTime > 0.1) {
                addHighlight("OLLIE", a.timestamp, airTime, gForce);
                counts.ollies++;
            }
        }
        freefallStart = 0;
    }

    // --- GRIND/STALL INITIATION ---
    if (Math.abs(g.alpha) > ROTATION_THRESHOLD && !inAir && !grindState.active) {
        // Quick check for a stable G-force before starting a grind
        const recentG = accelBuffer.slice(-5).map(ac => Math.sqrt(ac.x**2 + ac.y**2 + ac.z**2) / 9.81);
        const avgG = recentG.reduce((s, v) => s + v, 0) / recentG.length;
        if (avgG < 2.0) { // Avoid starting grinds mid-air or during slams
            grindState.active = true;
            grindState.startTime = a.timestamp;
            grindState.startRotation = g.alpha;

            const speed = lastPosition?.speed ?? 0;
            let frontside = (userStance === 'REGULAR' && g.alpha > 0) || (userStance === 'GOOFY' && g.alpha < 0);
            
            if (speed < 1.0) {
                grindState.type = "STALL";
                counts.stalls++;
            } else {
                grindState.type = frontside ? "FS_GRIND" : "BS_GRIND";
                if (frontside) counts.fsGrinds++; else counts.bsGrinds++;
            }
        }
    }

    // --- PUMP DETECTION ---
    if (!inAir && !grindState.active && isRolling) {
        if (pumpPhase === 'none' && gForce > PUMP_MAX_G) {
            pumpPhase = 'compress';
        } else if (pumpPhase === 'compress' && gForce < PUMP_MIN_G) {
            pumpPhase = 'decompress';
        } else if (pumpPhase === 'decompress' && gForce > PUMP_MAX_G) {
            // Full cycle complete
            if (a.timestamp - lastPumpTime > 300) { // Debounce
                addHighlight("PUMP", a.timestamp, 0, gForce);
                counts.pumps++;
                lastPumpTime = a.timestamp;
            }
            pumpPhase = 'compress'; // Start next cycle
        }
        // Reset if we stop pumping
        if (a.timestamp - lastPumpTime > 2000) {
            pumpPhase = 'none';
        }
    }
}

// ===========================================================================
// MAIN WORKER LOOP & SESSION CONTROL
// ===========================================================================

function addHighlight(type, timestamp, duration, value) {
    const lastH = highlights[highlights.length - 1];
    if (lastH && (timestamp - lastH.timestamp < 500) && lastH.type === type) return;
    const h = { id: "h_" + timestamp, type, timestamp, duration, value };
    highlights.push(h);
    self.postMessage({ type: "HIGHLIGHT", payload: h });
}

function processSensorData() {
    const now = Date.now();
    if (!startTime) return;
    const dt = lastTimestamp ? (now - lastTimestamp) / 1000 : 0.0;

    let stdDev = 0;
    if (accelBuffer.length > 5) {
        const mags = accelBuffer.map(a => Math.sqrt(a.x**2 + a.y**2 + a.z**2));
        const mean = mags.reduce((a, b) => a + b, 0) / mags.length;
        stdDev = Math.sqrt(mags.map(x => (x - mean)**2).reduce((a, b) => a + b, 0) / mags.length);
    }

    let speed = lastPosition?.speed ?? 0;
    if (speed < 0 || speed > 30) speed = 0;

    isRolling = classifyActivity(speed, stdDev);
    if (isRolling) timeOnBoard += dt; else timeOffBoard += dt;

    detectTricks();

    self.postMessage({
        type: "UPDATE",
        payload: {
            status: "tracking",
            stance: userStance,
            startTime,
            totalDistance,
            duration: (now - startTime) / 1000,
            timeOnBoard,
            timeOffBoard,
            currentSpeed: speed,
            topSpeed,
            isRolling,
            counts
        }
    });

    lastTimestamp = now;
}

function startTracking(stance) {
    userStance = stance;
    startTime = Date.now();
    lastTimestamp = startTime;
    totalDistance = 0; timeOnBoard = 0; timeOffBoard = 0; topSpeed = 0; isRolling = false;
    path = []; highlights = []; accelBuffer = []; gyroBuffer = [];
    counts = { pumps: 0, ollies: 0, airs: 0, fsGrinds: 0, bsGrinds: 0, stalls: 0, slams: 0 };
    freefallStart = 0; inAir = false; grindState = { active: false, startTime: 0, startRotation: 0, type: '' };
    lastPumpTime = 0; pumpPhase = 'none';
    
    if (intervalId !== null) clearInterval(intervalId);
    intervalId = setInterval(processSensorData, 100);
}

function stopTracking() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
    const end = Date.now();
    
    // Find best trick and longest grind
    let bestTrick = null;
    let longestGrind = 0;
    let maxAirtime = 0;

    for (const h of highlights) {
        if ((h.type === 'FS_GRIND' || h.type === 'BS_GRIND' || h.type === 'STALL') && h.duration > longestGrind) {
            longestGrind = h.duration;
        }
        if ((h.type === 'AIR' || h.type === 'OLLIE') && h.duration > maxAirtime) {
            maxAirtime = h.duration;
            bestTrick = h;
        }
    }
    // If longest grind is more impressive than airtime
    if (longestGrind > maxAirtime && longestGrind > 1.0) {
        bestTrick = highlights.find(h => h.duration === longestGrind && (h.type.includes('GRIND') || h.type === 'STALL')) || bestTrick;
    }


    self.postMessage({
        type: "SESSION_END",
        payload: {
            id: "session_" + startTime,
            startTime,
            endTime: end,
            stance: userStance,
            totalDistance,
            activeTime: (end - startTime) / 1000,
            timeOnBoard,
            timeOffBoard,
            topSpeed,
            path,
            highlights,
            counts,
            bestTrick,
            longestGrind,
        }
    });
}

self.onmessage = evt => {
    const { type, payload } = evt.data;
    switch (type) {
        case "START": startTracking(payload.stance); break;
        case "STOP": stopTracking(); break;
        case "POSITION_UPDATE": handlePositionUpdate(payload); break;
        case "MOTION": handleDeviceMotion(payload); break;
    }
};

`