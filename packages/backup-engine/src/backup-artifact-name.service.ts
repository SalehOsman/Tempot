interface BackupArtifactNameInput {
  readonly backupJobId: string;
  readonly createdAt: string;
  readonly timeZone?: string;
}

export function formatBackupArtifactName(input: BackupArtifactNameInput): string {
  const date = new Date(input.createdAt);
  const timeZone = input.timeZone ?? 'UTC';
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    timeZone,
    year: 'numeric',
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '00';
  return (
    [
      `${value('year')}-${value('month')}-${value('day')}`,
      `${value('hour')}-${value('minute')}`,
      input.backupJobId,
    ].join('_') + '.backup.enc'
  );
}
