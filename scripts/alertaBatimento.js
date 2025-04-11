let alertPlayed = false; // evita repetição

const alertAudio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'); // som de alerta

function checkHeartRateAlert(avgToday) {
    const threshold = parseInt(localStorage.getItem('bpmThreshold')) || 85;
  
    if (!alertPlayed && avgToday !== '-' && avgToday > threshold) {
      // Mensagem no modal
      document.getElementById('modalMessage').innerText =
        `Sua frequência cardíaca média de hoje está em ${avgToday} bpm, acima do limite de ${threshold} bpm!`;
      
      // Exibe modal
      document.getElementById('alertModal').style.display = 'block';
  
      // Vibração (caso disponível)
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500]);
      }
  
      // Som de alerta
      alertAudio.play().catch(err => console.warn("Falha ao tocar som:", err));
  
      alertPlayed = true; // evita repetir
    }
  }
  
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('alertModal').style.display = 'none';
  });