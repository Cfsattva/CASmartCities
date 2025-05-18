const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the traffic light service proto
const PROTO_PATH = "./trafficlight.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const trafficProto = grpc.loadPackageDefinition(packageDefinition).trafficlight;

// Sample data for traffic lights
let trafficLights = [
  { id: "light-001", color: "red", secondsRemaining: 30 },
  { id: "light-002", color: "green", secondsRemaining: 45 },
  { id: "light-003", color: "yellow", secondsRemaining: 5 },
];

// Sample data for intersections
let intersections = {
  "int-001": { vehicleCount: 15, congestionLevel: 0.3 },
  "int-002": { vehicleCount: 25, congestionLevel: 0.7 },
};

// Implement the service
const trafficService = {
  GetLightStatus: (call, callback) => {
    console.log(`GetLightStatus called for light: ${call.request.light_id}`);

    const light = trafficLights.find((l) => l.id === call.request.light_id);

    if (!light) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Traffic light not found",
      });
    }

    callback(null, {
      light_id: light.id,
      current_color: light.color,
      seconds_remaining: light.secondsRemaining,
    });
  },

  ChangeLightTiming: (call, callback) => {
    console.log(`ChangeLightTiming called for light: ${call.request.light_id}`);
    const req = call.request;

    const light = trafficLights.find((l) => l.id === req.light_id);

    if (!light) {
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Traffic light not found",
      });
    }

    // In a real system, this would update the timing parameters
    // For this demo, we just acknowledge the request

    callback(null, {
      success: true,
      message: `Timing updated for light ${req.light_id}`,
    });
  },

  MonitorTrafficFlow: (call) => {
    const intersectionId = call.request.intersection_id;
    console.log(
      `MonitorTrafficFlow started for intersection: ${intersectionId}`
    );

    if (!intersections[intersectionId]) {
      call.emit("error", {
        code: grpc.status.NOT_FOUND,
        details: "Intersection not found",
      });
      return;
    }

    // Send updates every 5 seconds (simulated data)
    const interval = setInterval(() => {
      // Update with some random variation
      const vehicleCount = Math.floor(Math.random() * 30);
      const congestionLevel = Math.min(1.0, Math.max(0.0, Math.random()));

      intersections[intersectionId] = {
        vehicleCount: vehicleCount,
        congestionLevel: congestionLevel,
      };

      const update = {
        intersection_id: intersectionId,
        vehicle_count: vehicleCount,
        congestion_level: congestionLevel,
        timestamp: new Date().toISOString(),
      };

      console.log(`Sending traffic update for intersection ${intersectionId}`);
      call.write(update);
    }, 5000);

    // Handle client disconnect
    call.on("cancelled", () => {
      clearInterval(interval);
      console.log(
        `MonitorTrafficFlow stopped for intersection ${intersectionId}`
      );
    });
  },
};

// Start the server
const server = new grpc.Server();
server.addService(trafficProto.TrafficLightService.service, trafficService);
server.bindAsync(
  "0.0.0.0:50051",
  grpc.ServerCredentials.createInsecure(),
  () => {
    server.start();
    console.log("Traffic Light Service running on port 50051");
  }
);
