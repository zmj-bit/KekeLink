import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("kekelink.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL, -- 'passenger', 'driver', 'admin'
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    nin TEXT,
    address TEXT,
    dob TEXT,
    next_of_kin TEXT,
    photo_url TEXT,
    is_verified INTEGER DEFAULT 0,
    student_id TEXT,
    student_expiry TEXT
  );

  CREATE TABLE IF NOT EXISTS kekes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unique_number TEXT UNIQUE NOT NULL,
    owner_id INTEGER,
    current_driver_id INTEGER,
    FOREIGN KEY(owner_id) REFERENCES users(id),
    FOREIGN KEY(current_driver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    passenger_id INTEGER,
    driver_id INTEGER,
    keke_id INTEGER,
    start_lat REAL,
    start_lng REAL,
    end_lat REAL,
    end_lng REAL,
    distance TEXT,
    safety_score INTEGER,
    status TEXT DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    fare REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(passenger_id) REFERENCES users(id),
    FOREIGN KEY(driver_id) REFERENCES users(id),
    FOREIGN KEY(keke_id) REFERENCES kekes(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    trip_id INTEGER,
    type TEXT, -- 'incident', 'lost_found', 'safety_report', 'route_feedback'
    category TEXT,
    risk_level TEXT,
    content TEXT,
    location TEXT,
    audio_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS route_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER,
    route_name TEXT,
    origin TEXT,
    destination TEXT,
    rating INTEGER, -- 1-5
    comments TEXT,
    safety_concerns TEXT,
    traffic_level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(driver_id) REFERENCES users(id)
  );

  -- Seed a mock Keke for testing
  INSERT OR IGNORE INTO kekes (id, unique_number) VALUES (1, 'KL-2024-089');

  -- Seed mock passengers for the demo
  INSERT OR IGNORE INTO users (id, role, name, phone, is_verified) VALUES 
  (101, 'passenger', 'Zainab Aliyu', '08000000101', 1),
  (102, 'passenger', 'Musa Bello', '08000000102', 1),
  (103, 'passenger', 'Aisha Umar', '08000000103', 1);

  -- Seed mock drivers
  INSERT OR IGNORE INTO users (id, role, name, phone, is_verified) VALUES 
  (201, 'driver', 'Ibrahim Kano', '08000000201', 1),
  (202, 'driver', 'Sani Zaria', '08000000202', 1);

  -- Seed mock trips
  INSERT OR IGNORE INTO trips (id, driver_id, passenger_id, status, safety_score, created_at) VALUES 
  (1, 201, 101, 'completed', 95, datetime('now', '-1 day')),
  (2, 201, 102, 'completed', 88, datetime('now', '-2 days')),
  (3, 202, 103, 'completed', 92, datetime('now', '-1 day')),
  (4, 202, 101, 'completed', 75, datetime('now', '-3 days'));

  -- Seed some safety reports for the heatmap
  INSERT OR IGNORE INTO reports (user_id, type, category, risk_level, location, created_at) VALUES 
  (1, 'safety_report', 'Suspicious Activity', 'high', 'Kano Central Market', datetime('now')),
  (2, 'safety_report', 'Traffic Violation', 'medium', 'Bayero University Road', datetime('now')),
  (3, 'safety_report', 'Poor Lighting', 'low', 'Sabon Gari', datetime('now')),
  (4, 'safety_report', 'Unsafe Driving', 'high', 'Zoo Road', datetime('now')),
  (5, 'safety_report', 'Crowd Gathering', 'medium', 'Kofar Nassarawa', datetime('now')),
  (201, 'safety_report', 'Unsafe Driving', 'high', 'Zoo Road', datetime('now', '-1 hour'));

  -- Seed route feedback
  INSERT OR IGNORE INTO route_feedback (driver_id, route_name, origin, destination, rating, safety_concerns, traffic_level) VALUES 
  (201, 'Zoo Road Corridor', 'Zoo Road', 'Kano Market', 4, 'Potholes near junction', 'heavy'),
  (202, 'BUK Road', 'BUK Old Site', 'Sabon Gari', 5, 'Well lit', 'moderate'),
  (201, 'Sabon Gari Market', 'Sabon Gari', 'Zoo Road', 2, 'Suspicious groups near market entrance', 'gridlock');
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });
  const PORT = 3000;

  app.use(express.json());

  // Handle WebSocket upgrades manually to avoid conflict with Vite HMR
  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  // API Routes
  app.post("/api/reports/safety", (req, res) => {
    const { user_id, type, category, risk_level, content, location } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO reports (user_id, type, category, risk_level, content, location)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(user_id, type, category, risk_level, content, location);
      
      // Broadcast to all clients if high risk
      if (risk_level === 'high') {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "safety_alert", 
              category, 
              location, 
              summary: content 
            }));
          }
        });
      }

      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/reports/hotspots", (req, res) => {
    const hotspots = db.prepare(`
      SELECT location, category, risk_level, COUNT(*) as count 
      FROM reports 
      WHERE type = 'safety_report' AND created_at > datetime('now', '-24 hours')
      GROUP BY location, category, risk_level
    `).all();
    res.json(hotspots);
  });

  app.post("/api/reports/route-feedback", (req, res) => {
    const { driver_id, route_name, origin, destination, rating, comments, safety_concerns, traffic_level } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO route_feedback (driver_id, route_name, origin, destination, rating, comments, safety_concerns, traffic_level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(driver_id, route_name, origin, destination, rating, comments, safety_concerns, traffic_level);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/reports/route-intelligence", (req, res) => {
    const feedback = db.prepare(`
      SELECT * FROM route_feedback 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all();
    res.json(feedback);
  });

  // Admin Analytics Endpoints
  app.get("/api/admin/safety-analytics", (req, res) => {
    try {
      const totalReports = db.prepare("SELECT COUNT(*) as count FROM reports").get().count;
      const reportsByCategory = db.prepare("SELECT category, COUNT(*) as count FROM reports GROUP BY category").all();
      const reportsByRisk = db.prepare("SELECT risk_level, COUNT(*) as count FROM reports GROUP BY risk_level").all();
      const recentAnomalies = db.prepare("SELECT * FROM reports WHERE type = 'safety_report' AND risk_level = 'high' ORDER BY created_at DESC LIMIT 10").all();
      
      const routeRisk = db.prepare(`
        SELECT route_name, AVG(rating) as avg_rating, COUNT(*) as feedback_count, 
        GROUP_CONCAT(safety_concerns) as concerns
        FROM route_feedback 
        GROUP BY route_name
      `).all();

      res.json({
        totalReports,
        reportsByCategory,
        reportsByRisk,
        recentAnomalies,
        routeRisk
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/admin/driver-stats", (req, res) => {
    try {
      const stats = db.prepare(`
        SELECT u.id, u.name, u.phone, 
        COUNT(t.id) as total_trips, 
        AVG(t.safety_score) as avg_safety_score,
        (SELECT COUNT(*) FROM reports r WHERE r.user_id = u.id AND r.risk_level = 'high') as high_risk_reports
        FROM users u
        LEFT JOIN trips t ON u.id = t.driver_id
        WHERE u.role = 'driver'
        GROUP BY u.id
      `).all();
      res.json(stats);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { role, name, phone, nin, address, dob, next_of_kin, photo_url, student_id, student_expiry } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO users (role, name, phone, nin, address, dob, next_of_kin, photo_url, student_id, student_expiry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(role, name, phone, nin, address, dob, next_of_kin, photo_url, student_id, student_expiry);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      if (e.message.includes("UNIQUE constraint failed: users.phone")) {
        res.status(400).json({ error: "This phone number is already registered. Please use a different number or log in." });
      } else {
        res.status(400).json({ error: e.message });
      }
    }
  });

  app.get("/api/users/:phone", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(req.params.phone);
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
  });

  app.post("/api/trips/start", (req, res) => {
    const { passenger_id, driver_id, keke_id, start_lat, start_lng } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO trips (passenger_id, driver_id, keke_id, start_lat, start_lng, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(passenger_id, driver_id, keke_id, start_lat, start_lng);
      res.json({ id: info.lastInsertRowid });
    } catch (e: any) {
      console.error("Trip start error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/trips/complete", (req, res) => {
    const { trip_id, end_lat, end_lng, fare, distance, safety_score } = req.body;
    try {
      db.prepare(`
        UPDATE trips SET end_lat = ?, end_lng = ?, fare = ?, distance = ?, safety_score = ?, status = 'completed'
        WHERE id = ?
      `).run(end_lat, end_lng, fare, distance, safety_score, trip_id);
      res.json({ success: true });
    } catch (e: any) {
      console.error("Trip complete error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // WebSocket for Real-time
  const clients = new Map<number, WebSocket>();
  const clientInfo = new Map<WebSocket, { userId: number, role: string }>();
  const driverLocations = new Map<number, { lat: number, lng: number, name: string, kekeId: string, status: string }>();
  const passengerLocations = new Map<number, { lat: number, lng: number, isActiveTrip: boolean }>();

  function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  wss.on("connection", (ws) => {
    let userId: number | null = null;
    let userRole: string | null = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === "auth") {
        userId = data.userId;
        userRole = data.role;
        if (userId) {
          clients.set(userId, ws);
          clientInfo.set(ws, { userId, role: userRole });
        }
      }

      if (data.type === "location_update" && userId) {
        if (userRole === 'driver') {
          driverLocations.set(userId, { 
            lat: data.lat, 
            lng: data.lng, 
            name: data.name, 
            kekeId: data.kekeId,
            status: data.status || 'Available'
          });
          
          // Broadcast all driver locations to all passengers
          const locations = Array.from(driverLocations.entries()).map(([id, loc]) => ({
            driverId: id,
            ...loc
          }));

          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "nearby_kekes", locations }));
            }
          });
        } else if (userRole === 'passenger') {
          passengerLocations.set(userId, {
            lat: data.lat,
            lng: data.lng,
            isActiveTrip: data.isActiveTrip || false
          });
        }
      }

      if (data.type === "sos" && userId) {
        // Broadcast SOS to admin/gov and nearby drivers/passengers
        const timestamp = new Date().toISOString();
        const senderName = data.userName || `User ${userId}`;
        const sosLat = data.lat;
        const sosLng = data.lng;

        console.log(`[EMERGENCY] SOS from ${senderName} (ID: ${userId}) at ${timestamp}`);
        console.log(`[AUTHORITIES] Notifying Kano State Road Traffic Agency (KAROTA) and Emergency Services...`);
        
        wss.clients.forEach((wsClient) => {
          if (wsClient.readyState === WebSocket.OPEN) {
            const info = clientInfo.get(wsClient);
            const targetUserId = info?.userId;
            const targetRole = info?.role;

            let shouldSend = true; // Default to true for admin/others
            
            if (targetUserId && sosLat && sosLng) {
              let targetLoc = null;
              if (targetRole === 'driver') {
                targetLoc = driverLocations.get(targetUserId);
              } else if (targetRole === 'passenger') {
                targetLoc = passengerLocations.get(targetUserId);
                // Only send to passengers in active trips within 5km
                if (!targetLoc?.isActiveTrip) shouldSend = false;
              }

              if (targetLoc && shouldSend) {
                const dist = getDistance(sosLat, sosLng, targetLoc.lat, targetLoc.lng);
                if (dist > 5) shouldSend = false;
              }
            }

            if (shouldSend) {
              wsClient.send(JSON.stringify({ 
                type: "sos_alert", 
                userId, 
                userName: senderName,
                location: data.location,
                lat: sosLat,
                lng: sosLng,
                tripData: data.tripData,
                timestamp,
                isSOS: true,
                priority: 'CRITICAL',
                notifiedAuthorities: ['KAROTA', 'Police', 'Emergency Response']
              }));
            }
          }
        });
      }

      if (data.type === "anomaly_alert" && userId) {
        console.log(`Anomaly detected for user ${userId}: ${data.reason}`);
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              type: "safety_alert", 
              category: "Trip Anomaly", 
              location: "Active Trip", 
              summary: `Driver ${userId}: ${data.reason} (Risk: ${data.risk_level})` 
            }));
          }
        });
      }
    });

    ws.on("close", () => {
      if (userId) {
        clients.delete(userId);
        clientInfo.delete(ws);
        passengerLocations.delete(userId);
        if (userRole === 'driver') {
          driverLocations.delete(userId);
          // Broadcast update
          const locations = Array.from(driverLocations.entries()).map(([id, loc]) => ({
            driverId: id,
            ...loc
          }));
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "nearby_kekes", locations }));
            }
          });
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
