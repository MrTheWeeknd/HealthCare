const CLIENT_ID = '856832730537-rqc1lni9s73i2aq51ioida2djijhjl8b.apps.googleusercontent.com';
let accessToken = null;
let stepChart, heartChart;

const timeRanges = {
  day: 1,
  week: 7,
  month: 30
};
let currentRange = 'day';

function getNowUTC() {
  return new Date().getTime();
}

function getDaysAgoUTC(daysAgo = 0) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

function handleCredentialResponse(response) {
  google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read',
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      updateData();
    }
  }).requestAccessToken();
}

window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse
  });

  google.accounts.id.renderButton(
    document.getElementById("signin"),
    { theme: "outline", size: "large" }
  );

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentRange = btn.dataset.range;
      updateData();
    });
  });
};

setInterval(() => {
  if (accessToken) updateData();
}, 120000); // 2 minutos

function updateData() {
  fetchStepData();
  fetchHeartRateData();
}

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

function displaySteps(data) {
  const tbody = document.querySelector('#stepsTable tbody');
  const labels = [];
  const values = [];

  tbody.innerHTML = "";

  data.bucket.forEach(bucket => {
    const date = new Date(Number(bucket.startTimeMillis));
    date.setDate(date.getDate() + 1);
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

function displayHeartRate(data) {
  const tbody = document.querySelector('#heartRateTable tbody');
  const labels = [];
  const values = [];

  tbody.innerHTML = "";

  data.bucket.forEach(bucket => {
    const date = new Date(Number(bucket.startTimeMillis));
    date.setDate(date.getDate() + 1); 
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
