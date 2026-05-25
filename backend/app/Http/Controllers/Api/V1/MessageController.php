<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Message;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * GET /api/v1/messages/{userId}
     */
    public function index(Request $request, int $userId): JsonResponse
    {
        $user = $request->user();

        // Authorization: applicant can only see own messages
        if ($user->role === 'applicant' && $userId !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $messages = Message::where('user_id', $userId)
            ->with('sender:id,name,role')
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => $messages,
        ]);
    }

    /**
     * POST /api/v1/messages/{userId}
     */
    public function store(Request $request, int $userId): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $user = $request->user();

        // Authorization
        if ($user->role === 'applicant' && $userId !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $message = Message::create([
            'user_id'   => $userId,
            'sender_id' => $user->id,
            'message'   => $request->message,
        ]);

        $message->load('sender:id,name,role');

        return response()->json([
            'success' => true,
            'data'    => $message,
        ], 201);
    }

    /**
     * PATCH /api/v1/messages/{userId}/read
     */
    public function markAsRead(Request $request, int $userId): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'applicant' && $userId !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Mark messages from OTHER users as read
        Message::where('user_id', $userId)
            ->where('sender_id', '!=', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * GET /api/v1/messages/unread-counts
     */
    public function unreadCounts(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role === 'applicant') {
            // Applicant: unread counts for their own thread
            $counts = Message::where('user_id', $user->id)
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->selectRaw('user_id, count(*) as unread_count')
                ->groupBy('user_id')
                ->pluck('unread_count', 'user_id');
        } else {
            // Admin/Head: unread counts for all users
            $counts = Message::where('is_read', false)
                ->whereHas('sender', fn($q) => $q->where('role', 'applicant'))
                ->selectRaw('user_id, count(*) as unread_count')
                ->groupBy('user_id')
                ->pluck('unread_count', 'user_id');
        }

        $totalUnread = $counts->sum();

        return response()->json([
            'success' => true,
            'data'    => [
                'per_user' => $counts,
                'total'    => $totalUnread,
            ],
        ]);
    }
}
