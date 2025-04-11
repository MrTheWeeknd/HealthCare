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

