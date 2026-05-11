export interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  fullResult: string;
}

export interface ReverseResult {
  address: string;
  fullResult: string;
}

export interface Point {
  lat: number;
  lng: number;
  label?: string;
}

export interface RadiusResult {
  label: string;
  distance: number;
  lat: number;
  lng: number;
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number, unit: 'km' | 'm'): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  return unit === 'm' ? Math.round(distanceKm * 1000 * 100) / 100 : Math.round(distanceKm * 100) / 100;
}

export async function nominatimGeocode(address: string): Promise<GeocodingResult> {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`,
    { headers: { 'User-Agent': 'feishu-geo-calculator/1.0' } },
  );
  if (!resp.ok) throw new Error(`Nominatim API错误: ${resp.status}`);
  const data: any = await resp.json();
  if (!data || data.length === 0) throw new Error('地址未找到，请尝试更详细的地址');
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name || '',
    fullResult: JSON.stringify(data[0], null, 2),
  };
}

export async function nominatimReverse(lat: number, lng: number): Promise<ReverseResult> {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    { headers: { 'User-Agent': 'feishu-geo-calculator/1.0' } },
  );
  if (!resp.ok) throw new Error(`Nominatim API错误: ${resp.status}`);
  const data: any = await resp.json();
  if (!data || data.error) throw new Error(data?.error || '坐标未找到对应地址');
  return { address: data.display_name || '', fullResult: JSON.stringify(data, null, 2) };
}

export async function amapGeocode(address: string, key: string): Promise<GeocodingResult> {
  const resp = await fetch(`https://restapi.amap.com/v3/geocode/geo?key=${key}&address=${encodeURIComponent(address)}&output=json`);
  if (!resp.ok) throw new Error(`高德API错误: ${resp.status}`);
  const data: any = await resp.json();
  if (data.status !== '1' || !data.geocodes || data.geocodes.length === 0) throw new Error('高德地理编码失败: ' + (data.info || '地址未找到'));
  const [lng, lat] = data.geocodes[0].location.split(',');
  return { lat: parseFloat(lat), lng: parseFloat(lng), displayName: data.geocodes[0].formatted_address || '', fullResult: JSON.stringify(data.geocodes[0], null, 2) };
}

export async function amapReverse(lat: number, lng: number, key: string): Promise<ReverseResult> {
  const resp = await fetch(`https://restapi.amap.com/v3/geocode/regeo?key=${key}&location=${lng},${lat}&output=json`);
  if (!resp.ok) throw new Error(`高德API错误: ${resp.status}`);
  const data: any = await resp.json();
  if (data.status !== '1') throw new Error('高德逆地理编码失败: ' + (data.info || ''));
  return { address: data.regeocode?.formatted_address || '地址未找到', fullResult: JSON.stringify(data.regeocode, null, 2) };
}

export async function baiduGeocode(address: string, key: string): Promise<GeocodingResult> {
  const resp = await fetch(`https://api.map.baidu.com/geocoding/v3/?ak=${key}&address=${encodeURIComponent(address)}&output=json`);
  if (!resp.ok) throw new Error(`百度API错误: ${resp.status}`);
  const data: any = await resp.json();
  if (data.status !== 0) throw new Error('百度地理编码失败: ' + (data.message || ''));
  return { lat: data.result.location.lat, lng: data.result.location.lng, displayName: data.result.address || address, fullResult: JSON.stringify(data.result, null, 2) };
}

export async function baiduReverse(lat: number, lng: number, key: string): Promise<ReverseResult> {
  const resp = await fetch(`https://api.map.baidu.com/reverse_geocoding/v3/?ak=${key}&location=${lat},${lng}&output=json`);
  if (!resp.ok) throw new Error(`百度API错误: ${resp.status}`);
  const data: any = await resp.json();
  if (data.status !== 0) throw new Error('百度逆地理编码失败: ' + (data.message || ''));
  return { address: data.result?.formatted_address || '地址未找到', fullResult: JSON.stringify(data.result, null, 2) };
}

export function findWithinRadius(centerLat: number, centerLng: number, points: Point[], radiusKm: number, unit: 'km' | 'm'): RadiusResult[] {
  const results: RadiusResult[] = [];
  for (const p of points) {
    const d = calculateDistance(centerLat, centerLng, p.lat, p.lng, 'km');
    if (d <= radiusKm) results.push({ label: p.label || `${p.lat},${p.lng}`, distance: unit === 'm' ? d * 1000 : d, lat: p.lat, lng: p.lng });
  }
  return results.sort((a, b) => a.distance - b.distance);
}
