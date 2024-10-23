/**
 * BACnet Server Example in TypeScript
 * This example demonstrates how to create a BACnet server using the CAS BACnet Stack in TypeScript.
 * 
 * 
 */
const CASBACnetStack = require("@chipkin/cas-bacnet-stack")

// Other packages used in this example
const dequeue = require('dequeue'); // Creates a FIFO buffer. https://github.com/lleo/node-dequeue/
const dgram = require('dgram'); // UDP Socket

// Settings
const SETTING_BACNET_PORT: number = 47808; // Default BACnet IP UDP Port.
const SETTING_DEVICE_INSTANCE: number = 389055; // The BACnet Device Instance number.

// Consts 
const APPLICATION_VERSION: string = "1.0.0";

// Enums
// Only the enum that are used in this example are defined.
const BACNET_OBJECT_TYPE_ANALOG_INPUT: Number = 0;
const BACNET_OBJECT_TYPE_ANALOG_OUTPUT: Number = 1;
const BACNET_OBJECT_TYPE_ANALOG_VALUE: Number = 2;
const BACNET_OBJECT_TYPE_BINARY_INPUT: Number = 3;
const BACNET_OBJECT_TYPE_BINARY_OUTPUT: Number = 4;
const BACNET_OBJECT_TYPE_BINARY_VALUE: Number = 5;
const BACNET_OBJECT_TYPE_DEVICE: Number = 8;
const BACNET_OBJECT_TYPE_MULTI_STATE_INPUT: Number = 13;
const BACNET_OBJECT_TYPE_MULTI_STATE_OUTPUT: Number = 14;
const BACNET_OBJECT_TYPE_MULTI_STATE_VALUE: Number = 19;

const SERVICES_SUPPORTED_SUBSCRIBE_COV: number = 5;
const SERVICES_SUPPORTED_READ_PROPERTY_MULTIPLE: number = 14;
const SERVICES_SUPPORTED_WRITE_PROPERTY: number = 15;
const SERVICES_SUPPORTED_WRITE_PROPERTY_MULTIPLE: number = 16;

const BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME: number = 77;
const BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE: number = 85;

// Callback functions
// --------------------------------------------------------------------------------------------
// These must be globals defined outside of Startup to prevent garbage collection.
var FuncPtrCallbackSendMessage = CallbackSendMessage;
var FuncPtrCallbackRecvMessage = CallbackRecvMessage;
var FuncPtrCallbackGetSystemTime = CallbackGetSystemTime;
var FuncPtrCallbackLogDebugMessage = CallbackLogDebugMessage;

const FuncPtrCallbackGetPropertyCharacterString = GetPropertyCharacterString;
const FuncPtrCallbackGetPropertyReal = GetPropertyReal;

// Globals
let fifoRecvBuffer = new dequeue();
const udp: any = dgram.createSocket('udp4');
let networkPort = {
  ip: '',
  subnet: '',
  broadcastAddress: ''
};

// Database Values
// This is hard coded for this example. In a real application, this would be stored in a database.
let analog_input_object_name: string = "AnalogInput Bronze";
let analog_input_present_value: number = 127.5;


function StartUp() {
  // Print the version information
  console.log("BACnet Server Example in TypeScript Version: " + APPLICATION_VERSION);
  console.log("https://github.com/chipkin/BACnetServerExampleTypeScript");
  console.log("CAS BACnet Stack Version: "
    + CASBACnetStack.GetAPIMajorVersion() + "."
    + CASBACnetStack.GetAPIMinorVersion() + "."
    + CASBACnetStack.GetAPIPatchVersion() + "."
    + CASBACnetStack.GetAPIBuildVersion() + "-"
    + CASBACnetStack.GetAPIAdapterVersion()
  );

  // Setup the callback functions
  // ------------------------------------------------------------------------
  console.log('FYI: Setting up callback functions...');
  // Required Callbacks
  CASBACnetStack.RegisterCallbackSendMessage(FuncPtrCallbackSendMessage);
  CASBACnetStack.RegisterCallbackReceiveMessage(FuncPtrCallbackRecvMessage);
  CASBACnetStack.RegisterCallbackGetSystemTime(FuncPtrCallbackGetSystemTime);
  CASBACnetStack.RegisterCallbackLogDebugMessage(FuncPtrCallbackLogDebugMessage);

  // Callback Get Property 
  CASBACnetStack.RegisterCallbackGetPropertyCharacterString(FuncPtrCallbackGetPropertyCharacterString);
  CASBACnetStack.RegisterCallbackGetPropertyReal(FuncPtrCallbackGetPropertyReal);


  // Setup the BACnet device.
  // ------------------------------------------------------------------------
  console.log('FYI: Setting up bacnet device...');
  CASBACnetStack.AddDevice(SETTING_DEVICE_INSTANCE);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_INPUT, 0);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_OUTPUT, 1);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_VALUE, 2);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_BINARY_INPUT, 3);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_BINARY_OUTPUT, 4);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_BINARY_VALUE, 5);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_MULTI_STATE_INPUT, 13);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_MULTI_STATE_OUTPUT, 14);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_MULTI_STATE_VALUE, 19);

  // Setup the BACnet Services
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_READ_PROPERTY_MULTIPLE, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_WRITE_PROPERTY, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_WRITE_PROPERTY_MULTIPLE, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_SUBSCRIBE_COV, true);

  // Setup the UDP Socket
  // ------------------------------------------------------------------------
  udp.on('error', (err: any) => {
    console.error(`UDP.Server error:\n ${err.stack}`);
    udp.close();
    process.exit(1); // Close the application 
  });

  udp.on('message', (msg: any, rinfo: any) => {
    fifoRecvBuffer.push([msg, rinfo.address + ':' + rinfo.port]);
  });

  udp.on('listening', () => {
    const address: any = udp.address();
    console.log(`FYI: UDP.Server listening ${address.address}:${address.port}`);
  });
  udp.on('exit', () => {
    console.log(`FYI: UDP.Server Exit`);
  });

  // Get the local IP address of the computer
  // ------------------------------------------------------------------------

  // Find the first non-internal IP address, that is not the loopback address.  
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    if (networkPort.ip.length > 0) {
      break;
    }
    const interfaceArray = networkInterfaces[interfaceName];
    for (const interfaceIndex in interfaceArray) {
      const interfaceObject = interfaceArray[interfaceIndex];
      // console.log('FYI: Found interface: Name: ' + interfaceName + ', Object: ' + JSON.stringify(interfaceObject));
      if (interfaceObject.internal || interfaceObject.family != "IPv4") {
        continue;
      }

      networkPort.ip = interfaceObject.address;
      networkPort.subnet = interfaceObject.netmask;

      // Calculate the broadcast address from the subnet
      const ipParts = networkPort.ip.split('.');
      const subnetParts = networkPort.subnet.split('.');
      networkPort.broadcastAddress = '';
      for (let i = 0; i < 4; i++) {
        networkPort.broadcastAddress += (parseInt(ipParts[i]) | (~parseInt(subnetParts[i]) & 0xFF)) + '.';
      }
      networkPort.broadcastAddress = networkPort.broadcastAddress.slice(0, -1);

      break;
    }
  }

  // Start the UDP server
  console.log('FYI: Connecting UDP to port: ' + SETTING_BACNET_PORT + ', networkPort.ip: ' + networkPort.ip + ', networkPort.broadcastAddress: ' + networkPort.broadcastAddress);
  udp.bind({
    address: networkPort.ip,
    port: SETTING_BACNET_PORT
  });

  // Main program loop
  // ------------------------------------------------------------------------
  console.log('FYI: Starting main program loop... ');
  setInterval(() => {
    // The Tick function is called to process the BACnet messages.
    // It needs to be run at lest once a second, preferably more often.
    CASBACnetStack.Tick();
  }, 100); // 100ms

  // Keep values updating
  // ------------------------------------------------------------------------
  setInterval(() => {
    // Update the values of the analog inputs to simulate real world values.
    analog_input_present_value += 1.1;

    // Tell the CAS BACnet Stack that the value has been update so that it can send COV messages
    CASBACnetStack.ValueUpdated(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_INPUT, 0, BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE);
  }, 1000); // 1 second

}

function CallbackSendMessage(message: Buffer, messageLength: number, connectionStringBuffer: Buffer, connectionStringLength: number, networkType: number, broadcast: boolean): number {
  if (messageLength <= 0) {
    return 0;
  }

  // Extract the connection string
  let host: string = connectionStringBuffer.readUInt8(0) + "." + connectionStringBuffer.readUInt8(1) + "." + connectionStringBuffer.readUInt8(2) + "." + connectionStringBuffer.readUInt8(3);
  let port: number = connectionStringBuffer.readUInt8(4) + (connectionStringBuffer.readUInt8(5) * 256);

  // Check to see if this message needs to be sent to the broadcast address
  if (broadcast) {
    // Update the host with the broadcast address
    host = networkPort.broadcastAddress;
  }

  console.log('Sending message to: ' + host + ':' + port + ', messageLength: ' + messageLength);
  udp.send(message, 0, messageLength, port, host, (err: any) => {
    if (err) {
      console.error(`UDP.Client error:\n ${err.stack}`);
    }
  });
  return messageLength;
}

function CallbackRecvMessage(message: Buffer, maxMessageLength: number, sourceConnectionString: Buffer, sourceConnectionStringLength: Buffer, destinationConnectionString: Buffer, destinationConnectionStringLength: Buffer, maxConnectionStringLength: number, networkType: Buffer): number {

  if (fifoRecvBuffer.length <= 0) {
    return 0;
  }

  let item = fifoRecvBuffer.shift();
  let msg = item[0];
  let address = item[1];

  // Check to make sure that the message fits into the buffer
  if (msg.length > maxMessageLength) {
    console.error("Error: The message is too large for the buffer. Message Length: " + msg.length + " maxMessageLength: " + maxMessageLength);
    return 0;
  }

  // Copy the message into the buffer
  for (var offset = 0; offset < msg.length; offset++) {
    message.writeUInt8(msg[offset], offset);
  }

  // Update the network type, BACnet IP
  const BACNET_IP_NETWORK_TYPE: number = 0;
  networkType.writeUInt8(BACNET_IP_NETWORK_TYPE, 0);

  // Update the connection string
  const addressParts = address.split(':');
  const addressPartsIp = addressParts[0].split('.');
  for (var offset = 0; offset < addressPartsIp.length; offset++) {
    sourceConnectionString.writeUInt8(Number(addressPartsIp[offset]), offset);
  }
  const port = Number(addressParts[1]);
  sourceConnectionString.writeUInt8(port % 256, 4);
  sourceConnectionString.writeUInt8(Math.floor(port / 256), 5);


  // Update the connection string length
  const CONNECTION_STRING_IP_LENGTH = 6; // 4 bytes for the IP address and 2 bytes for the port
  sourceConnectionStringLength.writeUInt8(CONNECTION_STRING_IP_LENGTH, 0);

  // Return the message length
  return msg.length;
}

// This callback is used to determin the current system time.
function CallbackGetSystemTime(): number {
  // https://stackoverflow.com/a/9456144/58456
  var d = new Date();
  return d.getTime() / 1000;
}

function CallbackLogDebugMessage(messageBuffer: Buffer, _messageBufferLength: number, messageType: number): void {
  // Convert the message from the CAS BACnet Stack buffer to a string that can be read by the NodeJS application.
  // console.log(messageBuffer.toString("utf8").replace("\n", ""));
}


export function GetPropertyCharacterString(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, valueElementCount: Buffer, maxElementCount: number, encodingType: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyCharacterString deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier);

  // Example 1 - Device Object Name
  if (deviceInstance == SETTING_DEVICE_INSTANCE && objectType == BACNET_OBJECT_TYPE_DEVICE) {
    if (propertyIdentifier == BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME) {
      const deviceName = "CAS BACnet Stack TypeScript Example";

      if (deviceName.length > maxElementCount) {
        return false; // The buffer is too small to hold the value.
      }

      value.write(deviceName, 0, deviceName.length);
      valueElementCount.writeUInt32LE(deviceName.length, 0);
      encodingType.writeUInt8(0, 0); // 0 = ANSI_X3.4-1986
      return true;
    }
  }

  // Example 2 - Analog Input Object Name
  if (deviceInstance == SETTING_DEVICE_INSTANCE && objectType == BACNET_OBJECT_TYPE_ANALOG_INPUT) {
    if (propertyIdentifier == BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME) {
      if (analog_input_object_name.length > maxElementCount) {
        return false; // The buffer is too small to hold the value.
      }

      value.write(analog_input_object_name, 0, analog_input_object_name.length);
      valueElementCount.writeUInt32LE(analog_input_object_name.length, 0);
      encodingType.writeUInt8(0, 0); // 0 = ANSI_X3.4-1986
      return true;
    }
  }



  return false;
}
export function GetPropertyReal(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyReal deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier);

  if (deviceInstance == SETTING_DEVICE_INSTANCE && objectType == BACNET_OBJECT_TYPE_ANALOG_INPUT) {
    if (propertyIdentifier == BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE) {
      value.writeFloatLE(analog_input_present_value, 0);
      return true;
    }
  }

  return false;
}



// 
// Main
StartUp()