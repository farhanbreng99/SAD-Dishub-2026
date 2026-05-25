<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Laravel enum on PostgreSQL uses a CHECK constraint on a varchar column
        DB::statement("ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check");
        DB::statement("ALTER TABLE documents ADD CONSTRAINT documents_type_check CHECK (type::text = ANY (ARRAY['cv'::text, 'cover_letter'::text, 'id_card'::text, 'proposal'::text]))");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check");
        DB::statement("ALTER TABLE documents ADD CONSTRAINT documents_type_check CHECK (type::text = ANY (ARRAY['cv'::text, 'cover_letter'::text, 'id_card'::text]))");
    }
};
