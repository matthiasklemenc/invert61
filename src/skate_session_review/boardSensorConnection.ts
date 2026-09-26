import { BoardSensorDataPoint } from './types';

const SERVICE_UUID = '0000ffe5-0000-1000-8000-00805f9a34fb';
const NOTIFY_CHARACTERISTIC_UUID = '0000ffe4-0000-1000-8000-00805f9a34fb';
const SENSOR_NAME_PREFIX = 'WT901';

type BluetoothCharacteristic = BluetoothRemoteGATTCharacteristic & {
  value?: DataView | null;
};

type BluetoothDeviceWithGatt = BluetoothDevice & {
  gatt: BluetoothRemoteGATTServer | null;
};

type WebBluetoothNavigator = Navigator & {
  bluetooth?: {
    requestDevice(options: {
      filters?: Array<{ namePrefix?: string }>;
      optionalServices?: string[];
    }): Promise<BluetoothDeviceWithGatt>;
  };
};

type SensorListener = (point: BoardSensorDataPoint) => void;
type StatusListener = (connected: boolean, deviceName: string) => void;

const listeners = new Set<SensorListener>();
const statusListeners = new Set<StatusListener>();

let device: BluetoothDeviceWithGatt | null = null;
let characteristic: BluetoothCharacteristic | null = null;
let connected = false;
let deviceName = '—';

const readInt16LE = (view: DataView, offset: number) => view.getInt16(offset, true);

const parseWitMotionPacket = (value: DataView): BoardSensorDataPoint | null => {
  if (value.byteLength < 20 || value.getUint8(0) !== 0x55 || value.getUint8(1) !== 0x61) {
    return null;
  }

  return {
    timestamp: Date.now(),
    ax: readInt16LE(value, 2) * (16 / 32768),
    ay: readInt16LE(value, 4) * (16 / 32768),
    az: readInt16LE(value, 6) * (16 / 32768),
    gx: readInt16LE(value, 8) * (2000 / 32768),
    gy: readInt16LE(value, 10) * (2000 / 32768),
    gz: readInt16LE(value, 12) * (2000 / 32768),
    roll: readInt16LE(value, 14) * (180 / 32768),
    pitch: readInt16LE(value, 16) * (180 / 32768),
    yaw: readInt16LE(value, 18) * (180 / 32768),
  };
};

const notifyStatus = () => {
  statusListeners.forEach((listener) => listener(connected, deviceName));
};

function handleNotification(event: Event) {
  const value = (event.target as BluetoothCharacteristic).value;
  if (!value) return;

  const parsed = parseWitMotionPacket(value);
  if (!parsed) return;

  listeners.forEach((listener) => listener(parsed));
}

function handleDisconnected() {
  connected = false;
  characteristic = null;
  notifyStatus();
}

export const isBoardSensorConnected = () =>
  connected && !!device?.gatt?.connected && !!characteristic;

export const getBoardSensorDeviceName = () => deviceName;

export const subscribeBoardSensor = (listener: SensorListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const subscribeBoardSensorStatus = (listener: StatusListener) => {
  statusListeners.add(listener);
  listener(isBoardSensorConnected(), deviceName);
  return () => statusListeners.delete(listener);
};

export const connectBoardSensor = async () => {
  if (isBoardSensorConnected()) {
    return deviceName;
  }

  const bluetooth = (navigator as WebBluetoothNavigator).bluetooth;
  if (!bluetooth) {
    throw new Error('Web Bluetooth is not available. Open INVERT in Chrome on Android.');
  }

  if (!device) {
    device = await bluetooth.requestDevice({
      filters: [{ namePrefix: SENSOR_NAME_PREFIX }],
      optionalServices: [SERVICE_UUID],
    });

    deviceName = device.name || 'WT901 sensor';
    device.addEventListener('gattserverdisconnected', handleDisconnected);
  }

  const server = await device.gatt?.connect();
  if (!server) {
    throw new Error('Could not connect to the sensor GATT server.');
  }

  const service = await server.getPrimaryService(SERVICE_UUID);
  const nextCharacteristic = (await service.getCharacteristic(
    NOTIFY_CHARACTERISTIC_UUID,
  )) as BluetoothCharacteristic;

  await nextCharacteristic.startNotifications();

  nextCharacteristic.removeEventListener('characteristicvaluechanged', handleNotification);
  nextCharacteristic.addEventListener('characteristicvaluechanged', handleNotification);

  characteristic = nextCharacteristic;
  connected = true;
  notifyStatus();

  return deviceName;
};

export const disconnectBoardSensor = () => {
  if (characteristic) {
    characteristic.removeEventListener('characteristicvaluechanged', handleNotification);
  }

  if (device) {
    device.removeEventListener('gattserverdisconnected', handleDisconnected);
    if (device.gatt?.connected) {
      device.gatt.disconnect();
    }
  }

  characteristic = null;
  device = null;
  connected = false;
  deviceName = '—';
  notifyStatus();
};
