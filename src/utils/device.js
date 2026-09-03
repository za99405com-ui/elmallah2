export const getDeviceId = () => {
  if (typeof window !== 'undefined') {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }
  return 'unknown_device';
};
