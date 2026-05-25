<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'application_id',
        'type',
        'file_path',
        'file_name',
    ];

    protected $appends = ['file_url'];

    public function getFileUrlAttribute()
    {
        if (str_starts_with($this->file_path, 'http')) {
            return $this->file_path;
        }

        $supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $bucket = config('services.supabase.storage_bucket');
        
        return "{$supabaseUrl}/storage/v1/object/public/{$bucket}/{$this->file_path}";
    }

    // ─── Relationships ─────────────────────────────────

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}
