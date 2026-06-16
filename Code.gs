const TEACHER_EMAIL = "gritsn.th@gmail.com";
const SHEET_NAME = "ผลแบบทดสอบวิชาสังคมศึกษา";
const SPREADSHEET_PROP_KEY = "SOCIAL_STUDIES_QUIZ_SPREADSHEET_ID";
const QUIZ_OPEN_PROP_KEY = "QUIZ_IS_OPEN";
const ADMIN_KEY = "1234";

function doGet(e) {
  const action = String(e.parameter.action || "").toLowerCase();
  const callback = e.parameter.callback || "callback";

  if (action === "status") {
    return jsonp(callback, { status: "success", open: getQuizOpenStatus() });
  }

  if (action === "setstatus") {
    const key = e.parameter.key || "";
    if (key !== ADMIN_KEY) {
      return jsonp(callback, { status: "error", message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const openText = String(e.parameter.open || "").toLowerCase();
    const open = openText === "true" || openText === "1" || openText === "open";
    setQuizOpenStatus(open);
    return jsonp(callback, {
      status: "success",
      open: open,
      message: open ? "เปิดให้ทำแบบทดสอบแล้ว" : "ปิดการทำแบบทดสอบแล้ว"
    });
  }

  return jsonp(callback, { status: "success", message: "Social Studies Quiz API", open: getQuizOpenStatus() });
}

function doPost(e) {
  try {
    if (!getQuizOpenStatus()) {
      return ContentService.createTextOutput(JSON.stringify({ status: "closed", message: "quiz closed" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(e.postData.contents || "{}");
    saveToSheet(data);
    sendEmailToTeacher(data);

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    MailApp.sendEmail({
      to: TEACHER_EMAIL,
      subject: "ระบบแบบทดสอบวิชาสังคมศึกษาเกิดข้อผิดพลาด",
      body: String(error)
    });

    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getQuizOpenStatus() {
  const props = PropertiesService.getScriptProperties();
  const value = props.getProperty(QUIZ_OPEN_PROP_KEY);
  if (value === null) {
    props.setProperty(QUIZ_OPEN_PROP_KEY, "true");
    return true;
  }
  return value === "true";
}

function setQuizOpenStatus(open) {
  PropertiesService.getScriptProperties().setProperty(QUIZ_OPEN_PROP_KEY, open ? "true" : "false");
}

function jsonp(callback, obj) {
  const safeCallback = String(callback).replace(/[^\w.$]/g, "") || "callback";
  return ContentService.createTextOutput(`${safeCallback}(${JSON.stringify(obj)});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getOrCreateSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty(SPREADSHEET_PROP_KEY);

  if (spreadsheetId) {
    try {
      return SpreadsheetApp.openById(spreadsheetId);
    } catch (err) {
      props.deleteProperty(SPREADSHEET_PROP_KEY);
    }
  }

  const ss = SpreadsheetApp.create("ผลแบบทดสอบวิชาสังคมศึกษา");
  props.setProperty(SPREADSHEET_PROP_KEY, ss.getId());
  return ss;
}

function saveToSheet(data) {
  const ss = getOrCreateSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["วันเวลาที่ส่ง", "ชื่อ-สกุล", "ห้อง", "เลขที่", "ชื่อแบบทดสอบ", "คะแนน", "คะแนนเต็ม", "เปอร์เซ็นต์", "จำนวนข้อผิด", "ข้อที่ผิด", "รายละเอียดทุกข้อ"]);
  }

  const wrongNumbers = (data.wrongAnswers || []).map(item => "ข้อ " + item.number).join(", ");
  const allDetails = (data.allAnswers || []).map(item => {
    return "ข้อ " + item.number + " | " + (item.isCorrect ? "ถูก" : "ผิด") +
      " | ตอบ: " + item.selectedLetter + ". " + item.selectedText +
      " | เฉลย: " + item.correctLetter + ". " + item.correctText;
  }).join("\n");

  sheet.appendRow([
    data.submittedAt || new Date(),
    data.name || "",
    data.room || "",
    data.studentNo || "",
    data.quizTitle || "",
    data.score,
    data.total,
    data.percent,
    (data.wrongAnswers || []).length,
    wrongNumbers || "ไม่มีข้อผิด",
    allDetails
  ]);
}

function sendEmailToTeacher(data) {
  const wrongHtml = buildWrongAnswersHtml(data.wrongAnswers || []);
  const allHtml = buildAllAnswersHtml(data.allAnswers || []);
  const sheetUrl = getOrCreateSpreadsheet().getUrl();

  const htmlBody = `
    <div style="font-family:Arial,'Sarabun',sans-serif;line-height:1.7;color:#1f2937;">
      <h2 style="color:#047857;">ผลการทำแบบทดสอบวิชาสังคมศึกษา</h2>
      <p>
        <b>ชื่อ-สกุล:</b> ${escapeHtml(data.name || "")}<br>
        <b>ห้อง:</b> ${escapeHtml(data.room || "")}<br>
        <b>เลขที่:</b> ${escapeHtml(data.studentNo || "")}<br>
        <b>เวลาส่ง:</b> ${escapeHtml(data.submittedAt || "")}
      </p>
      <div style="padding:14px 18px;background:#ecfdf5;border-left:6px solid #16a34a;border-radius:10px;margin:14px 0;">
        <b>คะแนน:</b> ${data.score}/${data.total}<br>
        <b>เปอร์เซ็นต์:</b> ${data.percent}%<br>
        <b>จำนวนข้อผิด:</b> ${(data.wrongAnswers || []).length} ข้อ<br>
        <b>Google Sheet:</b> <a href="${sheetUrl}">เปิดตารางผลคะแนน</a>
      </div>
      <h3 style="color:#dc2626;">ข้อที่ตอบผิด</h3>${wrongHtml}
      <h3 style="color:#047857;">รายละเอียดทุกข้อ</h3>${allHtml}
    </div>
  `;

  MailApp.sendEmail({
    to: TEACHER_EMAIL,
    subject: `ผลแบบทดสอบวิชาสังคมศึกษา: ${data.name || "นักเรียน"} ห้อง ${data.room || "-"} เลขที่ ${data.studentNo || "-"} (${data.score}/${data.total})`,
    htmlBody: htmlBody
  });
}

function buildWrongAnswersHtml(wrongAnswers) {
  if (!wrongAnswers.length) return `<p style="color:#047857;"><b>นักเรียนตอบถูกทุกข้อ</b></p>`;
  return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
    <tr style="background:#fee2e2;"><th>ข้อ</th><th>คำถาม</th><th>คำตอบนักเรียน</th><th>เฉลย</th></tr>
    ${wrongAnswers.map(item => `<tr><td>${item.number}</td><td>${escapeHtml(item.question)}</td><td>${escapeHtml(item.selectedLetter)}. ${escapeHtml(item.selectedText)}</td><td>${escapeHtml(item.correctLetter)}. ${escapeHtml(item.correctText)}</td></tr>`).join("")}
  </table>`;
}

function buildAllAnswersHtml(allAnswers) {
  return `<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;">
    <tr style="background:#dcfce7;"><th>ข้อ</th><th>ผล</th><th>คำตอบนักเรียน</th><th>เฉลย</th></tr>
    ${allAnswers.map(item => `<tr><td>${item.number}</td><td style="color:${item.isCorrect ? "#047857" : "#dc2626"};"><b>${item.isCorrect ? "ถูก" : "ผิด"}</b></td><td>${escapeHtml(item.selectedLetter)}. ${escapeHtml(item.selectedText)}</td><td>${escapeHtml(item.correctLetter)}. ${escapeHtml(item.correctText)}</td></tr>`).join("")}
  </table>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
