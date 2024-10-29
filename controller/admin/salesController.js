const Order = require("../../model/user/userOrder");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");

const loadSales = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const query = {};

    const dateRange = calculateDateRange(reportType, startDate, endDate);
    if (dateRange.start && dateRange.end) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const orders = await Order.find(query)
      .populate("items.productId")
      .sort({ createdAt: -1 });

    const summary = calculateSummary(orders);

    res.render("salesReport", {
      orders,
      summary,
      reportType,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error("Error generating sales report:", error);
    res.status(500).send("Error generating report");
  }
};

const downloadPDF = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const query = {};
    const dateRange = calculateDateRange(reportType, startDate, endDate);

    if (dateRange.start && dateRange.end) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const orders = await Order.find(query)
      .populate("items.productId")
      .sort({ createdAt: -1 });

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf"
    );

    doc.pipe(res);
    generatePDFContent(doc, orders, calculateSummary(orders));
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Error generating PDF");
  }
};

const downloadExcel = async (req, res) => {
  try {
    const { reportType, startDate, endDate } = req.query;
    const query = {};
    const dateRange = calculateDateRange(reportType, startDate, endDate);

    if (dateRange.start && dateRange.end) {
      query.createdAt = {
        $gte: dateRange.start,
        $lte: dateRange.end,
      };
    }

    const orders = await Order.find(query)
      .populate("items.productId")
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    await generateExcelContent(workbook, orders, calculateSummary(orders));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx"
    );

    await workbook.xlsx.write(res);
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).send("Error generating Excel");
  }
};

function calculateDateRange(reportType, startDate, endDate) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (reportType) {
    case "daily":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "weekly":
      start.setDate(now.getDate() - now.getDay());
      end.setDate(start.getDate() + 6);
      break;
    case "monthly":
      start.setDate(1);
      end.setMonth(start.getMonth() + 1, 0);
      break;
    case "yearly":
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      break;
    case "custom":
      if (startDate && endDate) {
        return {
          start: new Date(startDate),
          end: new Date(endDate),
        };
      }
      break;
  }

  return { start, end };
}

function calculateSummary(orders) {
  return orders.reduce(
    (summary, order) => {
      summary.totalOrders++;
      summary.totalAmount += order.totalAmount;
      summary.totalDiscount += order.discountAmount || 0;
      return summary;
    },
    {
      totalOrders: 0,
      totalAmount: 0,
      totalDiscount: 0,
    }
  );
}

function generatePDFContent(doc, orders, summary) {
  doc.fontSize(20).text("Sales Report", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  const tableHeaders = [
    "Order ID",
    "Date",
    "Items",
    "Total Amount",
    "Discount",
  ];
  let yPosition = 150;

  tableHeaders.forEach((header, i) => {
    doc.text(header, 50 + i * 100, yPosition);
  });

  yPosition += 20;

  orders.forEach((order) => {
    if (yPosition > 700) {
      doc.addPage();
      yPosition = 50;
    }

    doc.text(order.orderId, 50, yPosition);
    doc.text(order.createdAt.toLocaleDateString(), 150, yPosition);
    doc.text(order.items.length.toString(), 250, yPosition);
    doc.text(order.totalAmount.toFixed(2), 350, yPosition);
    doc.text((order.discountAmount || 0).toFixed(2), 450, yPosition);

    yPosition += 20;
  });

  
  doc.moveDown(2);
  doc.fontSize(14).text("Summary");
  doc.fontSize(12);
  doc.text(`Total Orders: ${summary.totalOrders}`);
  doc.text(`Total Amount: ${summary.totalAmount.toFixed(2)}`);
  doc.text(`Total Discount: ${summary.totalDiscount.toFixed(2)}`);
}

async function generateExcelContent(workbook, orders, summary) {
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.columns = [
    { header: "Order ID", key: "orderId", width: 15 },
    { header: "Date", key: "date", width: 15 },
    { header: "Items", key: "items", width: 10 },
    { header: "Total Amount", key: "totalAmount", width: 15 },
    { header: "Discount", key: "discount", width: 15 },
  ];

  orders.forEach((order) => {
    worksheet.addRow({
      orderId: order.orderId,
      date: order.createdAt.toLocaleDateString(),
      items: order.items.length,
      totalAmount: order.totalAmount,
      discount: order.discountAmount || 0,
    });
  });


  worksheet.addRow([]);
  worksheet.addRow(["Summary"]);
  worksheet.addRow(["Total Orders", summary.totalOrders]);
  worksheet.addRow(["Total Amount", summary.totalAmount]);
  worksheet.addRow(["Total Discount", summary.totalDiscount]);
}

module.exports = {
  loadSales,
  downloadPDF,
  downloadExcel,
};
