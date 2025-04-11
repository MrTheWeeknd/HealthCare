function fetchStepData() {
    const endTimeMillis = getNowUTC();
    const startTimeMillis = getDaysAgoUTC(timeRanges[currentRange]);
  
    fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aggregateBy: [{
          dataTypeName: "com.google.step_count.delta",
          dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps"
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis,
        endTimeMillis
      })
    })
      .then(res => res.json())
      .then(data => {
        displaySteps(data);
        displayTodaySteps(data);
      })
      .catch(err => {
        document.getElementById('output').innerHTML = 'Erro ao buscar passos: ' + err.message;
      });
  }
  
  
  function displaySteps(data) {
    const tbody = document.querySelector('#stepsTable tbody');
    const labels = [];
    const values = [];
  
    tbody.innerHTML = "";
  
    data.bucket.forEach(bucket => {
      const date = new Date(Number(bucket.startTimeMillis));
      date.setDate(date.getDate() + 1); // Correção de fuso
      const dateStr = date.toLocaleDateString();
  
  
      let steps = 0;
      bucket.dataset?.forEach(ds => {
        ds.point?.forEach(pt => {
          steps += pt.value[0]?.intVal || 0;
        });
      });
  
      labels.push(dateStr);
      values.push(steps);
  
      const row = document.createElement("tr");
      row.innerHTML = `<td>${dateStr}</td><td>${steps}</td>`;
      tbody.appendChild(row);
    });
  
    renderStepChart(labels, values);
  }
  
  function displayTodaySteps(data) {
    const todayBucket = data.bucket[data.bucket.length - 1];
    let todaySteps = 0;
  
    todayBucket?.dataset?.forEach(ds => {
      ds.point?.forEach(pt => {
        todaySteps += pt.value[0]?.intVal || 0;
      });
    });
  
    document.getElementById('todaySteps').innerText = `${todaySteps} passos`;
  }
  
  
  function renderStepChart(labels, values) {
    if (stepChart) stepChart.destroy();
  
    const ctx = document.getElementById('stepsChart').getContext('2d');
    stepChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Passos por dia',
          data: values,
          backgroundColor: '#4caf50',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
  
  
  
  
  
  