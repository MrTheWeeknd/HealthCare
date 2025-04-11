const CLIENT_ID = '856832730537-rqc1lni9s73i2aq51ioida2djijhjl8b.apps.googleusercontent.com'; // Substitua pelo seu Client ID
let tokenClient;
let accessToken = null;

window.onload = () => {
  google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: handleCredentialResponse,
  });

  google.accounts.id.renderButton(
    document.getElementById("login"),
    { theme: "outline", size: "large" }
  );
};

function handleCredentialResponse(response) {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.heart_rate.read',
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById('login').style.display = 'none';
      document.getElementById('user-info').style.display = 'block';
      loadFitData();
    }
  });

  tokenClient.requestAccessToken();
}

function signOut() {
  google.accounts.id.disableAutoSelect();
  location.reload();
}

async function loadFitData() {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1); // 1º de janeiro do ano atual

    const body = {
      aggregateBy: [
        { dataTypeName: "com.google.step_count.delta" },
        { dataTypeName: "com.google.calories.expended" },
        { dataTypeName: "com.google.heart_rate.bpm" }
      ],
      bucketByTime: { durationMillis: 31536000000 }, // Duração: 1 ano em ms
      startTimeMillis: startOfYear.getTime(),
      endTimeMillis: now.getTime()
    };

    const response = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    const bucket = data.bucket?.[0];

    let steps = 0, calories = 0, heartRates = [];

    for (const dataset of bucket.dataset) {
      const type = dataset.dataSourceId || dataset.dataTypeName;

      if (type.includes("step_count")) {
        steps = dataset.point?.[0]?.value?.[0]?.intVal || 0;
      } else if (type.includes("calories")) {
        calories = dataset.point?.[0]?.value?.[0]?.fpVal?.toFixed(2) || 0;
      } else if (type.includes("heart_rate")) {
        dataset.point?.forEach(p => {
          heartRates.push(p.value?.[0]?.fpVal);
        });
      }
    }

    const avgHeartRate = heartRates.length
      ? (heartRates.reduce((a, b) => a + b, 0) / heartRates.length).toFixed(1)
      : "N/D";

    document.getElementById('fit-data').innerHTML = `
      <h3>Resumo do ano (${startOfYear.getFullYear()}):</h3>
      <p><strong>Passos:</strong> ${steps}</p>
      <p><strong>Calorias queimadas:</strong> ${calories} kcal</p>
      <p><strong>Batimentos cardíacos médios:</strong> ${avgHeartRate} bpm</p>
    `;
  } catch (error) {
    console.error('Erro ao buscar dados do Google Fit:', error);
    document.getElementById('fit-data').innerText = 'Erro ao carregar dados.';
  }
}