<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'applicant_type',
        'institution_name',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // ─── Relationships ─────────────────────────────────

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'user_id');
    }

    public function exportLogs()
    {
        return $this->hasMany(ExportLog::class, 'exported_by');
    }

    // ─── Helpers ────────────────────────────────────────

    public function isApplicant(): bool
    {
        return $this->role === 'applicant';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isHead(): bool
    {
        return $this->role === 'head';
    }
}
