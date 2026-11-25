/**
 * OB Livestreaming Club — Event Registration Backend (Google Apps Script)
 * Sheets: Users, Events, Registrations
 * Script Properties Required:
 *   - LINE_CHANNEL_ID: Your LINE Login Channel ID
 */

var SHEET_NAMES = {
  USERS: 'Users',
  EVENTS: 'Events',
  REGISTRATIONS: 'Registrations',
};

var HEADERS = {
  Users: [
    'lineUserId',
    'fullName',
    'nickname',
    'studentId',
    'phone',
    'email',
    'role',
    'createdAt',
    'updatedAt',
  ],
  Events: [
    'eventId',
    'title',
    'date',
    'startTime',
    'endTime',
    'location',
    'description',
    'autoRemind',
    'lineGroupUrl',
    'status',
  ],
  Registrations: [
    'regId',
    'eventId',
    'lineUserId',
    'registeredAt',
    'reminderSent',
  ],
};

var ALLOWED_ROLES = ['กรรมการ', 'ที่ปรึกษา', 'สมาชิกชมรม'];
var TIMEZONE = 'Asia/Bangkok';

/**
 * One-click setup function: Run once from Apps Script Editor to create all 3 sheets.
 */
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.keys(HEADERS).forEach(function (sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    var headers = HEADERS[sheetName];
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange
      .setFontWeight('bold')
      .setBackground('#18181b')
      .setFontColor('#f4f4f5');
    sheet.setFrozenRows(1);

    // Format text-sensitive columns as plain text to preserve leading zeros & YYYY-MM-DD
    if (sheetName === SHEET_NAMES.USERS) {
      sheet.getRange('D:E').setNumberFormat('@');
    } else if (sheetName === SHEET_NAMES.EVENTS) {
      sheet.getRange('C:E').setNumberFormat('@');
    }
  });
}

function doGet() {
  return jsonResponse_({
    ok: true,
    data: {
      service: 'OB Livestreaming Event API',
      status: 'online',
      timestamp: new Date().toISOString(),
    },
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse_({
        ok: false,
        code: 'BAD_REQUEST',
        error: 'ไม่พบข้อมูลคำขอ (Empty request body)',
      });
    }

    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var idToken = body.idToken;

    if (!action || !idToken) {
      return jsonResponse_({
        ok: false,
        code: 'UNAUTHORIZED',
        error: 'กรุณาเข้าสู่ระบบผ่าน LINE ใหม่อีกครั้ง',
      });
    }

    var verifiedUser = verifyLineIdToken_(idToken);
    var lineUserId = verifiedUser.sub;

    switch (action) {
      case 'bootstrap':
        return jsonResponse_({
          ok: true,
          data: handleBootstrap_(lineUserId),
        });

      case 'registerUser':
        return withScriptLock_(function () {
          return jsonResponse_({
            ok: true,
            data: handleRegisterUser_(lineUserId, body.profile || {}),
          });
        });

      case 'updateProfile':
        return withScriptLock_(function () {
          return jsonResponse_({
            ok: true,
            data: handleUpdateProfile_(lineUserId, body.profile || {}),
          });
        });

      case 'registerEvent':
        return withScriptLock_(function () {
          return jsonResponse_({
            ok: true,
            data: handleRegisterEvent_(lineUserId, body.eventId),
          });
        });

      case 'cancelRegistration':
        return withScriptLock_(function () {
          return jsonResponse_({
            ok: true,
            data: handleCancelRegistration_(lineUserId, body.eventId),
          });
        });

      default:
        return jsonResponse_({
          ok: false,
          code: 'UNKNOWN_ACTION',
          error: 'ไม่รองรับคำสั่ง: ' + action,
        });
    }
  } catch (err) {
    return jsonResponse_({
      ok: false,
      code: err.code || 'INTERNAL_ERROR',
      error: err.message || 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์',
    });
  }
}

/**
 * Time-driven Trigger function:
 * Sends reminder emails 1 day before events with autoRemind = TRUE.
 */
function sendScheduledReminders() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var eventsSheet = ss.getSheetByName(SHEET_NAMES.EVENTS);
    var usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
    var regSheet = ss.getSheetByName(SHEET_NAMES.REGISTRATIONS);

    if (!eventsSheet || !usersSheet || !regSheet) return;

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var tomorrowStr = Utilities.formatDate(tomorrow, TIMEZONE, 'yyyy-MM-dd');

    var events = getSheetObjects_(eventsSheet, normalizeEventRow_);
    var targetEventsById = {};
    events.forEach(function (ev) {
      if (
        ev.autoRemind === true &&
        ev.status === 'OPEN' &&
        ev.date === tomorrowStr
      ) {
        targetEventsById[ev.eventId] = ev;
      }
    });

    if (Object.keys(targetEventsById).length === 0) return;

    var users = getSheetObjects_(usersSheet, normalizeUserRow_);
    var usersById = {};
    users.forEach(function (u) {
      usersById[u.lineUserId] = u;
    });

    var regData = regSheet.getDataRange().getValues();
    if (regData.length <= 1) return;

    var headers = regData[0];
    var colIdx = indexMap_(headers);

    for (var r = 1; r < regData.length; r++) {
      var row = regData[r];
      var eventId = String(row[colIdx.eventId] || '').trim();
      var lineUserId = String(row[colIdx.lineUserId] || '').trim();
      var reminderSent = parseBoolean_(row[colIdx.reminderSent]);

      if (reminderSent || !targetEventsById[eventId]) continue;

      var user = usersById[lineUserId];
      var event = targetEventsById[eventId];
      if (!user || !user.email) continue;

      try {
        sendReminderEmail_(user, event);
        regSheet.getRange(r + 1, colIdx.reminderSent + 1).setValue(true);
      } catch (mailErr) {
        Logger.log('Failed reminder email to ' + user.email + ': ' + mailErr);
      }
    }
  } finally {
    lock.releaseLock();
  }
}

/* ==========================================================================
   Action Handlers
   ========================================================================== */

function handleBootstrap_(lineUserId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = getRequiredSheet_(ss, SHEET_NAMES.USERS);
  var eventsSheet = getRequiredSheet_(ss, SHEET_NAMES.EVENTS);
  var regSheet = getRequiredSheet_(ss, SHEET_NAMES.REGISTRATIONS);

  var users = getSheetObjects_(usersSheet, normalizeUserRow_);
  var currentUser = null;
  for (var i = 0; i < users.length; i++) {
    if (users[i].lineUserId === lineUserId) {
      currentUser = users[i];
      break;
    }
  }

  var events = getSheetObjects_(eventsSheet, normalizeEventRow_);
  var allRegs = getSheetObjects_(regSheet, normalizeRegRow_);
  var myRegs = allRegs.filter(function (reg) {
    return reg.lineUserId === lineUserId;
  });

  return {
    user: currentUser,
    events: events,
    registrations: myRegs,
  };
}

function handleRegisterUser_(lineUserId, profile) {
  validateProfilePayload_(profile);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = getRequiredSheet_(ss, SHEET_NAMES.USERS);
  var existing = findRowByColumn_(usersSheet, 'lineUserId', lineUserId);
  if (existing) {
    throw createError_('พบข้อมูลสมาชิกในระบบแล้ว', 'USER_EXISTS');
  }

  var nowIso = new Date().toISOString();
  var newUser = {
    lineUserId: lineUserId,
    fullName: String(profile.fullName).trim(),
    nickname: String(profile.nickname).trim(),
    studentId: String(profile.studentId).trim(),
    phone: String(profile.phone).trim(),
    email: String(profile.email).trim().toLowerCase(),
    role: String(profile.role).trim(),
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  usersSheet.appendRow(HEADERS.Users.map(function (h) {
    return newUser[h];
  }));

  return { user: newUser };
}

function handleUpdateProfile_(lineUserId, profile) {
  validateProfilePayload_(profile);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = getRequiredSheet_(ss, SHEET_NAMES.USERS);
  var found = findRowByColumn_(usersSheet, 'lineUserId', lineUserId);
  if (!found) {
    throw createError_('ไม่พบข้อมูลผู้ใช้ในระบบ', 'USER_NOT_FOUND');
  }

  var nowIso = new Date().toISOString();
  var colIdx = found.colIdx;
  var rowNum = found.rowIndex;
  var existingObj = normalizeUserRow_(found.rowValues, colIdx);

  var updatedUser = {
    lineUserId: lineUserId,
    fullName: String(profile.fullName).trim(),
    nickname: String(profile.nickname).trim(),
    studentId: String(profile.studentId).trim(),
    phone: String(profile.phone).trim(),
    email: String(profile.email).trim().toLowerCase(),
    role: String(profile.role).trim(),
    createdAt: existingObj.createdAt || nowIso,
    updatedAt: nowIso,
  };

  var rowArray = HEADERS.Users.map(function (h) {
    return updatedUser[h];
  });
  usersSheet.getRange(rowNum, 1, 1, rowArray.length).setValues([rowArray]);

  return { user: updatedUser };
}

function handleRegisterEvent_(lineUserId, eventId) {
  var targetEventId = String(eventId || '').trim();
  if (!targetEventId) {
    throw createError_('กรุณาระบุรหัสกิจกรรม', 'INVALID_EVENT_ID');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var usersSheet = getRequiredSheet_(ss, SHEET_NAMES.USERS);
  var eventsSheet = getRequiredSheet_(ss, SHEET_NAMES.EVENTS);
  var regSheet = getRequiredSheet_(ss, SHEET_NAMES.REGISTRATIONS);

  var userRow = findRowByColumn_(usersSheet, 'lineUserId', lineUserId);
  if (!userRow) {
    throw createError_('กรุณากรอกข้อมูลส่วนตัวก่อนลงทะเบียนกิจกรรม', 'USER_NOT_FOUND');
  }
  var user = normalizeUserRow_(userRow.rowValues, userRow.colIdx);

  var eventRow = findRowByColumn_(eventsSheet, 'eventId', targetEventId);
  if (!eventRow) {
    throw createError_('ไม่พบกิจกรรมที่เลือกในระบบ', 'EVENT_NOT_FOUND');
  }
  var event = normalizeEventRow_(eventRow.rowValues, eventRow.colIdx);

  if (event.status !== 'OPEN') {
    throw createError_('กิจกรรมนี้ปิดรับสมัครแล้ว', 'EVENT_CLOSED');
  }

  var allRegs = getSheetObjects_(regSheet, normalizeRegRow_);
  var duplicate = allRegs.some(function (r) {
    return r.eventId === targetEventId && r.lineUserId === lineUserId;
  });
  if (duplicate) {
    throw createError_('คุณได้ลงทะเบียนกิจกรรมนี้ไปแล้ว', 'ALREADY_REGISTERED');
  }

  var regRecord = {
    regId: 'REG-' + Utilities.getUuid().slice(0, 8).toUpperCase(),
    eventId: targetEventId,
    lineUserId: lineUserId,
    registeredAt: new Date().toISOString(),
    reminderSent: false,
  };

  regSheet.appendRow(HEADERS.Registrations.map(function (h) {
    return regRecord[h];
  }));

  var emailSent = false;
  if (user.email) {
    try {
      sendRegistrationConfirmationEmail_(user, event);
      emailSent = true;
    } catch (mailErr) {
      Logger.log('Confirmation email failed: ' + mailErr);
    }
  }

  return {
    registration: regRecord,
    emailSent: emailSent,
  };
}

function handleCancelRegistration_(lineUserId, eventId) {
  var targetEventId = String(eventId || '').trim();
  if (!targetEventId) {
    throw createError_('กรุณาระบุรหัสกิจกรรม', 'INVALID_EVENT_ID');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var regSheet = getRequiredSheet_(ss, SHEET_NAMES.REGISTRATIONS);
  var data = regSheet.getDataRange().getValues();
  if (data.length <= 1) {
    throw createError_('ไม่พบประวัติการลงทะเบียน', 'REG_NOT_FOUND');
  }

  var colIdx = indexMap_(data[0]);
  for (var r = data.length - 1; r >= 1; r--) {
    var rowEventId = String(data[r][colIdx.eventId] || '').trim();
    var rowUserId = String(data[r][colIdx.lineUserId] || '').trim();
    if (rowEventId === targetEventId && rowUserId === lineUserId) {
      regSheet.deleteRow(r + 1);
      return { cancelledEventId: targetEventId };
    }
  }

  throw createError_('ไม่พบประวัติการลงทะเบียนสำหรับกิจกรรมนี้', 'REG_NOT_FOUND');
}

/* ==========================================================================
   LINE Token Verification & Email / ICS Generation
   ========================================================================== */

function verifyLineIdToken_(idToken) {
  var channelId = PropertiesService.getScriptProperties().getProperty('LINE_CHANNEL_ID');
  if (!channelId) {
    throw createError_(
      'ยังไม่ได้ตั้งค่า LINE_CHANNEL_ID ใน Script Properties',
      'SERVER_CONFIG_ERROR'
    );
  }

  var res = UrlFetchApp.fetch('https://api.line.me/oauth2/v2.1/verify', {
    method: 'post',
    payload: {
      id_token: idToken,
      client_id: channelId,
    },
    muteHttpExceptions: true,
  });

  var code = res.getResponseCode();
  var payload = JSON.parse(res.getContentText() || '{}');

  if (code !== 200 || !payload.sub) {
    throw createError_(
      'การยืนยันตัวตน LINE หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่',
      'INVALID_LINE_TOKEN'
    );
  }

  return payload;
}

function sendRegistrationConfirmationEmail_(user, event) {
  var subject = '[OB Livestreaming] ยืนยันการลงทะเบียน: ' + event.title;
  var lineGroupSection = event.lineGroupUrl
    ? '\nลิงก์เข้ากลุ่ม LINE ของงานนี้:\n' + event.lineGroupUrl + '\n'
    : '';

  var plainBody =
    'สวัสดีคุณ ' + user.nickname + ' (' + user.fullName + '),\n\n' +
    'คุณได้ลงทะเบียนเข้าร่วมกิจกรรมของชมรม OB Livestreaming เรียบร้อยแล้ว\n\n' +
    'รายละเอียดกิจกรรม:\n' +
    '- ชื่องาน: ' + event.title + ' (' + event.eventId + ')\n' +
    '- วันที่: ' + event.date + '\n' +
    '- เวลา: ' + event.startTime + ' - ' + event.endTime + ' น.\n' +
    '- สถานที่: ' + (event.location || '-') + '\n' +
    '- รายละเอียด: ' + (event.description || '-') + '\n' +
    lineGroupSection +
    '\nเราได้แนบไฟล์ปฏิทิน (.ics) มาพร้อมอีเมลนี้เพื่อให้คุณเพิ่มลงใน Google Calendar ได้ทันที\n\n' +
    'OB Livestreaming Club';

  var htmlBody =
    '<div style="font-family:sans-serif;max-width:560px;margin:auto;background:#09090b;color:#f4f4f5;padding:24px;border-radius:12px;border:1px solid #27272a;">' +
    '<div style="display:inline-block;background:#dc2626;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:1px;">OB LIVESTREAMING</div>' +
    '<h2 style="margin:16px 0 8px;color:#ffffff;">ยืนยันการลงทะเบียนกิจกรรม</h2>' +
    '<p style="color:#a1a1aa;margin:0 0 16px;">สวัสดีคุณ <strong style="color:#fff;">' + escapeHtml_(user.nickname) + '</strong> (' + escapeHtml_(user.fullName) + ')</p>' +
    '<div style="background:#18181b;padding:16px;border-radius:10px;border:1px solid #27272a;margin-bottom:16px;">' +
    '<p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#ffffff;">' + escapeHtml_(event.title) + '</p>' +
    '<p style="margin:4px 0;color:#d4d4d8;">📅 วันที่: ' + escapeHtml_(event.date) + '</p>' +
    '<p style="margin:4px 0;color:#d4d4d8;">⏰ เวลา: ' + escapeHtml_(event.startTime) + ' - ' + escapeHtml_(event.endTime) + ' น.</p>' +
    '<p style="margin:4px 0;color:#d4d4d8;">📍 สถานที่: ' + escapeHtml_(event.location || '-') + '</p>' +
    (event.description ? '<p style="margin:10px 0 0;color:#a1a1aa;font-size:13px;">' + escapeHtml_(event.description) + '</p>' : '') +
    '</div>' +
    (event.lineGroupUrl
      ? '<p style="margin:0 0 16px;"><a href="' + escapeHtml_(event.lineGroupUrl) + '" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px;">เข้าร่วมกลุ่ม LINE ของงานนี้</a></p>'
      : '') +
    '<p style="color:#71717a;font-size:12px;margin:0;">ไฟล์ปฏิทิน (.ics) ถูกแนบมากับอีเมลฉบับนี้แล้ว</p>' +
    '</div>';

  var icsContent = buildIcsContent_(event);
  var icsBlob = Utilities.newBlob(
    icsContent,
    'text/calendar; charset=utf-8',
    event.eventId + '.ics'
  );

  GmailApp.sendEmail(user.email, subject, plainBody, {
    htmlBody: htmlBody,
    attachments: [icsBlob],
    name: 'OB Livestreaming Club',
  });
}

function sendReminderEmail_(user, event) {
  var subject = '[OB Livestreaming] แจ้งเตือนพรุ่งนี้มีงาน: ' + event.title;
  var lineGroupSection = event.lineGroupUrl
    ? '\nลิงก์กลุ่ม LINE ของงาน:\n' + event.lineGroupUrl + '\n'
    : '';

  var plainBody =
    'สวัสดีคุณ ' + user.nickname + ',\n\n' +
    'แจ้งเตือนล่วงหน้า 1 วันสำหรับกิจกรรมที่คุณลงทะเบียนไว้:\n' +
    '- งาน: ' + event.title + ' (' + event.eventId + ')\n' +
    '- วันที่: ' + event.date + '\n' +
    '- เวลา: ' + event.startTime + ' - ' + event.endTime + ' น.\n' +
    '- สถานที่: ' + (event.location || '-') + '\n' +
    lineGroupSection +
    '\nเตรียมอุปกรณ์ให้พร้อม แล้วเจอกันครับ!\nOB Livestreaming Club';

  var htmlBody =
    '<div style="font-family:sans-serif;max-width:560px;margin:auto;background:#09090b;color:#f4f4f5;padding:24px;border-radius:12px;border:1px solid #27272a;">' +
    '<div style="display:inline-block;background:#dc2626;color:#fff;font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;">REMINDER • พรุ่งนี้</div>' +
    '<h2 style="margin:16px 0 8px;color:#ffffff;">' + escapeHtml_(event.title) + '</h2>' +
    '<p style="color:#a1a1aa;margin:0 0 16px;">สวัสดีคุณ <strong style="color:#fff;">' + escapeHtml_(user.nickname) + '</strong> พรุ่งนี้คุณมีนัดหมายกับทีม OB Livestreaming</p>' +
    '<div style="background:#18181b;padding:16px;border-radius:10px;border:1px solid #27272a;margin-bottom:16px;">' +
    '<p style="margin:4px 0;color:#d4d4d8;">📅 วันที่: ' + escapeHtml_(event.date) + '</p>' +
    '<p style="margin:4px 0;color:#d4d4d8;">⏰ เวลา: ' + escapeHtml_(event.startTime) + ' - ' + escapeHtml_(event.endTime) + ' น.</p>' +
    '<p style="margin:4px 0;color:#d4d4d8;">📍 สถานที่: ' + escapeHtml_(event.location || '-') + '</p>' +
    '</div>' +
    (event.lineGroupUrl
      ? '<p style="margin:0;"><a href="' + escapeHtml_(event.lineGroupUrl) + '" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px;">เปิดกลุ่ม LINE ของงาน</a></p>'
      : '') +
    '</div>';

  GmailApp.sendEmail(user.email, subject, plainBody, {
    htmlBody: htmlBody,
    name: 'OB Livestreaming Club',
  });
}

function buildIcsContent_(event) {
  var dateDigits = String(event.date || '').replace(/-/g, '');
  var startDigits = String(event.startTime || '09:00').replace(/:/g, '').slice(0, 4) + '00';
  var endDigits = String(event.endTime || '12:00').replace(/:/g, '').slice(0, 4) + '00';
  var nowUtc = Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'");

  var descParts = [];
  if (event.description) descParts.push(event.description);
  if (event.lineGroupUrl) descParts.push('กลุ่ม LINE: ' + event.lineGroupUrl);
  var description = descParts.join('\\n');

  var lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OB Livestreaming Club//Event Registration//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + event.eventId + '@oblivestreaming.club',
    'DTSTAMP:' + nowUtc,
    'DTSTART;TZID=Asia/Bangkok:' + dateDigits + 'T' + startDigits,
    'DTEND;TZID=Asia/Bangkok:' + dateDigits + 'T' + endDigits,
    'SUMMARY:' + escapeIcsText_(event.title),
    'LOCATION:' + escapeIcsText_(event.location || ''),
    'DESCRIPTION:' + escapeIcsText_(description),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

/* ==========================================================================
   Helpers & Validators
   ========================================================================== */

function validateProfilePayload_(profile) {
  if (!profile.fullName || String(profile.fullName).trim().length < 2) {
    throw createError_('กรุณากรอกชื่อ-นามสกุลให้ถูกต้อง', 'VALIDATION_ERROR');
  }
  if (!profile.nickname || !String(profile.nickname).trim()) {
    throw createError_('กรุณากรอกชื่อเล่น', 'VALIDATION_ERROR');
  }
  if (!profile.studentId || !String(profile.studentId).trim()) {
    throw createError_('กรุณากรอกรหัสนักศึกษา', 'VALIDATION_ERROR');
  }
  if (!profile.phone || !/^0\d{8,9}$/.test(String(profile.phone).replace(/[\s-]/g, ''))) {
    throw createError_('กรุณากรอกเบอร์โทรศัพท์ 9-10 หลักให้ถูกต้อง', 'VALIDATION_ERROR');
  }
  var email = String(profile.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email)) {
    throw createError_('กรุณาใช้อีเมล Gmail (@gmail.com) เท่านั้น', 'VALIDATION_ERROR');
  }
  if (ALLOWED_ROLES.indexOf(String(profile.role || '').trim()) === -1) {
    throw createError_('ตำแหน่งในชมรมไม่ถูกต้อง', 'VALIDATION_ERROR');
  }
}

function withScriptLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function getRequiredSheet_(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw createError_(
      'ไม่พบชีท "' + name + '" กรุณารันฟังก์ชัน setupSheets() ใน Apps Script ก่อน',
      'SHEET_MISSING'
    );
  }
  return sheet;
}

function getSheetObjects_(sheet, normalizer) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var colIdx = indexMap_(values[0]);
  var items = [];
  for (var i = 1; i < values.length; i++) {
    if (values[i].join('') === '') continue;
    items.push(normalizer(values[i], colIdx));
  }
  return items;
}

function findRowByColumn_(sheet, colName, targetValue) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return null;
  var colIdx = indexMap_(values[0]);
  var targetIdx = colIdx[colName];
  if (targetIdx === undefined) return null;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][targetIdx] || '').trim() === targetValue) {
      return {
        rowIndex: i + 1,
        colIdx: colIdx,
        rowValues: values[i],
      };
    }
  }
  return null;
}

function indexMap_(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    map[String(headers[i]).trim()] = i;
  }
  return map;
}

function normalizeUserRow_(row, colIdx) {
  return {
    lineUserId: String(row[colIdx.lineUserId] || '').trim(),
    fullName: String(row[colIdx.fullName] || '').trim(),
    nickname: String(row[colIdx.nickname] || '').trim(),
    studentId: String(row[colIdx.studentId] || '').trim(),
    phone: String(row[colIdx.phone] || '').trim(),
    email: String(row[colIdx.email] || '').trim().toLowerCase(),
    role: String(row[colIdx.role] || '').trim(),
    createdAt: formatIso_(row[colIdx.createdAt]),
    updatedAt: formatIso_(row[colIdx.updatedAt]),
  };
}

function normalizeEventRow_(row, colIdx) {
  return {
    eventId: String(row[colIdx.eventId] || '').trim(),
    title: String(row[colIdx.title] || '').trim(),
    date: formatSheetDate_(row[colIdx.date]),
    startTime: formatSheetTime_(row[colIdx.startTime]),
    endTime: formatSheetTime_(row[colIdx.endTime]),
    location: String(row[colIdx.location] || '').trim(),
    description: String(row[colIdx.description] || '').trim(),
    autoRemind: parseBoolean_(row[colIdx.autoRemind]),
    lineGroupUrl: String(row[colIdx.lineGroupUrl] || '').trim(),
    status: String(row[colIdx.status] || 'OPEN').trim().toUpperCase(),
  };
}

function normalizeRegRow_(row, colIdx) {
  return {
    regId: String(row[colIdx.regId] || '').trim(),
    eventId: String(row[colIdx.eventId] || '').trim(),
    lineUserId: String(row[colIdx.lineUserId] || '').trim(),
    registeredAt: formatIso_(row[colIdx.registeredAt]),
    reminderSent: parseBoolean_(row[colIdx.reminderSent]),
  };
}

function formatSheetDate_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, TIMEZONE, 'yyyy-MM-dd');
  }
  return String(val).trim();
}

function formatSheetTime_(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, TIMEZONE, 'HH:mm');
  }
  return String(val).trim();
}

function formatIso_(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString();
  return String(val).trim();
}

function parseBoolean_(val) {
  if (typeof val === 'boolean') return val;
  return String(val || '').trim().toUpperCase() === 'TRUE';
}

function escapeIcsText_(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function escapeHtml_(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createError_(message, code) {
  var err = new Error(message);
  err.code = code;
  return err;
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
