# BACnet Server Example in TypeScript

A BACnet Server Example written in [TypeScript](https://www.typescriptlang.org/) using the [CAS BACnet Stack](https://store.chipkin.com/services/stacks/bacnet-stack). This is a basic server example and does not include all of the functionality of the CAS BACnet Stack. See [BACnetServerExampleCPP](https://github.com/chipkin/BACnetServerExampleCPP) for a full featured example.

Use the [Chipkin BACnet Explorer](https://store.chipkin.com/products/tools/cas-bacnet-explorer) to discover this device.

## Supported CAS BACnet Stack Version

This example project uses version `5.1.0.2541-21` of the [CAS BACnet Stack](https://store.chipkin.com/services/stacks/bacnet-stack)

## Building

NPM login to Chipkin Gitlab instance for the [CAS BACnet Stack](https://store.chipkin.com/services/stacks/bacnet-stack).

```bash
echo @chipkin:registry=https://gitlab.com/api/v4/packages/npm/ >> .npmrc
npm i typescript --save-dev
npm install
npm run start
```

## Device

When discover the BACnet device should have the following object types

- Device: 389055 (CAS BACnet Stack TypeScript Example)
  - Analog Input: 0
    - Object Name: "AnalogInput Bronze"
    - Present Value: Updates every 30 seconds by 1.1
  - Analog Value: 2
    - Object Name: "AnalogValue Diamond"
    - Present Value: Writable
  - Binary Input: 3
    - Object Name: "BinaryInput Emerald"
  - Binary Value: 5
    - Object Name: "BinaryValue Gold"
    - Present Value: Writable
  - MultiState Input: 13
    - Object Name: "MultiStateInput Hot Pink"
  - MultiState Value: 19
    - Object Name: "MultiStateValue Kiwi"
    - Present Value: Writable
  - Network Port: 56
    - Object Name: "NetworkPort Vermilion"

### Supported Services

The following services are supported in this example. Other serviecs are avalaible in the [CAS BACnet Stack](https://store.chipkin.com/services/stacks/bacnet-stack)

- Read Property
- Read Property Multiple
- Write Property
- Write Property Multiple
- Subscribe Cov
- Device Communication Control
- Subscribe Cov Property
- Subscribe Cov Property Multiple

## Example Output

```txt
FYI: BACnet Server Example in TypeScript Version: 1.0.0
FYI: https://github.com/chipkin/BACnetServerExampleTypeScript
FYI: CAS BACnet Stack Version: 5.1.0.2541-21
FYI: Setting up callback functions...
FYI: Setting up bacnet device...
FYI: Setting up bacnet database with values...
FYI: Connecting UDP to port: 47808, networkPort.ip: 192.168.2.59, networkPort.broadcastAddress: 192.168.2.255
FYI: Starting main program loop...
FYI: UDP.Server listening 192.168.2.59:47808
Received message from: 192.168.2.31:47808, messageLength: 17
GetPropertyEnumerated deviceInstance: 389055, objectType: 3, objectInstance: 3, propertyIdentifier: 85, useArrayIndex: false, propertyArrayIndex: 0
Sending message to: 192.168.2.31:47808, messageLength: 20
Received message from: 192.168.2.31:47808, messageLength: 19
```

## Notes

### The value is not defined in the database

The CAS BACnet Stack requests a value for all requested properties using a CallBackGetProperty function. If that callback function returns a false. A default will be used. It is normal to have ```The value is not defined in the database``` warnings as the default will be used for these properties.

Example:

```txt
GetPropertyUnsignedInteger deviceInstance: 389055, objectType: 8, objectInstance: 389055, propertyIdentifier: 62, useArrayIndex: false, propertyArrayIndex: 0
The value is not defined in the database.
```
