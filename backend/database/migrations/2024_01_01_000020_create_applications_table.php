<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('division_id')->constrained('divisions')->onDelete('cascade');
            $table->enum('status', ['pending', 'reviewing', 'accepted', 'rejected'])->default('pending');

            // Application details
            $table->string('institution_name')->nullable();
            $table->string('study_program')->nullable();
            $table->date('internship_start')->nullable();
            $table->date('internship_end')->nullable();

            // Rule-based algorithm results
            $table->boolean('r1_passed')->nullable();  // R1: Document completeness
            $table->boolean('r3_passed')->nullable();  // R3: Quota availability
            $table->boolean('r4_passed')->nullable();  // R4: Keyword matching score
            $table->float('algorithm_score')->nullable();  // R4 score (0-100)

            // Recommendation & rejection
            $table->foreignId('recommended_division_id')->nullable()->constrained('divisions')->nullOnDelete();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();

            // Prevent duplicate applications per user
            $table->unique(['user_id', 'division_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
