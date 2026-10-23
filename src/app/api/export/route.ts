import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { tokens, filename = 'qsync-operational-report.csv' } = await req.json();

    if (!Array.isArray(tokens)) {
      return NextResponse.json({ error: 'Tokens array is required' }, { status: 400 });
    }

    const headers = [
      'Token Number',
      'Ref Code',
      'Service',
      'Priority',
      'Status',
      'Counter',
      'Called By Staff',
      'Call Count',
      'Business Date',
      'Created At',
      'Called At',
      'Serving At',
      'Completed At',
      'Skip Reason'
    ];

    const rows = tokens.map(t => [
      t.display_number || '',
      t.ref_code || '',
      `"${(t.service_name || '').replace(/"/g, '""')}"`,
      t.priority || 'standard',
      t.status || '',
      `"${(t.counter_name || '').replace(/"/g, '""')}"`,
      `"${(t.called_by_staff_name || '').replace(/"/g, '""')}"`,
      t.call_count || 0,
      t.business_date || '',
      t.created_at || '',
      t.called_at || '',
      t.serving_at || '',
      t.completed_at || '',
      `"${(t.skip_reason || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
