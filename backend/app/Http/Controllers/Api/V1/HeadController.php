<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Head\ExportRequest;
use App\Models\Application;
use App\Models\Division;
use App\Services\SupabaseStorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class HeadController extends Controller
{
    protected SupabaseStorageService $storage;

    public function __construct(SupabaseStorageService $storage)
    {
        $this->storage = $storage;
    }

    /**
     * GET /api/v1/head/analytics
     *
     * Comprehensive analytics dashboard data.
     */
    public function analytics(): JsonResponse
    {
        // ─── Summary Counts ────────────────────────────
        $totalApplicants = Application::count();
        $totalAccepted   = Application::where('status', 'accepted')->count();
        $totalRejected   = Application::where('status', 'rejected')->count();
        $totalPending    = Application::where('status', 'pending')->count();
        $totalReviewing  = Application::where('status', 'reviewing')->count();

        $lockedDivisions = Division::where('is_locked', true)->count();

        // ─── Applicants per Division ───────────────────
        $applicantsPerDivision = Division::withCount('applications')
            ->get()
            ->map(fn($d) => [
                'division_name' => $d->name,
                'count'         => $d->applications_count,
            ]);

        // ─── Applicant Type Breakdown ──────────────────
        $applicantTypeBreakdown = Application::join('users', 'applications.user_id', '=', 'users.id')
            ->selectRaw('users.applicant_type as type, COUNT(*) as count')
            ->groupBy('users.applicant_type')
            ->get();

        // ─── Monthly Trend (Last 12 Months) ────────────
        $monthlyTrend = Application::selectRaw(
            "EXTRACT(MONTH FROM created_at)::int as month, " .
            "EXTRACT(YEAR FROM created_at)::int as year, " .
            "COUNT(*) as count"
        )
            ->where('created_at', '>=', Carbon::now()->subMonths(12))
            ->groupByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
            ->orderByRaw("EXTRACT(YEAR FROM created_at), EXTRACT(MONTH FROM created_at)")
            ->get();

        // ─── Division Capacity ─────────────────────────
        $divisionCapacity = Division::all()->map(fn($d) => [
            'division_name'    => $d->name,
            'max_quota'        => $d->max_quota,
            'active_applicants' => $d->active_applicants,
            'percentage'       => $d->max_quota > 0
                ? round(($d->active_applicants / $d->max_quota) * 100, 1)
                : 0,
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'total_applicants'          => $totalApplicants,
                'total_accepted'            => $totalAccepted,
                'total_rejected'            => $totalRejected,
                'total_pending'             => $totalPending,
                'total_reviewing'           => $totalReviewing,
                'locked_divisions_count'    => $lockedDivisions,
                'applicants_per_division'   => $applicantsPerDivision,
                'applicant_type_breakdown'  => $applicantTypeBreakdown,
                'monthly_trend'             => $monthlyTrend,
                'division_capacity'         => $divisionCapacity,
            ],
        ]);
    }

    /**
     * POST /api/v1/head/export
     *
     * Generate XLSX export of filtered applications data.
     */
    public function export(ExportRequest $request): \Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        $user = $request->user();

        // ─── Build Filtered Query ──────────────────────
        $query = Application::with(['user', 'division']);

        $filters = [];

        if ($request->filled('date_from')) {
            $query->whereDate('applications.created_at', '>=', $request->date_from);
            $filters['date_from'] = $request->date_from;
        }

        if ($request->filled('date_to')) {
            $query->whereDate('applications.created_at', '<=', $request->date_to);
            $filters['date_to'] = $request->date_to;
        }

        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
            $filters['division_id'] = $request->division_id;
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
            $filters['status'] = $request->status;
        }

        if ($request->filled('applicant_type')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('applicant_type', $request->applicant_type);
            });
            $filters['applicant_type'] = $request->applicant_type;
        }

        $applications = $query->orderBy('created_at', 'desc')->get();

        // ─── Generate XLSX ─────────────────────────────
        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Pengajuan Magang');

        // Header styling
        $headerStyle = [
            'font' => [
                'bold'  => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size'  => 11,
            ],
            'fill' => [
                'fillType'   => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '1D4ED8'],
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical'   => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ];

        // Headers
        $headers = [
            'No',
            'Nama Pemohon',
            'Email',
            'Telepon',
            'Tipe Pemohon',
            'Institusi',
            'Program Studi',
            'Divisi Tujuan',
            'Status',
            'Skor Algoritma',
            'R1 (Dokumen)',
            'R3 (Kuota)',
            'R4 (Kesesuaian)',
            'Alasan Penolakan',
            'Tanggal Mulai',
            'Tanggal Selesai',
            'Tanggal Pengajuan',
        ];

        foreach ($headers as $colIdx => $header) {
            $colLetter = Coordinate::stringFromColumnIndex($colIdx + 1);
            $sheet->setCellValue($colLetter . '1', $header);
        }
        $sheet->getStyle('A1:Q1')->applyFromArray($headerStyle);
        $sheet->getRowDimension(1)->setRowHeight(30);

        // Data rows
        foreach ($applications as $rowIdx => $app) {
            $row = $rowIdx + 2;

            $sheet->setCellValue('A' . $row, $rowIdx + 1);
            $sheet->setCellValue('B' . $row, $app->user->name ?? '-');
            $sheet->setCellValue('C' . $row, $app->user->email ?? '-');
            $sheet->setCellValue('D' . $row, $app->user->phone ?? '-');
            $sheet->setCellValue('E' . $row, $this->formatApplicantType($app->user->applicant_type));
            $sheet->setCellValue('F' . $row, $app->institution_name ?? $app->user->institution_name ?? '-');
            $sheet->setCellValue('G' . $row, $app->study_program ?? '-');
            $sheet->setCellValue('H' . $row, $app->division->name ?? '-');
            $sheet->setCellValue('I' . $row, $this->formatStatus($app->status));
            $sheet->setCellValue('J' . $row, $app->algorithm_score ?? '-');
            $sheet->setCellValue('K' . $row, $this->formatBool($app->r1_passed));
            $sheet->setCellValue('L' . $row, $this->formatBool($app->r3_passed));
            $sheet->setCellValue('M' . $row, $this->formatBool($app->r4_passed));
            $sheet->setCellValue('N' . $row, $app->rejection_reason ?? '-');
            $sheet->setCellValue('O' . $row, $app->internship_start?->format('d/m/Y') ?? '-');
            $sheet->setCellValue('P' . $row, $app->internship_end?->format('d/m/Y') ?? '-');
            $sheet->setCellValue('Q' . $row, $app->created_at->format('d/m/Y H:i'));
        }

        // Auto-size columns
        foreach (range('A', 'Q') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // ─── Stream Download Directly ──────────────────────
        $fileName = 'Laporan_Magang_' . Carbon::now()->format('Ymd_His') . '.xlsx';
        $tempPath = sys_get_temp_dir() . '/' . $fileName;

        $writer = new Xlsx($spreadsheet);
        $writer->save($tempPath);

        return response()->download($tempPath, $fileName, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ])->deleteFileAfterSend(true);
    }



    // ═══════════════════════════════════════════════════
    // Private Helpers
    // ═══════════════════════════════════════════════════

    private function formatStatus(string $status): string
    {
        return match ($status) {
            'pending'   => 'Menunggu',
            'reviewing' => 'Sedang Ditinjau',
            'accepted'  => 'Diterima',
            'rejected'  => 'Ditolak',
            default     => $status,
        };
    }

    private function formatApplicantType(?string $type): string
    {
        return match ($type) {
            'slta'           => 'SLTA/Sederajat',
            'mahasiswa'      => 'Mahasiswa',
            'fresh_graduate' => 'Fresh Graduate',
            'instansi'       => 'Instansi/Lembaga',
            default          => '-',
        };
    }

    private function formatBool(?bool $value): string
    {
        if ($value === null) return 'Belum Diproses';
        return $value ? 'Lolos' : 'Tidak Lolos';
    }
}
