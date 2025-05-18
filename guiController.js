/**
 * Web Controller for Smart City Services
 *
 * Provides a simple web interface to interact with all three services:
 * Traffic Light, Parking, and Transport.
 * Based on the examples from RESTFUL API LAB DEMONSTRATION class material
 */

const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Create Express app
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public directory
app.use(express.static("views"));

// Load service protos
function loadProto(path) {
  const packageDefinition = protoLoader.loadSync(path);
  return grpc.loadPackageDefinition(packageDefinition);
}

const trafficProto = loadProto("./protos/trafficLight.proto").trafficlight;
const parkingProto = loadProto("./protos/parking.proto").parking;
const transportProto = loadProto("./protos/transport.proto").transport;

// Create gRPC clients
const trafficClient = new trafficProto.TrafficLightService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

const parkingClient = new parkingProto.ParkingService(
  "localhost:50052",
  grpc.credentials.createInsecure()
);

const transportClient = new transportProto.TransportService(
  "localhost:50053",
  grpc.credentials.createInsecure()
);

// Home route - will serve index.html from the public directory
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "./views" });
});

// API Routes for Traffic Light Service
app.get("/api/traffic/lights", (req, res) => {
  // Example implementation - in a real scenario, this would fetch from database
  const lights = [
    { id: "light-001", color: "red" },
    { id: "light-002", color: "green" },
    { id: "light-003", color: "yellow" },
  ];

  res.json(lights);
});

app.get("/api/traffic/lights/:id", (req, res) => {
  trafficClient.GetLightStatus({ light_id: req.params.id }, (err, response) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: err.details,
      });
    }

    res.json({
      id: response.light_id,
      color: response.color,
    });
  });
});

app.post("/api/traffic/lights/:id/change", (req, res) => {
  trafficClient.ChangeLight(
    {
      light_id: req.params.id,
      color: req.body.color,
    },
    (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.details,
        });
      }

      res.json({
        success: response.success,
        message: response.message,
      });
    }
  );
});

// API Routes for Parking Service
app.get("/api/parking/lots", (req, res) => {
  // Example implementation - in a real scenario, this would fetch from database
  const lots = [
    {
      id: "lot-001",
      name: "Downtown Parking",
      totalSpaces: 100,
      availableSpaces: 45,
    },
    {
      id: "lot-002",
      name: "Mall Parking",
      totalSpaces: 200,
      availableSpaces: 120,
    },
  ];

  res.json(lots);
});

app.get("/api/parking/lots/:id", (req, res) => {
  parkingClient.GetAvailableSpaces(
    { lot_id: req.params.id },
    (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.details,
        });
      }

      res.json({
        id: response.lot_id,
        totalSpaces: response.total_spaces,
        availableSpaces: response.available_spaces,
      });
    }
  );
});

app.post("/api/parking/lots/:id/reserve", (req, res) => {
  parkingClient.ReserveSpace(
    {
      lot_id: req.params.id,
      vehicle_id: req.body.vehicleId,
    },
    (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.details,
        });
      }

      res.json({
        success: response.success,
        reservationId: response.reservation_id,
        message: response.message,
      });
    }
  );
});

// API Routes for Transport Service
app.get("/api/transport/vehicles", (req, res) => {
  // Example implementation - in a real scenario, this would fetch from database
  const vehicles = [
    { id: "bus-001", type: "Bus", nextStop: "Downtown Station" },
    { id: "bus-002", type: "Bus", nextStop: "University District" },
  ];

  res.json(vehicles);
});

app.get("/api/transport/vehicles/:id", (req, res) => {
  // Add validation
  if (!req.params.id) {
    return res.status(400).json({
      success: false,
      message: "Vehicle ID is required",
    });
  }

  transportClient.GetVehicleLocation(
    { vehicle_id: req.params.id },
    (err, response) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: err.details,
        });
      }

      res.json({
        id: response.vehicle_id,
        latitude: response.latitude,
        longitude: response.longitude,
        nextStop: response.next_stop,
        etaMinutes: response.eta_minutes,
      });
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Web Controller running on http://localhost:${port}`);
});
