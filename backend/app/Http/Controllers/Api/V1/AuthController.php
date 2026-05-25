<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/register
     *
     * Register a new applicant account.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name'             => $request->name,
            'email'            => $request->email,
            'password'         => $request->password, // auto-hashed via cast
            'role'             => 'applicant',
            'applicant_type'   => $request->applicant_type,
            'institution_name' => $request->institution_name,
            'phone'            => $request->phone,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        // Send welcome notification
        sendNotification(
            $user->id,
            'Selamat Datang!',
            'Akun Anda berhasil didaftarkan di E-Internship Dishub Surabaya. Silakan lengkapi profil dan ajukan magang.'
        );

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil.',
            'data'    => [
                'user'  => $user,
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * POST /api/v1/auth/login
     *
     * Authenticate user and return token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah.',
            ], 401);
        }

        $user  = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'user'  => $user,
                'token' => $token,
                'role'  => $user->role,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     *
     * Revoke the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * GET /api/v1/auth/me
     *
     * Return the currently authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load('notifications');

        $unreadCount = $user->notifications()->unread()->count();

        return response()->json([
            'success' => true,
            'data'    => [
                'user'                  => $user,
                'unread_notifications'  => $unreadCount,
            ],
        ]);
    }

    /**
     * PUT /api/v1/auth/me
     *
     * Update the currently authenticated user's profile.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'             => ['sometimes', 'required', 'string', 'max:255'],
            'phone'            => ['sometimes', 'required', 'string', 'max:20'],
            'institution_name' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui.',
            'data'    => [
                'user' => $user,
            ],
        ]);
    }
}
