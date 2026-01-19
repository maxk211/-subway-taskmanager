const express = require('express');
const db = require('../config/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Excel Export
router.get('/excel', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { start_date, end_date, store_id } = req.query;

    let query = `
      SELECT
        t.id,
        t.title,
        t.due_date,
        t.shift,
        t.status,
        t.completed_at,
        s.name as store_name,
        u.full_name as completed_by_name,
        tt.category
      FROM tasks t
      LEFT JOIN stores s ON t.store_id = s.id
      LEFT JOIN users u ON t.completed_by = u.id
      LEFT JOIN task_templates tt ON t.template_id = tt.id
      WHERE t.due_date BETWEEN ? AND ?
    `;

    const params = [start_date, end_date];

    if (store_id) {
      query += ' AND t.store_id = ?';
      params.push(store_id);
    } else if (req.user.role === 'manager') {
      query += ' AND t.store_id = ?';
      params.push(req.user.store_id);
    }

    query += ' ORDER BY t.due_date, s.name, t.shift';

    const tasks = await db.prepare(query).all(...params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Aufgaben Report');

    worksheet.columns = [
      { header: 'Store', key: 'store_name', width: 25 },
      { header: 'Datum', key: 'due_date', width: 12 },
      { header: 'Schicht', key: 'shift', width: 12 },
      { header: 'Aufgabe', key: 'title', width: 35 },
      { header: 'Kategorie', key: 'category', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Erledigt von', key: 'completed_by_name', width: 25 },
      { header: 'Erledigt am', key: 'completed_at', width: 20 }
    ];

    tasks.forEach(task => {
      worksheet.addRow({
        store_name: task.store_name,
        due_date: task.due_date,
        shift: task.shift === 'frueh' ? 'Frühschicht' : 'Spätschicht',
        title: task.title,
        category: task.category,
        status: task.status === 'completed' ? 'Erledigt' : task.status === 'pending' ? 'Ausstehend' : 'Übersprungen',
        completed_by_name: task.completed_by_name || '-',
        completed_at: task.completed_at || '-'
      });
    });

    // Styling
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=subway-report-${start_date}-${end_date}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

// PDF Export
router.get('/pdf', authMiddleware, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { start_date, end_date, store_id } = req.query;

    // Statistiken abrufen
    let storeCondition = '';
    const params = [start_date, end_date];

    if (store_id) {
      storeCondition = 'AND t.store_id = ?';
      params.push(store_id);
    } else if (req.user.role === 'manager') {
      storeCondition = 'AND t.store_id = ?';
      params.push(req.user.store_id);
    }

    const stats = await db.prepare(`
      SELECT
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
        ROUND(CAST(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100, 2) as completion_rate
      FROM tasks t
      WHERE t.due_date BETWEEN ? AND ?
      ${storeCondition}
    `).get(...params);

    const storeStats = await db.prepare(`
      SELECT
        s.name,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        ROUND(CAST(SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(t.id), 0) * 100, 2) as completion_rate
      FROM stores s
      LEFT JOIN tasks t ON s.id = t.store_id AND t.due_date BETWEEN ? AND ?
      ${store_id ? 'WHERE s.id = ?' : req.user.role === 'manager' ? 'WHERE s.id = ?' : ''}
      GROUP BY s.id
      ORDER BY s.name
    `).all(...(store_id ? [start_date, end_date, store_id] : req.user.role === 'manager' ? [start_date, end_date, req.user.store_id] : [start_date, end_date]));

    // PDF erstellen
    const doc = new PDFDocument();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=subway-report-${start_date}-${end_date}.pdf`);

    doc.pipe(res);

    // Titel
    doc.fontSize(20).text('Subway Taskmanager Report', { align: 'center' });
    doc.fontSize(12).text(`Zeitraum: ${start_date} bis ${end_date}`, { align: 'center' });
    doc.moveDown(2);

    // Gesamtstatistiken
    doc.fontSize(16).text('Gesamtstatistiken');
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Gesamt Aufgaben: ${stats.total_tasks}`);
    doc.text(`Erledigte Aufgaben: ${stats.completed_tasks}`);
    doc.text(`Ausstehende Aufgaben: ${stats.pending_tasks}`);
    doc.text(`Erledigungsrate: ${stats.completion_rate || 0}%`);
    doc.moveDown(2);

    // Store-Statistiken
    doc.fontSize(16).text('Statistiken pro Store');
    doc.moveDown(0.5);
    doc.fontSize(10);

    storeStats.forEach(store => {
      doc.text(`${store.name}:`);
      doc.text(`  Aufgaben: ${store.total_tasks} | Erledigt: ${store.completed_tasks} | Rate: ${store.completion_rate || 0}%`);
      doc.moveDown(0.3);
    });

    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ message: 'Serverfehler', error: error.message });
  }
});

module.exports = router;
