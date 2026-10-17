const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};
const toTime = (n) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;


function generateSlots({ startTime, endTime, slotMinutes }) {
  const slots = [];
  for (let s = toMinutes(startTime); s + slotMinutes <= toMinutes(endTime); s += slotMinutes) {
    slots.push({ start: toTime(s), end: toTime(s + slotMinutes) });
  }
  return slots;
}

const isValidDate = (d) =>
  typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(new Date(`${d}T00:00:00Z`).getTime());


const dayOfWeek = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

const todayUTC = () => new Date().toISOString().slice(0, 10);


function upcomingDates(start, count) {
  const base = new Date(`${start}T00:00:00Z`).getTime();
  return Array.from({ length: count }, (_, i) => new Date(base + i * 86400000).toISOString().slice(0, 10));
}


function findNextAvailable(dates, ruleFor, takenFor) {
  for (const date of dates) {
    const rule = ruleFor(date);
    if (!rule) continue;
    const taken = takenFor(date);
    if (generateSlots(rule).some((s) => !taken.has(s.start))) return date;
  }
  return null;
}

module.exports = { generateSlots, isValidDate, dayOfWeek, todayUTC, upcomingDates, findNextAvailable };