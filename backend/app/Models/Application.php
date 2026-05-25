<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'division_id',
        'status',
        'institution_name',
        'study_program',
        'internship_start',
        'internship_end',
        'r1_passed',
        'r3_passed',
        'r4_passed',
        'algorithm_score',
        'recommended_division_id',
        'rejection_reason',
        'admin_note',
    ];

    protected function casts(): array
    {
        return [
            'r1_passed'        => 'boolean',
            'r3_passed'        => 'boolean',
            'r4_passed'        => 'boolean',
            'algorithm_score'  => 'float',
            'internship_start' => 'date',
            'internship_end'   => 'date',
        ];
    }

    // ─── Relationships ─────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function recommendedDivision()
    {
        return $this->belongsTo(Division::class, 'recommended_division_id');
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    // ─── Scopes ─────────────────────────────────────────

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByDivision($query, int $divisionId)
    {
        return $query->where('division_id', $divisionId);
    }

    // ─── Helpers ────────────────────────────────────────

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isReviewing(): bool
    {
        return $this->status === 'reviewing';
    }

    public function isAccepted(): bool
    {
        return $this->status === 'accepted';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Check if all required document types are uploaded.
     */
    public function hasAllDocuments(): bool
    {
        $requiredTypes = ['cv', 'cover_letter', 'id_card'];
        $uploadedTypes = $this->documents()->pluck('type')->toArray();

        return empty(array_diff($requiredTypes, $uploadedTypes));
    }
}
