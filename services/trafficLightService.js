/**
 * Traffic Light Service
 *
 * Implements a gRPC service for managing traffic lights
 * Based on the examples from Code1-Basic program and Code2-Simple calculator program
 */

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the traffic light service proto
const PROTO_PATH = "../protos/trafficLight.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const trafficProto = grpc.loadPackageDefinition(packageDefinition).trafficlight;

// Sample data for traffic lights
// In a real system, this would come from a database
let trafficLights = [
  { id: "light-001", color: "red" },
  { id: "light-002", color: "green" },
  { id: "light-003", color: "yellow" },
];

/**
 * Implement the TrafficLightService
 */
const trafficService = {
  /**
   * Get the current status of a traffic light
   * @param {Object} call - Contains the request with light_id
   * @param {Function} callback - Used to send response back to client
   */
  GetLightStatus: (call, callback) => {
    console.log(`GetLightStatus called for light: ${call.request.light_id}`);

    // Find the requested light in our sample data
    const light = trafficLights.find((l) => l.id === call.request.light_id);

    // If light doesn't exist, return an error
    if (!light) {
      console.log(`Light ${call.request.light_id} not found`);
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Traffic light not found",
      });
    }

    console.log(`Returning status for light ${light.id}: ${light.color}`);

    // Return the light status
    callback(null, {
      light_id: light.id,
      color: light.color,
    });
  },

  /**
   * Change the color of a traffic light
   * @param {Object} call - Contains the request with light_id and new color
   * @param {Function} callback - Used to send response back to client
   */
  ChangeLight: (call, callback) => {
    console.log(
      `ChangeLight called for light: ${call.request.light_id} to ${call.request.color}`
    );

    // Find the light in our sample data
    const lightIndex = trafficLights.findIndex(
      (l) => l.id === call.request.light_id
    );

    // If light doesn't exist, return an error
    if (lightIndex === -1) {
      console.log(`Light ${call.request.light_id} not found`);
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Traffic light not found",
      });
    }

    // Validate the requested color
    const validColors = ["red", "yellow", "green"];
    if (!validColors.includes(call.request.color)) {
      console.log(`Invalid color: ${call.request.color}`);
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: "Invalid color. Must be red, yellow, or green.",
      });
    }

    // Update the light color
    trafficLights[lightIndex].color = call.request.color;
    console.log(
      `Updated light ${call.request.light_id} to ${call.request.color}`
    );

    // Return success response
    callback(null, {
      success: true,
      message: `Light changed to ${call.request.color}`,
    });
  },
};

// Create and start the gRPC server
const server = new grpc.Server();
server.addService(trafficProto.TrafficLightService.service, trafficService);

// Bind to a port and start the server
const port = 50051;
server.bindAsync(
  `0.0.0.0:${port}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    server.start();
    console.log(`Traffic Light Service running on port ${port}`);
  }
);
