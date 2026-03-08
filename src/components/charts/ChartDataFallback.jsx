import React, { useMemo } from 'react';

function escapeCsvValue(value) {
    const stringValue = String(value);
    if (/[",\n]/.test(stringValue)) {
        return `"${stringValue.replaceAll('"', '""')}"`;
    }
    return stringValue;
}

function buildCsv(columns, rows) {
    return [columns, ...rows]
        .map(row => row.map(escapeCsvValue).join(','))
        .join('\n');
}

function ChartDataFallback({ tableId, caption, columns, rows, downloadLabel, fileName }) {
    const csvText = useMemo(() => buildCsv(columns, rows), [columns, rows]);

    const handleDownload = () => {
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <div className="mt-3 flex justify-end">
                <button
                    type="button"
                    onClick={handleDownload}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    {downloadLabel}
                </button>
            </div>
            <table id={tableId} className="sr-only">
                <caption>{caption}</caption>
                <thead>
                    <tr>
                        {columns.map(column => <th key={column} scope="col">{column}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={`${tableId}-row-${rowIndex}`}>
                            {row.map((value, cellIndex) => <td key={`${tableId}-cell-${rowIndex}-${cellIndex}`}>{String(value)}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

export default React.memo(ChartDataFallback);