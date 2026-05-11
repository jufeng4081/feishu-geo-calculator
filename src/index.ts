import { basekit, FieldType, FieldComponent, FieldCode } from '@lark-opdev/block-basekit-server-api';
import {
  GeoOp, OP_OPTIONS, PROVIDER_OPTIONS, OUTPUT_FORMAT_OPTIONS, UNIT_OPTIONS,
} from './prompts';
import {
  calculateDistance, findWithinRadius,
  nominatimGeocode, nominatimReverse,
  amapGeocode, amapReverse,
  baiduGeocode, baiduReverse,
  Point,
} from './geo';

basekit.addDomainList([
  'nominatim.openstreetmap.org',
  'restapi.amap.com',
  'api.map.baidu.com',
]);

basekit.addField({
  i18n: {
    messages: {
      'zh-CN': {
        field_name: '地址坐标计算',
        mode: '操作模式',
        provider: '服务商',
        api_key: 'API Key',
        api_key_placeholder: '高德/百度地图需要API Key，Nominatim免费使用',
        address_field: '地址文本字段',
        lat_field: '纬度字段',
        lng_field: '经度字段',
        lat2_field: '目标纬度',
        lng2_field: '目标经度',
        output_format: '输出格式',
        unit: '距离单位',
        radius: '检索半径(km)',
        points_field: '目标坐标列表(JSON格式)',
        center_lat: '中心纬度',
        center_lng: '中心经度',
        no_input: '（请输入数据）',
        geocode_result: '地理编码结果',
        reverse_result: '逆地理编码结果',
        distance_result: '距离计算结果',
        radius_result: '半径检索结果',
      },
      'en-US': {
        field_name: 'Geo Calculator',
        mode: 'Mode',
        provider: 'Provider',
        api_key: 'API Key',
        api_key_placeholder: 'Required for AMap/Baidu, Nominatim is free',
        address_field: 'Address Field',
        lat_field: 'Latitude Field',
        lng_field: 'Longitude Field',
        lat2_field: 'Target Latitude',
        lng2_field: 'Target Longitude',
        output_format: 'Output Format',
        unit: 'Distance Unit',
        radius: 'Search Radius(km)',
        points_field: 'Target Points (JSON)',
        center_lat: 'Center Latitude',
        center_lng: 'Center Longitude',
        no_input: '(Please enter data)',
        geocode_result: 'Geocode Result',
        reverse_result: 'Reverse Geocode Result',
        distance_result: 'Distance Result',
        radius_result: 'Radius Search Result',
      },
    },
  },

  formItems: [
    {
      key: 'mode',
      label: 'mode',
      component: FieldComponent.SingleSelect,
      props: { options: OP_OPTIONS },
      validator: { required: true },
    },
    {
      key: 'provider',
      label: 'provider',
      component: FieldComponent.SingleSelect,
      props: { options: PROVIDER_OPTIONS },
    },
    {
      key: 'apiKey',
      label: 'api_key',
      component: FieldComponent.Input,
      props: { placeholder: 'api_key_placeholder' },
    },
    {
      key: 'addressField',
      label: 'address_field',
      component: FieldComponent.FieldSelect,
      props: { supportType: [FieldType.Text] },
    },
    {
      key: 'latField',
      label: 'lat_field',
      component: FieldComponent.FieldSelect,
      props: { supportType: [FieldType.Number] },
    },
    {
      key: 'lngField',
      label: 'lng_field',
      component: FieldComponent.FieldSelect,
      props: { supportType: [FieldType.Number] },
    },
    {
      key: 'targetLatField',
      label: 'lat2_field',
      component: FieldComponent.FieldSelect,
      props: { supportType: [FieldType.Number] },
    },
    {
      key: 'targetLngField',
      label: 'lng2_field',
      component: FieldComponent.FieldSelect,
      props: { supportType: [FieldType.Number] },
    },
    {
      key: 'outputFormat',
      label: 'output_format',
      component: FieldComponent.SingleSelect,
      props: { options: OUTPUT_FORMAT_OPTIONS },
    },
    {
      key: 'unit',
      label: 'unit',
      component: FieldComponent.SingleSelect,
      props: { options: UNIT_OPTIONS },
    },
    {
      key: 'radius',
      label: 'radius',
      component: FieldComponent.Input,
      props: { placeholder: '5' },
    },
    {
      key: 'pointsField',
      label: 'points_field',
      component: FieldComponent.FieldSelect,
      props: { supportType: [FieldType.Text] },
    },
  ],

  resultType: { type: FieldType.Text },

  execute: async (formItemParams: Record<string, any>) => {
    try {
      const mode: GeoOp = formItemParams.mode || 'geocode';
      const provider: string = formItemParams.provider || 'nominatim';
      const apiKey: string = formItemParams.apiKey || '';
      const outputFormat: string = formItemParams.outputFormat || 'full';
      const unit: 'km' | 'm' = formItemParams.unit || 'km';

      if (mode === 'geocode') {
        const address: string = formItemParams.addressField ?? '';
        if (!address) return { code: FieldCode.Success, data: '（请输入地址）' };

        let result;
        if (provider === 'amap') result = await amapGeocode(address, apiKey);
        else if (provider === 'baidu') result = await baiduGeocode(address, apiKey);
        else result = await nominatimGeocode(address);

        if (outputFormat === 'coords') return { code: FieldCode.Success, data: `纬度: ${result.lat}\n经度: ${result.lng}` };
        if (outputFormat === 'address') return { code: FieldCode.Success, data: result.displayName };
        return { code: FieldCode.Success, data: `📍 地址: ${result.displayName}\n🌐 坐标: ${result.lat}, ${result.lng}\n\n${result.fullResult}` };
      }

      if (mode === 'reverse') {
        const lat = parseFloat(formItemParams.latField);
        const lng = parseFloat(formItemParams.lngField);
        if (isNaN(lat) || isNaN(lng)) return { code: FieldCode.Success, data: '（请输入有效的纬度/经度）' };

        let result;
        if (provider === 'amap') result = await amapReverse(lat, lng, apiKey);
        else if (provider === 'baidu') result = await baiduReverse(lat, lng, apiKey);
        else result = await nominatimReverse(lat, lng);

        if (outputFormat === 'coords') return { code: FieldCode.Success, data: `纬度: ${lat}\n经度: ${lng}` };
        if (outputFormat === 'address') return { code: FieldCode.Success, data: result.address };
        return { code: FieldCode.Success, data: `📍 坐标: ${lat}, ${lng}\n📮 地址: ${result.address}\n\n${result.fullResult}` };
      }

      if (mode === 'distance') {
        const lat1 = parseFloat(formItemParams.latField);
        const lng1 = parseFloat(formItemParams.lngField);
        const lat2 = parseFloat(formItemParams.targetLatField);
        const lng2 = parseFloat(formItemParams.targetLngField);
        if ([lat1, lng1, lat2, lng2].some(isNaN)) return { code: FieldCode.Success, data: '（请输入4个坐标值）' };
        const dist = calculateDistance(lat1, lng1, lat2, lng2, unit);
        const unitLabel = unit === 'km' ? '千米' : '米';
        return { code: FieldCode.Success, data: `📏 距离计算结果\n━━━━━━━━━━━━━\n起点: ${lat1}, ${lng1}\n终点: ${lat2}, ${lng2}\n距离: ${dist} ${unitLabel}` };
      }

      if (mode === 'radius') {
        const cLat = parseFloat(formItemParams.centerLat || formItemParams.latField);
        const cLng = parseFloat(formItemParams.centerLng || formItemParams.lngField);
        const radius = parseFloat(formItemParams.radius) || 5;
        const pointsRaw: string = formItemParams.pointsField ?? '';
        if (isNaN(cLat) || isNaN(cLng)) return { code: FieldCode.Success, data: '（请输入中心坐标）' };
        if (!pointsRaw) return { code: FieldCode.Success, data: '（请输入目标坐标列表）' };

        let points: Point[];
        try { points = JSON.parse(pointsRaw); } catch { return { code: FieldCode.Error, data: '坐标列表格式错误，请提供JSON数组如 [{"lat":39.9,"lng":116.4,"label":"地点A"}]' }; }

        const results = findWithinRadius(cLat, cLng, points, radius, unit);
        const unitLabel = unit === 'km' ? '千米' : '米';
        if (results.length === 0) return { code: FieldCode.Success, data: `未找到 ${radius}${unitLabel} 范围内的点` };

        const lines = [`📍 半径 ${radius}${unitLabel} 检索结果 (${results.length}个)`, '━━━━━━━━━━━━━'];
        results.forEach((r, i) => lines.push(`${i + 1}. ${r.label} — ${r.distance} ${unitLabel}`));
        return { code: FieldCode.Success, data: lines.join('\n') };
      }

      return { code: FieldCode.Success, data: '（未知模式）' };
    } catch (err: any) {
      return { code: FieldCode.Error, data: `执行异常: ${err.message || '未知错误'}` };
    }
  },
});

export default basekit;
