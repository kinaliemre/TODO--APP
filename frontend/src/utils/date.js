function pad(value) {
  return String(value).padStart(2, "0");
}

export function toIsoDate(input) {
  const date = new Date(input);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function buildCalendarDays(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const mondayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const startDay = new Date(year, month, 1 - mondayIndex);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(startDay);
    day.setDate(startDay.getDate() + index);

    return {
      date: day,
      iso: toIsoDate(day),
      inCurrentMonth: day.getMonth() === month,
    };
  });
}

