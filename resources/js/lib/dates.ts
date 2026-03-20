const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

function toDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function formatDate(value: string | null | undefined): string {
    const date = toDate(value);

    return date ? dateFormatter.format(date) : '—';
}

export function formatDateTime(value: string | null | undefined): string {
    const date = toDate(value);

    return date ? dateTimeFormatter.format(date) : '—';
}
