// --- Demo county list (for a backend REST API, replace with fetch!) ---
const counties = [
  "King", "Pierce", "Snohomish", "Spokane", "Clark", "Yakima", "Kitsap",
  "Thurston", "Benton", "Skagit", "Chelan", "Cowlitz", "Grant",
  "Whatcom", "Walla Walla"
];

// Populate dropdowns
const countySelect = document.getElementById('county-select');
counties.forEach(county => {
  const opt = document.createElement('option');
  opt.value = county;
  opt.textContent = county;
  countySelect.appendChild(opt);
});
const multiCountySelect = document.getElementById('multi-county-select');
counties.forEach(county => {
  const opt = document.createElement('option');
  opt.value = county;
  opt.textContent = county;
  multiCountySelect.appendChild(opt);
});

// --- Chart.js references ---
let forecastChart, multiChart;

// --- Utility: Generate demo timeseries for forecast ---
function generateDemoEVData(months=36, start=500, noise=40) {
  const data = [];
  let val = start;
  for (let i = 0; i < months; i++) {
    val += Math.floor(Math.random()*noise + noise/2); // fake growth
    data.push(val);
  }
  return data;
}

// --- Main County Select Logic ---
countySelect.addEventListener('change', function() {
  const sel = this.value;
  document.getElementById('forecast-msg').style.display = "none";
  document.getElementById('warning-msg').style.display = "none";
  document.getElementById('county-title').textContent = sel ? sel : "";

  if (!sel) {
    if (forecastChart) forecastChart.destroy();
    return;
  }

  // DEMO: simulate 18 months of historical data + 36 months of forecasted
  const monthsHistorical = 18;
  const monthsForecast = 36;
  const datesHistorical = Array(monthsHistorical).fill(0).map(
    (_,i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (monthsHistorical - i - 1));
      return d.toLocaleDateString(undefined, {year:'numeric', month:'short'});
    }
  );
  const datesForecast = Array(monthsForecast).fill(0).map(
    (_,i) => {
      const d = new Date();
      d.setMonth(d.getMonth()+i+1);
      return d.toLocaleDateString(undefined, {year:'numeric', month:'short'});
    }
  );
  const startValue = Math.floor(Math.random()*300+200); // random demo baseline

  const histData = generateDemoEVData(monthsHistorical, startValue, 50);
  const forecastData = generateDemoEVData(monthsForecast, histData[histData.length-1], 60);

  // Combine for chart
  const totalHistorical = histData[histData.length-1];
  const totalForecasted = forecastData[forecastData.length-1];
  const growthPct = ((totalForecasted-totalHistorical)/totalHistorical*100).toFixed(2);
  const trend = growthPct > 0 ? "increase 📈" : "decrease 📉";

  // Update success message
  const msgBox = document.getElementById('forecast-msg');
  if (totalHistorical > 0) {
    msgBox.innerHTML = `Based on the graph, EV adoption in <b>${sel}</b> is expected to show a <b>${trend} of ${growthPct}%</b> over the next 3 years.`;
    msgBox.style.display = "";
    document.getElementById('warning-msg').style.display = "none";
  } else {
    msgBox.style.display = "none";
    const warnBox = document.getElementById('warning-msg');
    warnBox.textContent = "Historical EV total is zero, so percentage forecast change can't be computed.";
    warnBox.style.display = "";
  }

  // Draw chart
  const ctx = document.getElementById('ev-forecast-chart').getContext('2d');
  if (forecastChart) forecastChart.destroy();
  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: datesHistorical.concat(datesForecast),
      datasets: [
        {
          label: "Historical",
          data: histData,
          fill: false,
          borderColor: "#48c4fa",
          backgroundColor: "#48c4fa",
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#48c4fa'
        },
        {
          label: "Forecast",
          data: Array(histData.length).fill(null).concat(forecastData),
          fill: false,
          borderColor: "#21d471",
          backgroundColor: "#21d471",
          borderDash: [5,2],
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#21d471'
        }
      ]
    },
    options: {
      plugins: {legend:{labels:{color:'white'}}},
      maintainAspectRatio:false,
      scales: {
        x: {ticks:{color:'white'}, grid:{display:false}},
        y: {ticks:{color:'white'}, grid:{color:'#fff2'}}
      }
    }
  });
});

// --- Multi-county Comparison ---
multiCountySelect.addEventListener('change', function() {
  const selected = Array.from(this.selectedOptions).map(opt=>opt.value);
  document.getElementById('compare-growth-msg').style.display = "none";
  if (multiChart) multiChart.destroy();
  if (!selected.length) return;

  // Limiting to maximum 3 selections
  if (selected.length > 3) {
    selected.length = 3;
    alert("Please select up to 3 counties.");
  }

  // For each selected, generate fake data
  const monthsHistorical = 18;
  const monthsForecast = 36;
  const allLabels = Array(monthsHistorical+monthsForecast).fill(0).map(
    (_,i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (monthsHistorical-1) + i);
      return d.toLocaleDateString(undefined, {year:'numeric', month:'short'});
    }
  );
  const datasets = [];
  let growthStrs = [];
  selected.forEach((county, idx) => {
    const colorList = ["#fd7c30", "#48c4fa", "#21d471"];
    const startValue = Math.floor(Math.random()*300+200+idx*150);
    const histData = generateDemoEVData(monthsHistorical, startValue, 50+idx*20);
    const forecastData = generateDemoEVData(monthsForecast, histData[histData.length-1], 60+idx*15);
    const cumulative = histData.concat(forecastData);

    datasets.push({
      label: county,
      data: cumulative,
      borderColor: colorList[idx%colorList.length],
      backgroundColor: colorList[idx%colorList.length] + "66",
      fill: false,
      tension: 0.3,
      pointRadius: 0
    });

    // % growth computation
    const totalHistorical = histData[histData.length-1];
    const totalForecasted = cumulative[cumulative.length-1];
    if (totalHistorical > 0) {
      const growthPct = ((totalForecasted-totalHistorical)/totalHistorical*100).toFixed(2);
      growthStrs.push(`${county}: ${growthPct}%`);
    } else {
      growthStrs.push(`${county}: N/A (no historical data)`);
    }
  });

  // Chart
  const ctx = document.getElementById('multi-ev-chart').getContext('2d');
  multiChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: allLabels,
      datasets: datasets
    },
    options: {
      plugins: {legend:{labels:{color:'white'}}},
      maintainAspectRatio:false,
      scales: {
        x: {ticks:{color:'white'}, grid:{display:false}},
        y: {ticks:{color:'white'}, grid:{color:'#fff2'}}
      }
    }
  });

  // Show % growth for each selected county
  document.getElementById('growth-summary').textContent = 'Forecasted EV adoption growth over next 3 years — ' + growthStrs.join(' | ');
  document.getElementById('compare-growth-msg').style.display = "";
});
