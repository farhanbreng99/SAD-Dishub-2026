<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // ─── Admin User ────────────────────────────────
        User::create([
            'name'     => 'Admin Sekretariat',
            'email'    => 'admin@dishub-surabaya.go.id',
            'password' => 'password123',
            'role'     => 'admin',
            'phone'    => '031-1234567',
        ]);

        // ─── Head / Pimpinan ───────────────────────────
        User::create([
            'name'     => 'Kepala Bidang',
            'email'    => 'pimpinan@dishub-surabaya.go.id',
            'password' => 'password123',
            'role'     => 'head',
            'phone'    => '031-7654321',
        ]);

        // ─── Sample Applicant ──────────────────────────
        User::create([
            'name'             => 'Ahmad Fauzi',
            'email'            => 'ahmad.fauzi@student.ac.id',
            'password'         => 'password123',
            'role'             => 'applicant',
            'applicant_type'   => 'mahasiswa',
            'institution_name' => 'UIN Sunan Ampel Surabaya',
            'phone'            => '081234567890',
        ]);

        // ─── Divisions ────────────────────────────────
        $divisions = [
            ['name' => 'Bidang Lalu Lintas',           'max_quota' => 5],
            ['name' => 'Bidang Angkutan',               'max_quota' => 4],
            ['name' => 'Bidang Prasarana',               'max_quota' => 3],
            ['name' => 'Bidang Keselamatan',             'max_quota' => 3],
            ['name' => 'Bidang Pengembangan LLAJ',       'max_quota' => 4],
            ['name' => 'Sekretariat',                    'max_quota' => 3],
            ['name' => 'UPT Pengujian Kendaraan',        'max_quota' => 2],
            ['name' => 'UPT Pengelolaan Parkir',         'max_quota' => 3],
            ['name' => 'UPT Terminal',                   'max_quota' => 2],
            ['name' => 'Bidang Teknologi Informasi',     'max_quota' => 5],
        ];

        foreach ($divisions as $division) {
            Division::create($division);
        }
    }
}
