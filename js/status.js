(function () {
  var DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
  var WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  var SLOT = [
    ["09:00", "13:00"],
    ["14:30", "20:00"]
  ];

  var HOURS = {
    0: SLOT,
    1: SLOT,
    2: SLOT,
    3: [],
    4: SLOT,
    5: SLOT,
    6: SLOT
  };

  var CLOSED_DATES = [
    "2026-01-01",
    "2026-01-12",
    "2026-02-11",
    "2026-02-23",
    "2026-03-20",
    "2026-04-29",
    "2026-05-03",
    "2026-05-04",
    "2026-05-05",
    "2026-05-06",
    "2026-07-20",
    "2026-08-11",
    "2026-09-21",
    "2026-09-22",
    "2026-09-23",
    "2026-10-12",
    "2026-11-03",
    "2026-11-23",
    "2027-01-01",
    "2027-01-11",
    "2027-02-11",
    "2027-02-23",
    "2027-03-21",
    "2027-03-22",
    "2027-04-29",
    "2027-05-03",
    "2027-05-04",
    "2027-05-05",
    "2027-07-19",
    "2027-08-11",
    "2027-09-20",
    "2027-09-23",
    "2027-10-11",
    "2027-11-03",
    "2027-11-23"
  ];

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function keyOf(y, m, d) {
    return y + "-" + pad(m) + "-" + pad(d);
  }

  function weekdayOf(y, m, d) {
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  }

  function addDays(y, m, d, n) {
    var dt = new Date(Date.UTC(y, m - 1, d + n));
    return {
      y: dt.getUTCFullYear(),
      m: dt.getUTCMonth() + 1,
      d: dt.getUTCDate()
    };
  }

  function tokyoNow(date) {
    var parts = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      weekday: "short"
    }).formatToParts(date).forEach(function (part) {
      parts[part.type] = part.value;
    });
    return {
      y: Number(parts.year),
      m: Number(parts.month),
      d: Number(parts.day),
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
      weekday: WEEKDAY_INDEX[parts.weekday]
    };
  }

  function toMinutes(hhmm) {
    var bits = hhmm.split(":");
    return Number(bits[0]) * 60 + Number(bits[1]);
  }

  function formatTime(hhmm) {
    var bits = hhmm.split(":");
    return Number(bits[0]) + ":" + bits[1];
  }

  function formatRange(slot) {
    return formatTime(slot[0]) + "–" + formatTime(slot[1]);
  }

  function slotsFor(y, m, d) {
    if (CLOSED_DATES.indexOf(keyOf(y, m, d)) !== -1) return [];
    return HOURS[weekdayOf(y, m, d)] || [];
  }

  function currentStatus(now) {
    var slots = slotsFor(now.y, now.m, now.d);
    var i;
    for (i = 0; i < slots.length; i += 1) {
      if (now.minutes >= toMinutes(slots[i][0]) && now.minutes < toMinutes(slots[i][1])) {
        return { open: true, until: slots[i][1] };
      }
    }

    for (i = 0; i < 21; i += 1) {
      var day = addDays(now.y, now.m, now.d, i);
      var daySlots = slotsFor(day.y, day.m, day.d);
      var s;
      for (s = 0; s < daySlots.length; s += 1) {
        var startMin = toMinutes(daySlots[s][0]);
        if (i === 0 && startMin <= now.minutes) continue;
        return {
          open: false,
          when: i === 0 ? "本日" : DAY_LABELS[weekdayOf(day.y, day.m, day.d)] + "曜",
          time: daySlots[s][0]
        };
      }
    }

    return { open: false, when: "", time: "" };
  }

  function renderBanner() {
    var el = document.getElementById("status-banner");
    if (!el) return;
    var status = currentStatus(tokyoNow(new Date()));
    var dot = status.open ? "is-open" : "is-closed";
    var text = status.open
      ? "ただいま診療中｜本日 " + formatTime(status.until) + "まで"
      : "ただいま休診中｜次の診療：" + status.when + " " + formatTime(status.time) + "から";
    el.innerHTML =
      '<p class="status__line"><span class="status__dot ' + dot + '" aria-hidden="true"></span><span>' +
      text +
      "</span></p>";
  }

  function closedDayLabel() {
    var names = [];
    var d;
    for (d = 0; d < 7; d += 1) {
      if (!HOURS[d] || HOURS[d].length === 0) names.push(DAY_LABELS[d] + "曜");
    }
    names.push("祝日");
    return names.join("・") + "は休診";
  }

  function renderTable() {
    var table = document.getElementById("hours-table");
    if (!table) return;
    var order = [1, 2, 3, 4, 5, 6, 0];
    var head = "<tr><th scope=\"col\">診療時間</th>";
    order.forEach(function (d) {
      var closedHead = !HOURS[d] || HOURS[d].length === 0;
      head += "<th scope=\"col\"" + (closedHead ? " class=\"is-closed\"" : "") + ">" + DAY_LABELS[d] + "</th>";
    });
    head += "</tr>";

    var body = "";
    SLOT.forEach(function (slot) {
      body += "<tr><th scope=\"row\">" + formatRange(slot) + "</th>";
      order.forEach(function (d) {
        var open = (HOURS[d] || []).some(function (item) {
          return item[0] === slot[0] && item[1] === slot[1];
        });
        body += open
          ? '<td><span class="hours__mark" aria-label="診療">●</span></td>'
          : '<td class="is-closed"><span class="hours__off" aria-label="休診">休</span></td>';
      });
      body += "</tr>";
    });

    table.innerHTML = "<thead>" + head + "</thead><tbody>" + body + "</tbody>";

    var note = document.getElementById("hours-note");
    if (note) note.textContent = closedDayLabel() + "です。";
  }

  function renderSummary() {
    var el = document.getElementById("hours-summary");
    if (!el) return;
    var openDays = [];
    var d;
    for (d = 1; d <= 6; d += 1) {
      if (HOURS[d] && HOURS[d].length) openDays.push(DAY_LABELS[d]);
    }
    if (HOURS[0] && HOURS[0].length) openDays.push(DAY_LABELS[0]);
    var ranges = SLOT.map(formatRange).join(" / ");
    el.textContent = openDays.join("・") + " " + ranges + "　" + closedDayLabel();
  }

  function refresh() {
    renderBanner();
    renderTable();
    renderSummary();
  }

  refresh();
  window.setInterval(renderBanner, 60 * 1000);
})();
