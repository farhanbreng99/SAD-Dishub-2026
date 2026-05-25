<?php

use App\Http\Controllers\Api\V1\AdminController;
use App\Http\Controllers\Api\V1\ApplicantController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HeadController;
use App\Http\Controllers\Api\V1\MessageController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — E-Internship Dishub Surabaya
|--------------------------------------------------------------------------
|
| All routes are prefixed with /api/v1
| Auth: Laravel Sanctum (token-based)
|
*/

Route::prefix('v1')->group(function () {

    // ═══════════════════════════════════════════════════
    // AUTH (Public)
    // ═══════════════════════════════════════════════════
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login',    [AuthController::class, 'login']);

        // Protected auth routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/logout', [AuthController::class, 'logout']);
            Route::get('/me',     [AuthController::class, 'me']);
            Route::put('/me',     [AuthController::class, 'updateProfile']);
        });
    });

    // ═══════════════════════════════════════════════════
    // APPLICANT ROUTES (role: applicant)
    // ═══════════════════════════════════════════════════
    Route::middleware(['auth:sanctum', 'role:applicant'])->group(function () {


        // Applications
        Route::post('/applications',                [ApplicantController::class, 'storeApplication']);
        Route::post('/applications/{id}/documents', [ApplicantController::class, 'uploadDocuments']);
        Route::delete('/applications/{id}',         [ApplicantController::class, 'cancelApplication']);
        Route::get('/applications/my',              [ApplicantController::class, 'myApplications']);

        // Notifications
        Route::get('/notifications',             [ApplicantController::class, 'notifications']);
        Route::patch('/notifications/{id}/read', [ApplicantController::class, 'markNotificationRead']);
    });

    // ═══════════════════════════════════════════════════
    // ADMIN ROUTES (role: admin)
    // ═══════════════════════════════════════════════════
    Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {

        // Applications management
        Route::get('/applications',                    [AdminController::class, 'listApplications']);
        Route::get('/applications/{id}',               [AdminController::class, 'showApplication']);
        Route::post('/applications/{id}/execute-sort', [AdminController::class, 'executeSort']);
        Route::patch('/applications/{id}/decide',      [AdminController::class, 'decideApplication']);

        // Divisions management
        Route::get('/divisions',              [AdminController::class, 'listDivisions']);
        Route::patch('/divisions/{division}', [AdminController::class, 'updateDivision']);
    });

    // ═══════════════════════════════════════════════════
    // HEAD / PIMPINAN ROUTES (role: head)
    // ═══════════════════════════════════════════════════
    Route::prefix('head')->middleware(['auth:sanctum', 'role:head'])->group(function () {

        Route::get('/analytics',   [HeadController::class, 'analytics']);
        Route::post('/export',     [HeadController::class, 'export']);
    });

    // ═══════════════════════════════════════════════════
    // SHARED AUTHENTICATED ROUTES
    // ═══════════════════════════════════════════════════
    Route::middleware('auth:sanctum')->group(function () {
        // Shared division listing
        Route::get('/divisions', [ApplicantController::class, 'divisions']);

        // Messages
        Route::get('/messages/unread-counts',          [MessageController::class, 'unreadCounts']);
        Route::get('/messages/{userId}',               [MessageController::class, 'index']);
        Route::post('/messages/{userId}',              [MessageController::class, 'store']);
        Route::patch('/messages/{userId}/read',        [MessageController::class, 'markAsRead']);
    });

    // ═══════════════════════════════════════════════════
    // HEALTH CHECK
    // ═══════════════════════════════════════════════════
    Route::get('/health', function () {
        return response()->json([
            'status'  => 'ok',
            'service' => 'E-Internship Dishub API',
            'version' => 'v1',
            'time'    => now()->toISOString(),
        ]);
    });
});
