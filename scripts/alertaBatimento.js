let alertPlayed = false; // evita repetição

const alertAudio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'); // som de alerta

function checkHeartRateAlert(avgToday) {
    const threshold = parseInt(localStorage.getItem('bpmThreshold')) || 85;

    if (!alertPlayed && avgToday !== '-' && avgToday > threshold) {
        // Mensagem no modal
        document.getElementById('modalMessage').innerText =
            `Sua frequência cardíaca média de hoje está em ${avgToday} bpm, acima do limite de ${threshold} bpm!`;

        // Toca o som de alerta
        alertAudio.play();
        alertPlayed = true;

        // Exibe o modal
        const modal = document.getElementById('alertModal');
        if (modal) {
            modal.style.display = 'block';
        }

        // Notificação do navegador
        if (Notification.permission === "granted") {
            new Notification("⚠️ Alerta de batimento elevado", {
                body: `Sua média de batimentos está em ${avgToday} BPM.`,
            });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("⚠️ Alerta de batimento elevado", {
                        body: `Sua média de batimentos está em ${avgToday} BPM.`,
                    });
                }
            });
        }
    }
}
