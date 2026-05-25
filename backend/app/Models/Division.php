<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Division extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'max_quota',
        'active_applicants',
        'is_locked',
    ];

    protected function casts(): array
    {
        return [
            'max_quota'         => 'integer',
            'active_applicants' => 'integer',
            'is_locked'         => 'boolean',
        ];
    }

    // ─── Relationships ─────────────────────────────────

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function recommendedApplications()
    {
        return $this->hasMany(Application::class, 'recommended_division_id');
    }

    // ─── Computed ───────────────────────────────────────

    public function getRemainingQuotaAttribute(): int
    {
        return max(0, $this->max_quota - $this->active_applicants);
    }

    /**
     * Re-evaluate R5 lock rule:
     * Lock division if active_applicants >= max_quota.
     */
    public function evaluateR5(): void
    {
        $this->is_locked = $this->active_applicants >= $this->max_quota;
        $this->save();
    }
}
