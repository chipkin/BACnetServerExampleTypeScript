/**
 * BACnet Server Example in TypeScript
 * This example demonstrates how to create a BACnet server using the CAS BACnet Stack in TypeScript.
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
const BACNET_IP_NETWORK_TYPE: number = 0;

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
const BACNET_OBJECT_TYPE_NETWORK_PORT: Number = 56;

const SERVICES_SUPPORTED_SUBSCRIBE_COV: number = 5;
const SERVICES_SUPPORTED_READ_PROPERTY_MULTIPLE: number = 14;
const SERVICES_SUPPORTED_WRITE_PROPERTY: number = 15;
const SERVICES_SUPPORTED_WRITE_PROPERTY_MULTIPLE: number = 16;
const SERVICES_SUPPORTED_DEVICE_COMMUNICATION_CONTROL: number = 17;
const SERVICES_SUPPORTED_SUBSCRIBE_COV_PROPERTY: number = 38;
const SERVICES_SUPPORTED_SUBSCRIBE_COV_PROPERTY_MULTIPLE: number = 41;

const BACNET_PROPERTY_IDENTIFIER_EVENT_STATE: number = 36;
const BACNET_PROPERTY_IDENTIFIER_NUMBER_OF_STATES: number = 74;
const BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME: number = 77;
const BACNET_PROPERTY_IDENTIFIER_OUT_OF_SERVICE: number = 81;
const BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE: number = 85;
// reliability (103),
const BACNET_PROPERTY_IDENTIFIER_STATE_TEXT: number = 110;
const BACNET_PROPERTY_IDENTIFIER_UNITS: number = 117;
const BACNET_PROPERTY_IDENTIFIER_IP_ADDRESS: Number = 400;
const BACNET_PROPERTY_IDENTIFIER_IP_DEFAULT_GATEWAY: Number = 401;
const BACNET_PROPERTY_IDENTIFIER_IP_DNS_SERVER: Number = 406;
// bacnet-ip-mode (408),
const BACNET_PROPERTY_IDENTIFIER_IP_SUBNET_MASK: Number = 411;
const BACNET_PROPERTY_IDENTIFIER_BACNET_IP_UDP_PORT: Number = 412;
// changes-pending (416),
const BACNET_PROPERTY_IDENTIFIER_CHANGES_PENDING: Number = 416;
const BACNET_PROPERTY_IDENTIFIER_FD_BBMD_ADDRESS: Number = 418;
const BACNET_PROPERTY_IDENTIFIER_FD_SUBSCRIPTION_LIFETIME: Number = 419;
const BACNET_PROPERTY_IDENTIFIER_LINK_SPEED: number = 420;
// 
// network-number (425),
// network-number-quality (426),
// network-type (427),
// protocol-level (482),
// reference-port (483),

// Callback functions
// --------------------------------------------------------------------------------------------
// These must be globals defined outside of Startup to prevent garbage collection.
const FuncPtrCallbackSendMessage = CallbackSendMessage;
const FuncPtrCallbackRecvMessage = CallbackRecvMessage;
const FuncPtrCallbackGetSystemTime = CallbackGetSystemTime;
const FuncPtrCallbackLogDebugMessage = CallbackLogDebugMessage;

const FuncPtrGetPropertyBitString = GetPropertyBitString;
const FuncPtrGetPropertyBool = GetPropertyBool;
const FuncPtrGetPropertyDate = GetPropertyDate;
const FuncPtrGetPropertyDouble = GetPropertyDouble;
const FuncPtrGetPropertyEnumerated = GetPropertyEnumerated;
const FuncPtrGetPropertyOctetString = GetPropertyOctetString;
const FuncPtrGetPropertyReal = GetPropertyReal;
const FuncPtrGetPropertySignedInteger = GetPropertySignedInteger;
const FuncPtrGetPropertyUnsignedInteger = GetPropertyUnsignedInteger;
const FuncPtrGetPropertyCharacterString = GetPropertyCharacterString;
const FuncPtrGetPropertyTime = GetPropertyTime;

const FuncPtrCallbackSetPropertyReal = SetPropertyReal;
const FuncPtrCallbackSetPropertyUnsignedInteger = SetPropertyUnsignedInteger;
const FuncPtrCallbackSetPropertyEnumerated = SetPropertyEnumerated;

// Globals
let fifoRecvBuffer = new dequeue();
const udp: any = dgram.createSocket('udp4');
let networkPort = {
  ip: '',
  subnet: '255.255.255.0',
  broadcastAddress: '',
  mac: '',
  gateway: '0.0.0.0',
  fd_bbmd_address: ['0.0.0.0', SETTING_BACNET_PORT],
  dnsServers: ['0.0.0.0'],
};

// Database Values
// These values are globals to make the example simple to understand. 
// Normally these values would come from a database or other source.
let device_object_name: string = "CAS BACnet Stack TypeScript Example";
let analog_input_present_value: number = 127.5;
let multi_state_input_statetext = ["Off", "On", "Blinking"];
let multi_state_value_statetext = ["Hot", "Cold", "Luke Warm"];


// This is a simple key/value database used as an example for the Example.
// This database format is not suitable for production. 
let db = new Map<string, any>();


function StartUp() {
  // Print the version information
  console.log("FYI: BACnet Server Example in TypeScript Version: " + APPLICATION_VERSION);
  console.log("FYI: https://github.com/chipkin/BACnetServerExampleTypeScript");
  console.log("FYI: CAS BACnet Stack Version: "
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
  CASBACnetStack.RegisterCallbackGetPropertyBitString(FuncPtrGetPropertyBitString);
  CASBACnetStack.RegisterCallbackGetPropertyBool(FuncPtrGetPropertyBool);
  CASBACnetStack.RegisterCallbackGetPropertyDate(FuncPtrGetPropertyDate);
  CASBACnetStack.RegisterCallbackGetPropertyDouble(FuncPtrGetPropertyDouble);
  CASBACnetStack.RegisterCallbackGetPropertyEnumerated(FuncPtrGetPropertyEnumerated);
  CASBACnetStack.RegisterCallbackGetPropertyOctetString(FuncPtrGetPropertyOctetString);
  CASBACnetStack.RegisterCallbackGetPropertyReal(FuncPtrGetPropertyReal);
  CASBACnetStack.RegisterCallbackGetPropertySignedInteger(FuncPtrGetPropertySignedInteger);
  CASBACnetStack.RegisterCallbackGetPropertyUnsignedInteger(FuncPtrGetPropertyUnsignedInteger);
  CASBACnetStack.RegisterCallbackGetPropertyCharacterString(FuncPtrGetPropertyCharacterString);
  CASBACnetStack.RegisterCallbackGetPropertyTime(FuncPtrGetPropertyTime);

  // Callbacks Set Property
  CASBACnetStack.RegisterCallbackSetPropertyReal(FuncPtrCallbackSetPropertyReal);
  CASBACnetStack.RegisterCallbackSetPropertyUnsignedInteger(FuncPtrCallbackSetPropertyUnsignedInteger);
  CASBACnetStack.RegisterCallbackSetPropertyEnumerated(FuncPtrCallbackSetPropertyEnumerated);

  // Setup the BACnet device.
  // ------------------------------------------------------------------------
  console.log('FYI: Setting up bacnet device...');
  CASBACnetStack.AddDevice(SETTING_DEVICE_INSTANCE);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_INPUT, 0);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_OUTPUT, 1);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_VALUE, 2);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_BINARY_INPUT, 3);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_BINARY_OUTPUT, 4);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_BINARY_VALUE, 5);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_MULTI_STATE_INPUT, 13);
  // CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_MULTI_STATE_OUTPUT, 14);
  CASBACnetStack.AddObject(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_MULTI_STATE_VALUE, 19);

  // Add a network port object
  const NETWORK_TYPE_IPV4: number = 5;
  const PROTOCOL_LEVEL_BACNET_APPLICATION: number = 2;
  const NETWORK_PORT_LOWEST_PROTOCOL_LAYER: number = 4194303;
  CASBACnetStack.AddNetworkPortObject(SETTING_DEVICE_INSTANCE, 56, NETWORK_TYPE_IPV4, PROTOCOL_LEVEL_BACNET_APPLICATION, NETWORK_PORT_LOWEST_PROTOCOL_LAYER);

  // Set some properties to be writable
  CASBACnetStack.SetPropertyWritable(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_VALUE, 2, BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, true);
  CASBACnetStack.SetPropertyWritable(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_BINARY_VALUE, 5, BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, true);
  CASBACnetStack.SetPropertyWritable(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_MULTI_STATE_VALUE, 19, BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, true);

  // Setup the BACnet Services
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_READ_PROPERTY_MULTIPLE, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_WRITE_PROPERTY, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_WRITE_PROPERTY_MULTIPLE, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_SUBSCRIBE_COV, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_DEVICE_COMMUNICATION_CONTROL, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_SUBSCRIBE_COV_PROPERTY, true);
  CASBACnetStack.SetServiceEnabled(SETTING_DEVICE_INSTANCE, SERVICES_SUPPORTED_SUBSCRIBE_COV_PROPERTY_MULTIPLE, true);


  // Setup the UDP Socket
  // ------------------------------------------------------------------------
  udp.on('error', (err: any) => {
    console.error(`UDP.Server error:\n ${err.stack}`);
    udp.close();
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
    process.exit(1); // Close the application 
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
      console.log('FYI: Found interface: Name: ' + interfaceName + ', Object: ' + JSON.stringify(interfaceObject));
      if (interfaceObject.internal || interfaceObject.family != "IPv4") {
        continue;
      }

      networkPort.ip = interfaceObject.address;
      networkPort.subnet = interfaceObject.netmask;
      networkPort.mac = interfaceObject.mac;

      // Calculate the broadcast address from the subnet
      const ipParts = networkPort.ip.split('.');
      const subnetParts = networkPort.subnet.split('.');
      networkPort.broadcastAddress = '';
      for (let i = 0; i < 4; i++) {
        networkPort.broadcastAddress += (parseInt(ipParts[i]) | (~parseInt(subnetParts[i]) & 0xFF)) + '.';
      }
      networkPort.broadcastAddress = networkPort.broadcastAddress.slice(0, -1);

      // The interfaceObject does not have the gateway or dns servers.
      // ToDo: Add a package to get the gateway and dns servers.
      break;
    }
  }

  // Start the UDP server
  console.log('FYI: Connecting UDP to port: ' + SETTING_BACNET_PORT + ', networkPort.ip: ' + networkPort.ip + ', networkPort.broadcastAddress: ' + networkPort.broadcastAddress);
  udp.bind({
    address: networkPort.ip,
    port: SETTING_BACNET_PORT
  });


  // Setup the BACnet Database
  // ------------------------------------------------------------------------
  console.log('FYI: Setting up bacnet database with values...');
  // This is a very simple database used for the example.
  // This database format is not suitable for production. 
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_DEVICE + '.' + SETTING_DEVICE_INSTANCE + '.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, device_object_name);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_ANALOG_INPUT + '.0.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "AnalogInput Bronze");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_ANALOG_INPUT + '.0.' + BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, analog_input_present_value);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_ANALOG_INPUT + '.0.' + BACNET_PROPERTY_IDENTIFIER_UNITS, 31);// 31 = meters
  // db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_ANALOG_OUTPUT + '.1.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "AnalogOutput Chartreuse");  
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_ANALOG_VALUE + '.2.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "AnalogValue Diamond");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_ANALOG_VALUE + '.2.' + BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, 1245.3);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_BINARY_INPUT + '.3.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "BinaryInput Emerald");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_BINARY_INPUT + '.3.' + BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, 1);
  // db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_BINARY_OUTPUT + '.4.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "BinaryOutput Fuchsia");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_BINARY_VALUE + '.5.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "BinaryValue Gold");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_BINARY_VALUE + '.5.' + BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, 0);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_INPUT + '.13.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "MultiStateInput Hot Pink");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_INPUT + '.13.' + BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, 2);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_INPUT + '.13.' + BACNET_PROPERTY_IDENTIFIER_STATE_TEXT, multi_state_input_statetext);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_INPUT + '.13.' + BACNET_PROPERTY_IDENTIFIER_NUMBER_OF_STATES, multi_state_input_statetext.length);
  // db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_OUTPUT + '.14.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "MultiStateOutput Indigo");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_VALUE + '.19.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "MultiStateValue Kiwi");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_VALUE + '.19.' + BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, 3);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_VALUE + '.19.' + BACNET_PROPERTY_IDENTIFIER_STATE_TEXT, multi_state_value_statetext);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_MULTI_STATE_VALUE + '.19.' + BACNET_PROPERTY_IDENTIFIER_NUMBER_OF_STATES, multi_state_value_statetext.length);

  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME, "NetworkPort Vermilion");
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_BACNET_IP_UDP_PORT, SETTING_BACNET_PORT);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_IP_ADDRESS, networkPort.ip);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_IP_SUBNET_MASK, networkPort.subnet);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_IP_DEFAULT_GATEWAY, networkPort.gateway);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_IP_DNS_SERVER, networkPort.dnsServers);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_CHANGES_PENDING, false);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_FD_BBMD_ADDRESS, ["0.0.0.0", 47808]);
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_LINK_SPEED, 1000 * 1000 * 10); // 10Mbs
  db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_NETWORK_PORT + '.56.' + BACNET_PROPERTY_IDENTIFIER_FD_SUBSCRIPTION_LIFETIME, 0); // Not enabled.

  // Be a good BACnet citizen and send out a I-Am message on startup
  // ------------------------------------------------------------------------
  setTimeout(() => {
    // Send the I-Am message 3 seconds after startup to allow for the UDP server to start.
    console.log('FYI: Sending out I-Am message...');
    const connectionString = Buffer.alloc(6); // The connection string is the IP address and port number, but in this case it is overwritten with the broadcast address.
    const destinationAddress = Buffer.alloc(0);
    CASBACnetStack.SendIAm(SETTING_DEVICE_INSTANCE, connectionString, connectionString.length, BACNET_IP_NETWORK_TYPE, true, 0, destinationAddress, destinationAddress.length);
  }, 3 * 1000); // 3 second

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
    db.set('' + SETTING_DEVICE_INSTANCE + '.' + BACNET_OBJECT_TYPE_ANALOG_INPUT + '.0.' + BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE, analog_input_present_value);

    // Tell the CAS BACnet Stack that the value has been update so that it can send COV messages
    CASBACnetStack.ValueUpdated(SETTING_DEVICE_INSTANCE, BACNET_OBJECT_TYPE_ANALOG_INPUT, 0, BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE);
  }, 30 * 1000); // 30 second

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
    port = SETTING_BACNET_PORT;
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
  console.log('Received message from: ' + address + ', messageLength: ' + msg.length);
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

// Get Property Callbacks
// ------------------------------------------------------------------------
export function GetPropertyCharacterString(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, valueElementCount: Buffer, maxElementCount: number, encodingType: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyCharacterString deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example 1 - Device Object Name
  if (deviceInstance == SETTING_DEVICE_INSTANCE && objectType == BACNET_OBJECT_TYPE_DEVICE) {
    if (propertyIdentifier == BACNET_PROPERTY_IDENTIFIER_OBJECT_NAME) {
      // Check the length
      if (device_object_name.length > maxElementCount) {
        return false; // The buffer is too small to hold the value.
      }

      value.write(device_object_name, 0, device_object_name.length);
      valueElementCount.writeUInt32LE(device_object_name.length, 0);
      encodingType.writeUInt8(0, 0); // 0 = ANSI_X3.4-1986
      return true;
    }
  }

  // Example 2 - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  // Check the datatype
  if (typeof dbValue !== 'string') {
    console.error('The value is not a string. Type: ' + typeof dbValue);
    return false;
  }
  // Check the length
  if (dbValue.length > maxElementCount) {
    console.error('The value is too large for the buffer. Length: ' + dbValue.length + ', maxElementCount: ' + maxElementCount);
    return false;
  }

  value.write(dbValue, 0, dbValue.length);
  valueElementCount.writeUInt32LE(dbValue.length, 0);
  encodingType.writeUInt8(0, 0); // 0 = ANSI_X3.4-1986
  return true;
}
export function GetPropertyReal(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyReal deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example 1 - Analog Input Present Value 
  // ------------------------------------------------------------------------
  if (deviceInstance == SETTING_DEVICE_INSTANCE && objectType == BACNET_OBJECT_TYPE_ANALOG_INPUT) {
    if (propertyIdentifier == BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE) {
      value.writeFloatLE(analog_input_present_value, 0);
      return true;
    }
  }

  // Example 2 - Get from simple database
  // ------------------------------------------------------------------------
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  // Check the datatype
  if (typeof dbValue !== 'number') {
    console.error('The value is not a number. Type: ' + typeof dbValue);
    return false; // The value is not a number
  }

  value.writeFloatLE(dbValue, 0);
  return true;
}

function GetPropertyBool(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyBool deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  if (propertyIdentifier == BACNET_PROPERTY_IDENTIFIER_OUT_OF_SERVICE) {
    return false; // Always return false for this property, BACnet Stack will handle the value.
  }

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  // Check the datatype
  if (typeof dbValue !== 'boolean') {
    console.error('The value is not a boolean. Type: ' + typeof dbValue);
    return false;
  }

  value.writeUInt8(dbValue ? 1 : 0, 0);
  return true;
}

function GetPropertyEnumerated(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyEnumerated deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  if (propertyIdentifier == BACNET_PROPERTY_IDENTIFIER_EVENT_STATE) {
    return false; // Always return false for this property, BACnet Stack will handle the value.
  }

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  switch (propertyIdentifier) {

    case BACNET_PROPERTY_IDENTIFIER_FD_BBMD_ADDRESS:
      {
        // The FD_BBMD_ADDRESS property is of type FD_BBMD_ADDRESS
        const FD_BBMD_ADDRESS__BBMD_ADDRESS = 0;
        value.writeUint32LE(FD_BBMD_ADDRESS__BBMD_ADDRESS, 0);
        return true;
      }
    default:
      {
        // Check the datatype
        if (typeof dbValue !== 'number') {
          console.error('The value is not a number. Type: ' + typeof dbValue);
          return false;
        }

        value.writeUint32LE(dbValue, 0);
        return true;
      }
  }
}

function GetPropertyUnsignedInteger(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyUnsignedInteger deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  switch (propertyIdentifier) {
    case BACNET_PROPERTY_IDENTIFIER_IP_DNS_SERVER:
      if (useArrayIndex && propertyArrayIndex == 0) {
        // This is the size of the array of DNS servers
        // Check the datatype
        if (typeof dbValue !== 'object') {
          console.error('The value is not a object. Type: ' + typeof dbValue);
          return false;
        }
        if (!Array.isArray(dbValue)) {
          console.error('The value is not an array. Type: ' + typeof dbValue);
          return false;
        }
        value.writeUInt32LE(dbValue.length, 0);
        return true;
      }
    case BACNET_PROPERTY_IDENTIFIER_FD_BBMD_ADDRESS:
      {
        if (typeof dbValue !== 'object') {
          console.error('The value is not a object. Type: ' + typeof dbValue);
          return false;
        }

        if (!Array.isArray(dbValue)) {
          console.error('The value is not an array. Type: ' + typeof dbValue);
          return false;
        }

        if (!useArrayIndex || propertyArrayIndex > dbValue.length) {
          console.error('The array index is out of bounds. Type: ' + propertyArrayIndex + ', Length: ' + dbValue.length);
          return false;
        }

        if (typeof dbValue[propertyArrayIndex - 1] !== 'number') {
          console.error('The value is not a number. Type: ' + typeof dbValue[propertyArrayIndex - 1]);
          return false;
        }

        value.writeUInt32LE(dbValue[propertyArrayIndex - 1], 0);
        return true;
      }

    default:
      // Check the datatype
      if (typeof dbValue !== 'number') {
        console.error('The value is not a number. Type: ' + typeof dbValue);
        return false;
      }

      value.writeUInt32LE(dbValue, 0);
      return true;
  }
}
function GetPropertyBitString(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, valueElementCount: Buffer, maxElementCount: number, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyBitString deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  // Check the datatype
  // Example format: 111100001101
  if (typeof dbValue !== 'string') {
    console.error('The value is not a string. Type: ' + typeof dbValue);
    return false;
  }

  for (let i = 0; i < dbValue.length; i++) {
    value.writeUInt8(dbValue.charCodeAt(i), i);
  }
  valueElementCount.writeUInt32LE(dbValue.length, 0);
  return true;
}
function GetPropertyDate(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, year: Buffer, month: Buffer, day: Buffer, weekday: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyDate deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  // Check the datatype
  // Example format: { year: number, month: number, day: number, weekday: number }
  if (typeof dbValue !== 'object' ||
    typeof dbValue.year !== 'number' ||
    typeof dbValue.month !== 'number' ||
    typeof dbValue.day !== 'number' ||
    typeof dbValue.weekday !== 'number'
  ) {
    console.error('The value is not a object. Type: ' + typeof dbValue);
    return false;
  }

  year.writeUInt8(dbValue.year - 1900, 0);
  month.writeUInt8(dbValue.month, 0);
  day.writeUInt8(dbValue.day, 0);
  weekday.writeUInt8(dbValue.weekday, 0);
  return true;
}
function GetPropertyDouble(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyDouble deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  // Check the datatype
  if (typeof dbValue !== 'number') {
    console.error('The value is not a number. Type: ' + typeof dbValue);
    return false;
  }

  value.writeDoubleLE(dbValue, 0);
  return true;
}
function GetPropertyOctetString(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, valueElementCount: Buffer, maxElementCount: number, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyOctetString deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  switch (propertyIdentifier) {
    case BACNET_PROPERTY_IDENTIFIER_IP_DNS_SERVER:
      {
        // This is the size of the array of DNS servers
        // Check the datatype
        if (typeof dbValue !== 'object') {
          console.error('The value is not a object. Type: ' + typeof dbValue);
          return false;
        }
        if (!Array.isArray(dbValue)) {
          console.error('The value is not an array. Type: ' + typeof dbValue);
          return false;
        }
        if (!useArrayIndex || propertyArrayIndex > dbValue.length) {
          console.error('The propertyArrayIndex is out of range. propertyArrayIndex: ' + propertyArrayIndex + ', dbValue.length: ' + dbValue.length);
          return false;
        }

        let ipParts = dbValue[propertyArrayIndex - 1].split(".");
        for (let offset = 0; offset < ipParts.length; offset++) {
          value.writeUInt8(parseInt(ipParts[offset]), offset);
        }
        valueElementCount.writeUInt32LE(ipParts.length, 0);
        return true;
      }
    case BACNET_PROPERTY_IDENTIFIER_IP_DEFAULT_GATEWAY:
    case BACNET_PROPERTY_IDENTIFIER_IP_ADDRESS:
    case BACNET_PROPERTY_IDENTIFIER_IP_DNS_SERVER:
    case BACNET_PROPERTY_IDENTIFIER_IP_SUBNET_MASK:
      {
        // Check the datatype
        if (typeof dbValue !== 'string') {
          console.error('The value is not a string. Type: ' + typeof dbValue);
          return false;
        }

        let ipParts = dbValue.split(".");
        for (let i = 0; i < ipParts.length; i++) {
          value.writeUInt8(parseInt(ipParts[i]), i);
        }
        valueElementCount.writeUInt32LE(ipParts.length, 0);
        return true;
      }
    default: {
      // Check the datatype
      if (typeof dbValue !== 'string') {
        console.error('The value is not a string. Type: ' + typeof dbValue);
        return false;
      }

      for (let i = 0; i < dbValue.length; i++) {
        value.writeUInt8(dbValue.charCodeAt(i), i);
      }
      valueElementCount.writeUInt32LE(dbValue.length, 0);
      return true;
    }
  }
}
function GetPropertySignedInteger(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertySignedInteger deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  // Check the datatype
  if (typeof dbValue !== 'number') {
    console.error('The value is not a number. Type: ' + typeof dbValue);
    return false;
  }

  value.writeInt32LE(dbValue, 0);
  return true;
}
function GetPropertyTime(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, hour: Buffer, minute: Buffer, second: Buffer, hundrethSeconds: Buffer, useArrayIndex: boolean, propertyArrayIndex: number): boolean {
  console.log('GetPropertyTime deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex);

  // Example - Get from simple database
  let dbValue = db.get('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier);
  if (dbValue === undefined) {
    console.warn('The value is not defined in the database.');
    return false;
  }

  // Check the datatype
  // Example format: { hour: number, minute: number, second: number, hundrethSeconds: number }
  if (typeof dbValue !== 'object' ||
    typeof dbValue.hour !== 'number' ||
    typeof dbValue.minute !== 'number' ||
    typeof dbValue.second !== 'number' ||
    typeof dbValue.hundrethSeconds !== 'number'
  ) {
    console.error('The value is not a object. Type: ' + typeof dbValue);
    return false;
  }

  hour.writeUInt8(dbValue.hour, 0);
  minute.writeUInt8(dbValue.minute, 0);
  second.writeUInt8(dbValue.second, 0);
  hundrethSeconds.writeUInt8(dbValue.hundrethSeconds, 0);
  return true;
}


// Set Property Callbacks
// ------------------------------------------------------------------------
function SetPropertyReal(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: number, useArrayIndex: boolean, propertyArrayIndex: number, priority: number, errorCode: Buffer): boolean {
  console.log('SetPropertyReal deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority);

  // Only allow writes to specific objects and properties
  if (deviceInstance != SETTING_DEVICE_INSTANCE || propertyIdentifier != BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE) {
    return false;
  }

  if (objectType != BACNET_OBJECT_TYPE_ANALOG_VALUE) {
    return false;
  }

  // Example - Set to simple database
  db.set('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier, value);
  console.log('SetPropertyReal successful. Value: ' + value);
  return true;
}

function SetPropertyUnsignedInteger(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: number, useArrayIndex: boolean, propertyArrayIndex: number, priority: number, errorCode: Buffer): boolean {
  console.log('SetPropertyUnsignedInteger deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority);

  // Only allow writes to specific objects and properties
  if (deviceInstance != SETTING_DEVICE_INSTANCE || propertyIdentifier != BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE) {
    return false;
  }

  if (objectType != BACNET_OBJECT_TYPE_MULTI_STATE_VALUE) {
    return false;
  }

  // Example - Set to simple database
  db.set('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier, value);
  console.log('SetPropertyUnsignedInteger successful. Value: ' + value);
  return true;
}

function SetPropertyEnumerated(deviceInstance: number, objectType: number, objectInstance: number, propertyIdentifier: number, value: number, useArrayIndex: boolean, propertyArrayIndex: number, priority: number, errorCode: Buffer): boolean {
  console.log('SetPropertyEnumerated deviceInstance: ' + deviceInstance + ', objectType: ' + objectType + ', objectInstance: ' + objectInstance + ', propertyIdentifier: ' + propertyIdentifier + ', useArrayIndex: ' + useArrayIndex + ', propertyArrayIndex: ' + propertyArrayIndex + ', priority: ' + priority);

  // Only allow writes to specific objects and properties
  if (deviceInstance != SETTING_DEVICE_INSTANCE || propertyIdentifier != BACNET_PROPERTY_IDENTIFIER_PRESENT_VALUE) {
    return false;
  }

  if (objectType != BACNET_OBJECT_TYPE_BINARY_VALUE) {
    return false;
  }

  // Example - Set to simple database
  db.set('' + deviceInstance + '.' + objectType + '.' + objectInstance + '.' + propertyIdentifier, value);
  console.log('SetPropertyEnumerated successful. Value: ' + value);
  return true;
}





// 
// Main
StartUp();
