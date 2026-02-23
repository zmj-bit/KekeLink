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
    type TEXT, -- 'incident', 'lost_found', 'safety_report'
    category TEXT,
    risk_level TEXT,
    content TEXT,
    location TEXT,
    audio_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

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

  app.post("/api/auth/register", (req, res) => {
    const { role, name, phone, nin, address, dob, next_of_kin, photo_url, student_id, student_expiry } = req.body;
    try {
      const info = db.prepare(`
        INSERT INTO users (role, name, phone, nin, address, dob, next_of_kin, photo_url, student_id, student_expiry)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(role, name, phone, nin, address, dob, next_of_kin, photo_url, student_id, student_expiry);
      res.json({ id: info.lastInsertRowid, success: true });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get("/api/users/:phone", (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE phone = ?").get(req.params.phone);
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
  });

  app.post("/api/trips/start", (req, res) => {
    const { passenger_id, driver_id, keke_id, start_lat, start_lng } = req.body;
    const info = db.prepare(`
      INSERT INTO trips (passenger_id, driver_id, keke_id, start_lat, start_lng, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `).run(passenger_id, driver_id, keke_id, start_lat, start_lng);
    res.json({ id: info.lastInsertRowid });
  });

  app.post("/api/trips/complete", (req, res) => {
    const { trip_id, end_lat, end_lng, fare } = req.body;
    db.prepare(`
      UPDATE trips SET end_lat = ?, end_lng = ?, fare = ?, status = 'completed'
      WHERE id = ?
    `).run(end_lat, end_lng, fare, trip_id);
    res.json({ success: true });
  });

  // WebSocket for Real-time
  const clients = new Map<number, WebSocket>();
  const driverLocations = new Map<number, { lat: number, lng: number, name: string, kekeId: string }>();

  wss.on("connection", (ws) => {
    let userId: number | null = null;
    let userRole: string | null = null;

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());
      
      if (data.type === "auth") {
        userId = data.userId;
        userRole = data.role;
        if (userId) clients.set(userId, ws);
      }

      if (data.type === "location_update" && userId && userRole === 'driver') {
        driverLocations.set(userId, { 
          lat: data.lat, 
          lng: data.lng, 
          name: data.name, 
          kekeId: data.kekeId 
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
      }

      if (data.type === "sos" && userId) {
        // Broadcast SOS to admin/gov and nearby drivers
        console.log(`SOS from user ${userId}`);
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "sos_alert", userId, location: data.location }));
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
