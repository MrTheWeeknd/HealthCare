function fetchHeartRateData() {
    const endTimeMillis = getNowUTC();
    const startTimeMillis = getDaysAgoUTC(timeRanges[currentRange]);
  
    fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aggregateBy: [{ dataTypeName: "com.google.heart_rate.bpm" }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis
      })
    })
      .then(res => res.json())
      .then(data => {
        displayHeartRate(data);
        displayTodayHeartRate(data);
      })
      .catch(err => {
        document.getElementById('heartRateTable').innerHTML = 'Erro ao buscar batimentos: ' + err.message;
      });
}

function displayHeartRate(data) {
    const tbody = document.querySelector('#heartRateTable tbody');
    const labels = [];
    const values = [];
  
    tbody.innerHTML = "";
  
    data.bucket.forEach(bucket => {
      const date = new Date(Number(bucket.startTimeMillis));
      date.setDate(date.getDate() + 1); // Correção de fuso
      const dateStr = date.toLocaleDateString();
  
  
      let bpm = 0;
      let count = 0;
  
      bucket.dataset?.forEach(ds => {
        ds.point?.forEach(pt => {
          if (pt.value[0]?.fpVal) {
            bpm += pt.value[0].fpVal;
            count++;
          }
        });
      });
  
      const avgBpm = count ? (bpm / count).toFixed(1) : '-';
  
      labels.push(dateStr);
      values.push(avgBpm === '-' ? null : Number(avgBpm));
  
      const row = document.createElement("tr");
      row.innerHTML = `<td>${dateStr}</td><td>${avgBpm}</td>`;
      tbody.appendChild(row);
    });
  
    renderHeartChart(labels, values);
  }
  
  function displayTodayHeartRate(data) {
    const todayBucket = data.bucket[data.bucket.length - 1];
    let bpm = 0;
    let count = 0;
  
    todayBucket?.dataset?.forEach(ds => {
      ds.point?.forEach(pt => {
        if (pt.value[0]?.fpVal) {
          bpm += pt.value[0].fpVal;
          count++;
        }
      });
    });
  
    const avgToday = count ? (bpm / count).toFixed(1) : '-';
    document.getElementById('todayHeartRate').innerText = `${avgToday} bpm`;
  }

  function renderHeartChart(labels, values) {
    if (heartChart) heartChart.destroy();
  
    const ctx = document.getElementById('heartRateChart').getContext('2d');
    heartChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Frequência Cardíaca Média (bpm)',
          data: values,
          borderColor: '#f44336',
          fill: false,
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: false,
            suggestedMin: 40,
            suggestedMax: 140
          }
        }
      }
    });
  }