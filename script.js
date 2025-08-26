// Placeholder for future AuditCase API bridge
// In the future, replace the fetch URL with the real AuditCase endpoint

async function fetchAuditCase() {
  try {
    // Simulated data until AuditCase API is available
    const data = { message: 'Sample data from AuditCase placeholder' };
    document.getElementById('output').textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    document.getElementById('output').textContent = 'Error loading data';
  }
}

document.getElementById('load-btn').addEventListener('click', fetchAuditCase);
