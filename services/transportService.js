/**
 * Transport Service
 *
 * Implements a gRPC service for tracking public transportation vehicles
 * Based on the examples from Code1-Basic program and Code2-Simple calculator program
 */

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the transport service proto
const PROTO_PATH = "../protos/transport.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const transportProto = grpc.loadPackageDefinition(packageDefinition).transport;

// Sample data for vehicles
// In a real system, this would come from a database
let vehicles = {
  "bus-001": {
    id: "bus-001",
    type: "bus",
    latitude: 47.6062,
    longitude: -122.3321,
    nextStop: "Downtown Station",
    etaMinutes: 5,
  },
  "bus-002": {
    id: "bus-002",
    type: "bus",
    latitude: 47.6152,
    longitude: -122.3447,
    nextStop: "University District",
    etaMinutes: 8,
  },
};

/**
 * Implement the TransportService
 */
const transportService = {
  /**
   * Get the current location of a vehicle
   * @param {Object} call - Contains the request with vehicle_id
   * @param {Function} callback - Used to send response back to client
   */
  GetVehicleLocation: (call, callback) => {
    console.log("Full request:", JSON.stringify(call.request));
    // Add validation at the beginning of the function
    if (!call.request.vehicle_id) {
      console.log("Request received with missing vehicle ID");
      return callback({
        code: grpc.status.INVALID_ARGUMENT,
        details: "Vehicle ID is required",
      });
    }

    console.log(
      `GetVehicleLocation called for vehicle: ${call.request.vehicle_id}`
    );

    // Find the requested vehicle in our sample data
    const vehicle = vehicles[call.request.vehicle_id];

    // If vehicle doesn't exist, return an error
    if (!vehicle) {
      console.log(`Vehicle ${call.request.vehicle_id} not found`);
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Vehicle not found",
      });
    }

    console.log(
      `Returning location for vehicle ${vehicle.id}: (${vehicle.latitude}, ${vehicle.longitude})`
    );

    // Return the vehicle location
    callback(null, {
      vehicle_id: vehicle.id,
      latitude: vehicle.latitude,
      longitude: vehicle.longitude,
      next_stop: vehicle.nextStop,
      eta_minutes: vehicle.etaMinutes,
    });
  },

  /**
   * Update the location of a vehicle
   * @param {Object} call - Contains the request with vehicle info
   * @param {Function} callback - Used to send response back to client
   */
  UpdateVehicleLocation: (call, callback) => {
    console.log(
      `UpdateVehicleLocation called for vehicle: ${call.request.vehicle_id}`
    );

    // Find the vehicle in our sample data
    if (!vehicles[call.request.vehicle_id]) {
      console.log(
        `Vehicle ${call.request.vehicle_id} not found, creating new entry`
      );
      vehicles[call.request.vehicle_id] = {
        id: call.request.vehicle_id,
        type: "unknown",
      };
    }

    // Update the vehicle location
    vehicles[call.request.vehicle_id].latitude = call.request.latitude;
    vehicles[call.request.vehicle_id].longitude = call.request.longitude;
    vehicles[call.request.vehicle_id].nextStop = call.request.next_stop;
    vehicles[call.request.vehicle_id].etaMinutes = call.request.eta_minutes;

    console.log(
      `Updated location for vehicle ${call.request.vehicle_id}: (${call.request.latitude}, ${call.request.longitude})`
    );

    // Return success response
    callback(null, {
      success: true,
      message: "Vehicle location updated successfully",
    });
  },
};

// Create and start the gRPC server
const server = new grpc.Server();
server.addService(transportProto.TransportService.service, transportService);

// Bind to a port and start the server
const port = 50053;
server.bindAsync(
  `0.0.0.0:${port}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    server.start();
    console.log(`Transport Service running on port ${port}`);
  }
);
