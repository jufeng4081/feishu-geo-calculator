export type GeoOp = 'geocode' | 'reverse' | 'distance' | 'radius';

export const OP_OPTIONS = [
  { label: '地理编码（地址→坐标）', value: 'geocode' },
  { label: '逆地理编码（坐标→地址）', value: 'reverse' },
  { label: '距离计算（两点距离）', value: 'distance' },
  { label: '半径检索（范围内查找）', value: 'radius' },
];

export const PROVIDER_OPTIONS = [
  { label: 'Nominatim（免费，无需Key）', value: 'nominatim' },
  { label: '高德地图（需API Key）', value: 'amap' },
  { label: '百度地图（需API Key）', value: 'baidu' },
];

export const OUTPUT_FORMAT_OPTIONS = [
  { label: '完整信息', value: 'full' },
  { label: '仅坐标', value: 'coords' },
  { label: '仅地址', value: 'address' },
];

export const UNIT_OPTIONS = [
  { label: '千米 (km)', value: 'km' },
  { label: '米 (m)', value: 'm' },
];
