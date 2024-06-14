const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const mysql = require('mysql2');
const PDFDocument = require('pdfkit');
const fs = require('fs');

let mainWindow;
let latestAllShiftsPdfPath = '';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

function insertShiftToDatabase(shiftData, callback) {
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'worker_shifts'
  });

  connection.connect();

  const query = `
    INSERT INTO shift_schedules (workerName, client_name, shift_location, date, start_time, end_time, company, working_with_1, working_with_2) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    shiftData.workerName,
    shiftData.client,
    shiftData.location,
    shiftData.date,
    shiftData.timeFrom,
    shiftData.timeUntil,
    shiftData.company,
    shiftData.workingWith,
    shiftData.workingWith2
  ];

  connection.query(query, values, (error, results) => {
    if (error) {
      console.error('Error inserting data into database:', error);
      callback(false);
      return;
    }
    callback(true);
  });

  connection.end();
}

ipcMain.on('add-shift', (event, shiftData) => {
  insertShiftToDatabase(shiftData, (success) => {
    if (success) {
      event.reply('shift-added', 'Shift successfully added to the database.');
    } else {
      event.reply('shift-add-error', 'Error adding shift to the database.');
    }
  });
});

ipcMain.on('create-shift-pdf', (event, shifts) => {
  dialog.showSaveDialog({
    title: 'Save All Shifts PDF',
    defaultPath: 'shift-details.pdf',
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  }).then(({ filePath }) => {
    if (filePath) {
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filePath));

      shifts.forEach((shift, index) => {
        if (index > 0) {
          doc.addPage();
        }
        doc.fontSize(12).text(`Worker: ${shift.workerName}`);
        doc.text(`Date: ${shift.date}`);
        doc.text(`Time From: ${shift.timeFrom}`);
        doc.text(`Time Until: ${shift.timeUntil}`);
        doc.text(`Company: ${shift.company}`);
        doc.text(`Client: ${shift.client}`);
        doc.text(`Location: ${shift.location}`);
        doc.text(`Working With: ${shift.workingWith}`);
        doc.text(`Working With 2: ${shift.workingWith2}`);
      });

      doc.end();

      event.reply('shift-pdf-created', { allShiftsPdfPath: `file://${filePath}`, workerPdfPath: `file://${filePath}` });
    }
  });
});
