/**
 * Parking Service
 *
 * Implements a gRPC service for managing parking spaces
 * Based on the examples from Code1-Basic program and Code2-Simple calculator program
 */

const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

// Load the parking service proto
const PROTO_PATH = "../protos/parking.proto";
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const parkingProto = grpc.loadPackageDefinition(packageDefinition).parking;

// Sample data for parking lots
// In a real system, this would come from a database
let parkingLots = {
  "lot-001": {
    id: "lot-001",
    name: "Downtown Parking",
    totalSpaces: 100,
    availableSpaces: 45,
  },
  "lot-002": {
    id: "lot-002",
    name: "Mall Parking",
    totalSpaces: 200,
    availableSpaces: 120,
  },
};

// Store for parking reservations
let reservations = [];

/**
 * Implement the ParkingService
 */
const parkingService = {
  /**
   * Get available spaces in a parking lot
   * @param {Object} call - Contains the request with lot_id
   * @param {Function} callback - Used to send response back to client
   */
  GetAvailableSpaces: (call, callback) => {
    console.log(`GetAvailableSpaces called for lot: ${call.request.lot_id}`);

    // Find the requested lot in our sample data
    const lot = parkingLots[call.request.lot_id];

    // If lot doesn't exist, return an error
    if (!lot) {
      console.log(`Lot ${call.request.lot_id} not found`);
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Parking lot not found",
      });
    }

    console.log(
      `Returning availability for lot ${lot.id}: ${lot.availableSpaces}/${lot.totalSpaces}`
    );

    // Return the availability information
    callback(null, {
      lot_id: lot.id,
      total_spaces: lot.totalSpaces,
      available_spaces: lot.availableSpaces,
    });
  },

  /**
   * Reserve a parking space
   * @param {Object} call - Contains the request with lot_id and vehicle_id
   * @param {Function} callback - Used to send response back to client
   */
  ReserveSpace: (call, callback) => {
    console.log(
      `ReserveSpace called for lot: ${call.request.lot_id}, vehicle: ${call.request.vehicle_id}`
    );

    // Find the lot in our sample data
    const lot = parkingLots[call.request.lot_id];

    // If lot doesn't exist, return an error
    if (!lot) {
      console.log(`Lot ${call.request.lot_id} not found`);
      return callback({
        code: grpc.status.NOT_FOUND,
        details: "Parking lot not found",
      });
    }

    // Check if there are available spaces
    if (lot.availableSpaces <= 0) {
      console.log(`No available spaces in lot ${lot.id}`);
      return callback(null, {
        success: false,
        reservation_id: "",
        message: "No available spaces in this lot",
      });
    }

    // Create a reservation
    const reservationId = `res-${Date.now()}`;
    reservations.push({
      id: reservationId,
      lotId: lot.id,
      vehicleId: call.request.vehicle_id,
      timestamp: new Date().toISOString(),
    });

    // Update available spaces
    lot.availableSpaces--;

    console.log(
      `Reserved space in lot ${lot.id} for vehicle ${call.request.vehicle_id}`
    );

    // Return reservation confirmation
    callback(null, {
      success: true,
      reservation_id: reservationId,
      message: "Space reserved successfully",
    });
  },
};

// Create and start the gRPC server
const server = new grpc.Server();
server.addService(parkingProto.ParkingService.service, parkingService);

// Bind to a port and start the server
const port = 50052;
server.bindAsync(
  `0.0.0.0:${port}`,
  grpc.ServerCredentials.createInsecure(),
  () => {
    server.start();
    console.log(`Parking Service running on port ${port}`);
  }
);
