document.addEventListener('DOMContentLoaded', () => {
  const shiftForm = document.getElementById('shift-form');
  const submitButton = shiftForm.querySelector('input[type="submit"]');
  const addShiftButton = document.getElementById('add-shift');
  const resetButton = document.getElementById('reset-form');
  const generatePdfButton = document.getElementById('generate-pdf');
  const shiftsTable = document.getElementById('shifts-table').querySelector('tbody');
  const pdfLinkContainer = document.getElementById('pdf-link-container');
  let shiftsToBeAdded = [];

  function resetForm() {
    shiftForm.reset();
    submitButton.value = 'Submit';
  }

  function handleFormSubmit(event) {
    event.preventDefault();

    const formData = new FormData(shiftForm);
    const shiftData = {
      workerName: formData.get('workerName'),
      date: formData.get('date'),
      timeFrom: formData.get('timeFrom'),
      timeUntil: formData.get('timeUntil'),
      company: formData.get('company'),
      client: formData.get('client'),
      location: formData.get('location'),
      workingWith: formData.get('workingWith'),
      workingWith2: formData.get('workingWith2')
    };

    shiftsToBeAdded.push(shiftData);
    updateShiftsTable();
    resetForm();
  }

  function updateShiftsTable() {
    shiftsTable.innerHTML = '';

    shiftsToBeAdded.forEach((shift, index) => {
      const row = document.createElement('tr');

      Object.values(shift).forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });

      const actionsCell = document.createElement('td');
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.classList.add('btn', 'red');
      deleteButton.addEventListener('click', () => {
        shiftsToBeAdded.splice(index, 1);
        updateShiftsTable();
      });
      actionsCell.appendChild(deleteButton);
      row.appendChild(actionsCell);

      shiftsTable.appendChild(row);
    });
  }

  function handleGeneratePdf() {
    window.api.send('create-shift-pdf', shiftsToBeAdded);
  }

  shiftForm.addEventListener('submit', handleFormSubmit);
  addShiftButton.addEventListener('click', handleFormSubmit);
  resetButton.addEventListener('click', resetForm);
  generatePdfButton.addEventListener('click', handleGeneratePdf);

  window.api.receive('shift-pdf-created', (paths) => {
    const { allShiftsPdfPath, workerPdfPath } = paths;

    const linkContainer = document.createElement('div');
    
    const allShiftsLink = document.createElement('a');
    allShiftsLink.href = allShiftsPdfPath;
    allShiftsLink.textContent = 'Download All Shifts PDF';
    allShiftsLink.classList.add('btn', 'green');
    linkContainer.appendChild(allShiftsLink);

    const workerLink = document.createElement('a');
    workerLink.href = workerPdfPath;
    workerLink.textContent = 'Download Worker Shifts PDF';
    workerLink.classList.add('btn', 'blue');
    linkContainer.appendChild(workerLink);

    pdfLinkContainer.innerHTML = '';
    pdfLinkContainer.appendChild(linkContainer);
  });

  window.api.receive('shift-added', (message) => {
    alert(message);
    resetForm();
  });

  window.api.receive('shift-add-error', (message) => {
    alert(message);
  });
});
