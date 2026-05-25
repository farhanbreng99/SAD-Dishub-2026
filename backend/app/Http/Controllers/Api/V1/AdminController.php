<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\DecideApplicationRequest;
use App\Http\Requests\Admin\UpdateDivisionRequest;
use App\Models\Application;
use App\Models\Division;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    /**
     * GET /api/v1/admin/applications
     *
     * List all applications with filters, search, and pagination.
     */
    public function listApplications(Request $request): JsonResponse
    {
        $query = Application::with(['user', 'division', 'documents', 'recommendedDivision']);

        // ─── Filters ───────────────────────────────────
        if ($request->filled('division_id')) {
            $query->where('division_id', $request->division_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('applicant_type')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('applicant_type', $request->applicant_type);
            });
        }

        // ─── Search (by applicant name or email) ───────
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%");
            });
        }

        // ─── Sorting ───────────────────────────────────
        $sortField = $request->input('sort', '-created_at');
        $sortDirection = 'desc';

        if (str_starts_with($sortField, '-')) {
            $sortField = substr($sortField, 1);
            $sortDirection = 'desc';
        } else {
            $sortDirection = 'asc';
        }

        $allowedSorts = ['created_at', 'status', 'algorithm_score', 'updated_at'];
        if (in_array($sortField, $allowedSorts)) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $applications = $query->paginate($request->input('per_page', 15));

        return response()->json([
            'success' => true,
            'data'    => $applications,
        ]);
    }

    /**
     * GET /api/v1/admin/applications/{id}
     *
     * Get full application detail.
     */
    public function showApplication(int $id): JsonResponse
    {
        $application = Application::with([
            'user',
            'division',
            'recommendedDivision',
            'documents',
        ])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => [
                'application' => $application,
                'rule_results' => [
                    'r1_passed'       => $application->r1_passed,
                    'r1_description'  => 'Kelengkapan Dokumen (CV, Surat Pengantar, Kartu Identitas)',
                    'r3_passed'       => $application->r3_passed,
                    'r3_description'  => 'Ketersediaan Kuota Divisi',
                    'r4_passed'       => $application->r4_passed,
                    'r4_description'  => 'Kesesuaian Kata Kunci CV dengan Divisi',
                    'algorithm_score' => $application->algorithm_score,
                ],
            ],
        ]);
    }

    /**
     * POST /api/v1/admin/applications/{id}/execute-sort
     *
     * Run the rule-based sorting algorithm on a single application.
     * This is for DECISION SUPPORT only — it does NOT auto-reject.
     * Admin makes the final accept/reject decision.
     *
     * R1: Document completeness check
     * R3: Division quota availability check
     * R4: Keyword matching score against division name
     */
    public function executeSort(int $id): JsonResponse
    {
        $application = Application::with(['documents', 'division', 'user'])->findOrFail($id);

        if (!in_array($application->status, ['pending', 'reviewing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Algoritma hanya dapat dijalankan pada pengajuan berstatus pending atau reviewing.',
            ], 422);
        }

        $warnings = [];

        // ═══════════════════════════════════════════════
        // R1: Document Completeness
        // ═══════════════════════════════════════════════
        $requiredTypes = ['cv', 'cover_letter', 'id_card'];
        $uploadedTypes = $application->documents->pluck('type')->toArray();
        $missingTypes  = array_diff($requiredTypes, $uploadedTypes);

        $r1Passed = empty($missingTypes);
        if (!$r1Passed) {
            $missingLabels = [
                'cv'           => 'CV',
                'cover_letter' => 'Surat Pengantar',
                'id_card'      => 'Kartu Identitas',
            ];
            $missing = array_map(fn($t) => $missingLabels[$t] ?? $t, $missingTypes);
            $warnings[] = 'R1 - Dokumen belum lengkap: ' . implode(', ', $missing);
        }

        // ═══════════════════════════════════════════════
        // R3: Division Quota Availability
        // ═══════════════════════════════════════════════
        $division  = $application->division;
        $r3Passed  = !$division->is_locked && $division->active_applicants < $division->max_quota;

        if (!$r3Passed) {
            $warnings[] = 'R3 - Kuota divisi ' . $division->name . ' sudah penuh atau terkunci';
        }

        // ═══════════════════════════════════════════════
        // R4: Keyword Matching Score
        // ═══════════════════════════════════════════════
        $score = $this->calculateKeywordScore($application, $division);
        $threshold = (float) config('services.algorithm.score_threshold', 60);
        $r4Passed  = $score >= $threshold;

        if (!$r4Passed) {
            $warnings[] = "R4 - Skor kesesuaian ({$score}/100) di bawah ambang batas ({$threshold})";
        }

        // ═══════════════════════════════════════════════
        // Save Results (decision support only, no auto-reject)
        // ═══════════════════════════════════════════════
        $allPassed = $r1Passed && $r3Passed && $r4Passed;

        $application->update([
            'r1_passed'       => $r1Passed,
            'r3_passed'       => $r3Passed,
            'r4_passed'       => $r4Passed,
            'algorithm_score' => $score,
            'status'          => 'reviewing',
        ]);

        // ─── Notification ─────────────────────────────
        notifyStatusChange($application->user_id, 'reviewing');

        $application->load(['user', 'division', 'documents', 'recommendedDivision']);

        $recommendation = $allPassed
            ? 'Semua aturan terpenuhi. Disarankan untuk MENERIMA pengajuan ini.'
            : 'Terdapat catatan yang perlu diperhatikan. Silakan tinjau sebelum mengambil keputusan.';

        return response()->json([
            'success' => true,
            'message' => 'Evaluasi algoritma selesai. ' . $recommendation,
            'data'    => [
                'application'  => $application,
                'rule_results' => [
                    'r1_passed'       => $r1Passed,
                    'r1_detail'       => $r1Passed ? 'Semua dokumen lengkap' : 'Dokumen belum lengkap: ' . implode(', ', $missingTypes),
                    'r3_passed'       => $r3Passed,
                    'r3_detail'       => $r3Passed ? 'Kuota tersedia' : 'Kuota penuh/terkunci',
                    'r4_passed'       => $r4Passed,
                    'r4_detail'       => "Skor: {$score}/100 (threshold: {$threshold})",
                    'algorithm_score' => $score,
                    'all_passed'      => $allPassed,
                    'recommendation'  => $recommendation,
                    'warnings'        => $warnings,
                ],
            ],
        ]);
    }

    /**
     * PATCH /api/v1/admin/applications/{id}/decide
     *
     * Admin final decision: accept or reject.
     */
    public function decideApplication(DecideApplicationRequest $request, int $id): JsonResponse
    {
        $application = Application::with(['user', 'division'])->findOrFail($id);

        if (!in_array($application->status, ['pending', 'reviewing'])) {
            return response()->json([
                'success' => false,
                'message' => 'Keputusan hanya dapat diberikan pada pengajuan berstatus pending atau reviewing.',
            ], 422);
        }

        $decision = $request->decision;

        if ($decision === 'accepted') {
            // ─── Accept ────────────────────────────────
            $divisionId = $request->division_id ?? $application->division_id;
            $division   = Division::findOrFail($divisionId);

            $application->update([
                'status'                  => 'accepted',
                'recommended_division_id' => $divisionId,
                'rejection_reason'        => null,
                'admin_note'              => $request->admin_note,
            ]);

            // Increment active applicants
            $division->increment('active_applicants');

            // R5: Lock check
            $division->evaluateR5();

            // Notification
            $startDateStr = $application->internship_start 
                ? \Carbon\Carbon::parse($application->internship_start)->locale('id')->translatedFormat('d F Y')
                : '';
            notifyStatusChange($application->user_id, 'accepted', $division->name, $request->admin_note ?? '', $startDateStr);

            $message = "Pengajuan diterima di divisi {$division->name}.";

        } else {
            // ─── Reject ────────────────────────────────
            $application->update([
                'status'           => 'rejected',
                'rejection_reason' => $request->rejection_reason,
            ]);

            // Notification
            notifyStatusChange($application->user_id, 'rejected', $request->rejection_reason);

            $message = 'Pengajuan ditolak.';
        }

        $application->load(['user', 'division', 'recommendedDivision', 'documents']);

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $application,
        ]);
    }

    /**
     * GET /api/v1/admin/divisions
     *
     * List all divisions with quota statistics.
     */
    public function listDivisions(): JsonResponse
    {
        $divisions = Division::all();
        
        $counts = \Illuminate\Support\Facades\DB::table('applications')
            ->select('division_id', 'status', \Illuminate\Support\Facades\DB::raw('count(*) as aggregate'))
            ->groupBy('division_id', 'status')
            ->get()
            ->groupBy('division_id');

        $mapped = $divisions->map(function ($division) use ($counts) {
            $divisionCounts = $counts->get($division->id) ?? collect();
            
            $pending   = $divisionCounts->where('status', 'pending')->first()->aggregate ?? 0;
            $reviewing = $divisionCounts->where('status', 'reviewing')->first()->aggregate ?? 0;
            $accepted  = $divisionCounts->where('status', 'accepted')->first()->aggregate ?? 0;
            $rejected  = $divisionCounts->where('status', 'rejected')->first()->aggregate ?? 0;
            
            return [
                'id'                => $division->id,
                'name'              => $division->name,
                'max_quota'         => $division->max_quota,
                'active_applicants' => $division->active_applicants,
                'remaining_quota'   => $division->remaining_quota,
                'is_locked'         => $division->is_locked,
                'pending_count'     => $pending,
                'reviewing_count'   => $reviewing,
                'accepted_count'    => $accepted,
                'rejected_count'    => $rejected,
                'total_count'       => $pending + $reviewing + $accepted + $rejected,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $mapped,
        ]);
    }

    /**
     * PATCH /api/v1/admin/divisions/{id}
     *
     * Update division quota.
     */
    public function updateDivision(UpdateDivisionRequest $request, Division $division): JsonResponse
    {
        $division->update([
            'max_quota' => $request->max_quota,
        ]);

        // Re-evaluate R5: unlock if quota increased
        $division->evaluateR5();

        return response()->json([
            'success' => true,
            'message' => 'Kuota divisi berhasil diperbarui.',
            'data'    => [
                'id'                => $division->id,
                'name'              => $division->name,
                'max_quota'         => $division->max_quota,
                'active_applicants' => $division->active_applicants,
                'remaining_quota'   => $division->remaining_quota,
                'is_locked'         => $division->is_locked,
            ],
        ]);
    }

    // ═══════════════════════════════════════════════════
    // Private: R4 Keyword Matching Algorithm
    // ═══════════════════════════════════════════════════

    /**
     * Calculate keyword matching score between applicant's profile
     * and the target division.
     *
     * Strategy:
     * 1. Check relevance mapping (study program → division)
     * 2. Extract keywords from CV filename + application fields
     * 3. Expand keywords with synonyms
     * 4. Calculate overlap with division keywords
     * 5. Combine relevance map score + keyword score
     *
     * @return float Score between 0 and 100
     */
    private function calculateKeywordScore(Application $application, Division $division): float
    {
        $score = 0.0;
        $divisionName = strtolower($division->name);

        // ─── Step 1: Relevance Map (program studi → divisi) ───
        // Bobot utama: 60% dari skor total
        $relevanceScore = $this->getRelevanceMapScore(
            strtolower($application->study_program ?? ''),
            $divisionName
        );

        // ─── Step 2: Keyword Matching ───
        // Bobot tambahan: 40% dari skor total
        $applicantKeywords = [];

        // From CV filename
        $cvDoc = $application->documents->firstWhere('type', 'cv');
        if ($cvDoc) {
            $applicantKeywords = array_merge(
                $applicantKeywords,
                $this->extractKeywords($cvDoc->file_name)
            );
        }

        // From study program
        if ($application->study_program) {
            $applicantKeywords = array_merge(
                $applicantKeywords,
                $this->extractKeywords($application->study_program)
            );
        }

        // From institution name
        if ($application->institution_name) {
            $applicantKeywords = array_merge(
                $applicantKeywords,
                $this->extractKeywords($application->institution_name)
            );
        }

        $applicantKeywords = array_unique(array_filter($applicantKeywords));

        // Expand with synonyms
        $expandedKeywords = $this->expandWithSynonyms($applicantKeywords);

        // Division keywords (also expanded)
        $divisionKeywords = $this->extractKeywords($division->name);
        $expandedDivisionKeywords = $this->expandWithSynonyms($divisionKeywords);

        // Calculate keyword overlap
        $keywordScore = 0.0;
        if (!empty($expandedDivisionKeywords) && !empty($expandedKeywords)) {
            $matches = 0;
            $maxPossible = count($expandedDivisionKeywords) * 2;

            foreach ($expandedDivisionKeywords as $divKeyword) {
                foreach ($expandedKeywords as $appKeyword) {
                    if ($divKeyword === $appKeyword) {
                        $matches += 2;
                    } elseif (str_contains($appKeyword, $divKeyword) || str_contains($divKeyword, $appKeyword)) {
                        $matches += 1;
                    }
                }
            }

            $keywordScore = min($matches / max($maxPossible, 1), 1.0) * 100;
        }

        // ─── Step 3: Combine scores ───
        // relevanceScore (0-100) * 0.6 + keywordScore (0-100) * 0.4
        $finalScore = ($relevanceScore * 0.6) + ($keywordScore * 0.4);

        // Minimum base score of 30 for any valid application with complete data
        if ($application->study_program && $application->institution_name) {
            $finalScore = max($finalScore, 30.0);
        }

        return round(min($finalScore, 100.0), 2);
    }

    /**
     * Get relevance score based on study program ↔ division mapping.
     * Returns 0-100 score based on how relevant the study program is.
     */
    private function getRelevanceMapScore(string $studyProgram, string $divisionName): float
    {
        // Mapping: divisi → daftar program studi yang relevan (dengan bobot)
        $relevanceMap = [
            'teknologi informasi' => [
                'high' => ['teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                           'teknologi informasi', 'rekayasa perangkat lunak', 'sains data',
                           'data science', 'computer science', 'information system',
                           'information technology', 'software engineering', 'cybersecurity'],
                'medium' => ['teknik elektro', 'teknik komputer', 'matematika', 'statistika',
                             'manajemen informatika', 'komputerisasi akuntansi', 'multimedia'],
            ],
            'lalu lintas' => [
                'high' => ['teknik sipil', 'teknik transportasi', 'perencanaan wilayah', 'planologi',
                           'teknik lingkungan', 'manajemen transportasi', 'teknik jalan'],
                'medium' => ['teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'teknik elektro', 'teknik mesin', 'administrasi publik', 'administrasi negara',
                             'manajemen', 'hukum', 'statistika'],
            ],
            'angkutan' => [
                'high' => ['teknik transportasi', 'manajemen transportasi', 'teknik sipil',
                           'manajemen logistik', 'teknik industri'],
                'medium' => ['manajemen', 'administrasi publik', 'administrasi negara', 'ekonomi',
                             'teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'hukum', 'teknik mesin'],
            ],
            'prasarana' => [
                'high' => ['teknik sipil', 'arsitektur', 'teknik lingkungan', 'perencanaan wilayah',
                           'planologi', 'teknik transportasi'],
                'medium' => ['teknik mesin', 'teknik elektro', 'teknik industri',
                             'manajemen', 'administrasi publik', 'teknik informatika',
                             'sistem informasi', 'ilmu komputer', 'informatika'],
            ],
            'keselamatan' => [
                'high' => ['kesehatan masyarakat', 'keselamatan kerja', 'k3', 'teknik lingkungan',
                           'teknik sipil', 'teknik transportasi'],
                'medium' => ['hukum', 'administrasi publik', 'administrasi negara', 'manajemen',
                             'teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'teknik mesin', 'teknik elektro', 'psikologi', 'sosiologi'],
            ],
            'pengembangan llaj' => [
                'high' => ['teknik sipil', 'teknik transportasi', 'perencanaan wilayah', 'planologi',
                           'teknik lingkungan', 'manajemen transportasi'],
                'medium' => ['teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'teknik industri', 'manajemen', 'administrasi publik', 'hukum',
                             'ekonomi pembangunan', 'statistika'],
            ],
            'sekretariat' => [
                'high' => ['administrasi publik', 'administrasi negara', 'administrasi bisnis',
                           'manajemen', 'sekretaris', 'administrasi perkantoran', 'ilmu pemerintahan'],
                'medium' => ['hukum', 'akuntansi', 'ekonomi', 'ilmu komunikasi', 'psikologi',
                             'teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'sosiologi', 'sastra', 'perpustakaan'],
            ],
            'pengujian kendaraan' => [
                'high' => ['teknik mesin', 'teknik otomotif', 'teknik kendaraan', 'teknik industri'],
                'medium' => ['teknik elektro', 'teknik sipil', 'teknik lingkungan', 'fisika',
                             'teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'kimia'],
            ],
            'pengelolaan parkir' => [
                'high' => ['teknik sipil', 'perencanaan wilayah', 'planologi', 'manajemen',
                           'teknik transportasi', 'administrasi publik'],
                'medium' => ['teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'akuntansi', 'ekonomi', 'teknik industri', 'hukum',
                             'administrasi bisnis'],
            ],
            'terminal' => [
                'high' => ['teknik sipil', 'teknik transportasi', 'manajemen transportasi',
                           'administrasi publik', 'manajemen'],
                'medium' => ['teknik informatika', 'sistem informasi', 'ilmu komputer', 'informatika',
                             'teknik mesin', 'teknik industri', 'arsitektur', 'hukum',
                             'ekonomi', 'ilmu komunikasi'],
            ],
        ];

        // Find matching division in the map
        foreach ($relevanceMap as $divKey => $programs) {
            if (str_contains($divisionName, $divKey)) {
                // Check high relevance (score: 85-100)
                foreach ($programs['high'] as $program) {
                    if (str_contains($studyProgram, $program) || str_contains($program, $studyProgram)) {
                        return 95.0;
                    }
                }
                // Check medium relevance (score: 60-80)
                foreach ($programs['medium'] as $program) {
                    if (str_contains($studyProgram, $program) || str_contains($program, $studyProgram)) {
                        return 70.0;
                    }
                }
                // Division found but no program match → low relevance
                return 35.0;
            }
        }

        // Division not in map → give neutral score
        return 50.0;
    }

    /**
     * Expand keywords with relevant synonyms and related terms.
     */
    private function expandWithSynonyms(array $keywords): array
    {
        $synonymMap = [
            'informasi'     => ['informatika', 'komputer', 'teknologi', 'digital', 'data', 'sistem'],
            'informatika'   => ['informasi', 'komputer', 'teknologi', 'programming', 'software'],
            'komputer'      => ['informatika', 'informasi', 'teknologi', 'digital', 'komputasi'],
            'sistem'        => ['informasi', 'teknologi', 'manajemen', 'analisis'],
            'transportasi'  => ['lalu', 'lintas', 'angkutan', 'kendaraan', 'terminal', 'parkir'],
            'sipil'         => ['prasarana', 'infrastruktur', 'konstruksi', 'jalan', 'bangunan'],
            'mesin'         => ['otomotif', 'kendaraan', 'pengujian', 'mekanik'],
            'elektro'       => ['elektronik', 'listrik', 'teknologi', 'sinyal'],
            'manajemen'     => ['administrasi', 'pengelolaan', 'sekretariat', 'organisasi'],
            'administrasi'  => ['manajemen', 'sekretariat', 'perkantoran', 'birokrasi'],
            'hukum'         => ['regulasi', 'peraturan', 'keselamatan', 'kepatuhan'],
            'lingkungan'    => ['keselamatan', 'prasarana', 'infrastruktur'],
            'lalu'          => ['lintas', 'transportasi', 'jalan'],
            'lintas'        => ['lalu', 'transportasi', 'jalan'],
        ];

        $expanded = $keywords;
        foreach ($keywords as $keyword) {
            if (isset($synonymMap[$keyword])) {
                $expanded = array_merge($expanded, $synonymMap[$keyword]);
            }
        }

        return array_unique($expanded);
    }

    /**
     * Extract meaningful keywords from a text string.
     * Removes common Indonesian and file-related stop words.
     */
    private function extractKeywords(string $text): array
    {
        // Normalize: lowercase, remove extension, replace separators with spaces
        $text = strtolower($text);
        $text = preg_replace('/\.(pdf|doc|docx|jpg|jpeg|png)$/i', '', $text);
        $text = preg_replace('/[_\-\.\/\\\\]/', ' ', $text);
        $text = preg_replace('/[^a-z0-9\s]/', '', $text);

        $words = preg_split('/\s+/', trim($text));

        // Remove common stop words (Indonesian + generic)
        $stopWords = [
            'dan', 'atau', 'di', 'ke', 'dari', 'yang', 'untuk', 'dengan',
            'pada', 'adalah', 'ini', 'itu', 'akan', 'telah', 'sudah',
            'cv', 'surat', 'file', 'dokumen', 'upload', 'universitas',
            'institut', 'sekolah', 'politeknik', 'akademi', 'bidang', 'upt',
            'the', 'and', 'or', 'of', 'in', 'to', 'a', 'an',
        ];

        $keywords = array_filter($words, function ($word) use ($stopWords) {
            return strlen($word) > 2 && !in_array($word, $stopWords);
        });

        return array_values($keywords);
    }
}
