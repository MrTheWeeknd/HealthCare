document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sideMenu').classList.toggle('open');
    document.getElementById('menuToggle').classList.toggle('active');
  });
  
  const savedThreshold = localStorage.getItem('bpmThreshold');
  if (savedThreshold) {
    document.getElementById('bpmThreshold').value = savedThreshold;
  }
  
  
  document.getElementById('saveContactBtn').addEventListener('click', () => {
    emergencyContact = document.getElementById('emergencyInput').value.trim();
    const bpmThreshold = document.getElementById('bpmThreshold').value;
    localStorage.setItem('emergencyContact', emergencyContact);
    localStorage.setItem('bpmThreshold', bpmThreshold);
    alert('Informações salvas com sucesso!');
  });