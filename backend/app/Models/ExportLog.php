<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExportLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'exported_by',
        'file_name',
        'file_path',
        'filters',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
        ];
    }

    // ─── Relationships ─────────────────────────────────

    public function exporter()
    {
        return $this->belongsTo(User::class, 'exported_by');
    }
}
