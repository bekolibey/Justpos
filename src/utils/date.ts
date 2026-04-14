const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDateTime = (isoDate: string) => dateTimeFormatter.format(new Date(isoDate));

export const formatElapsed = (openedAt: string | null) => {
  if (!openedAt) {
    return '--:--';
  }

  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(openedAt).getTime()) / 60_000));
  const hours = Math.floor(elapsedMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor(elapsedMinutes % 60)
    .toString()
    .padStart(2, '0');

  return `${hours}:${minutes}`;
};

export const toDateInputValue = (isoDate: string) => isoDate.slice(0, 10);
