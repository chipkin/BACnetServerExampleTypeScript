# BACnet Server Example in TypeScript

A BACnet Server Example written in [TypeScript](https://www.typescriptlang.org/) using the [CAS BACnet Stack](https://store.chipkin.com/services/stacks/bacnet-stack). This is a basic server example and does not include all of the functionality of the CAS BACnet Stack. See [BACnetServerExampleCPP](https://github.com/chipkin/BACnetServerExampleCPP) for a full featured example.

Use the [Chipkin BACnet Explorer](https://store.chipkin.com/products/tools/cas-bacnet-explorer) to discover this device.

## Supported CAS BACnet Stack Version

This example project uses version `5.1.0.2541-21` of the [CAS BACnet Stack](https://store.chipkin.com/services/stacks/bacnet-stack)

## Building

```bash
npm i typescript --save-dev
npm install
npm run start
```

## Device Tree

- Device: 389055 (CAS BACnet Stack TypeScript Example)
  - analog_input: 0 (AnalogInput Bronze)
  - analog_value: 2 (AnalogValue Diamond) - Writable
  - binary_input: 3 (BinaryInput Emerald)
  - binary_value: 5 (BinaryValue Gold)  - Writable
  - multi_state_input: 13 (MultiStateInput Hot Pink)
  - multi_state_value: 19 (MultiStateValue Kiwi)  - Writable

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
