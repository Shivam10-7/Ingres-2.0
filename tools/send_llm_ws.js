const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8081');

ws.on('open', () => {
  console.log('connected');
  const payload = {
    broadcast: true,
    success: true,
    title: 'Sample LLM Result - East Godavari',
    data: [
      {
        state: 'ANDHRA PRADESH',
        district: 'East Godavari',
        assessment_unit_name: 'RAJAHMUNDRY (URBAN)',
        assessment_unit_type: 'BLOCK',
        recharge_worthy_area_ha: 1737.75,
        total_annual_ground_water_recharge_ham: 168.66,
        annual_extractable_ground_water_resource_ham: 160.23,
        total_ground_water_extraction_ham: 0,
        stage_of_ground_water_extraction_percent: 8.244398677,
        categorization: 'Safe',
        year: 2024,
      },
    ],
  };

  ws.send(JSON.stringify(payload));
  setTimeout(() => ws.close(), 500);
});

ws.on('message', (m) => console.log('msg:', m.toString()));
ws.on('error', (e) => console.error('err', e));
