<?php

use App\Models\Notification;

if (!function_exists('sendNotification')) {
    /**
     * Send an in-app notification to a user.
     *
     * @param  int     $userId   The recipient user ID
     * @param  string  $title    Notification title
     * @param  string  $message  Notification body message
     * @return \App\Models\Notification
     */
    function sendNotification(int $userId, string $title, string $message): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'title'   => $title,
            'message' => $message,
            'is_read' => false,
        ]);
    }
}

if (!function_exists('notifyStatusChange')) {
    /**
     * Send a notification when application status changes.
     *
     * @param  int     $userId  The applicant user ID
     * @param  string  $status  New status (reviewing/accepted/rejected)
     * @param  string  $detail  Additional detail (division name or rejection reason)
     * @return \App\Models\Notification
     */
    function notifyStatusChange(int $userId, string $status, string $detail = '', string $note = '', string $startDate = ''): Notification
    {
        $titles = [
            'reviewing' => 'Pengajuan Sedang Ditinjau',
            'accepted'  => 'Pengajuan Diterima',
            'rejected'  => 'Pengajuan Ditolak',
        ];

        $dateString = $startDate ? " pada tanggal {$startDate}" : "";
        $acceptedMsg = "Selamat, Anda diterima di divisi {$detail}. Silakan menunggu informasi selanjutnya. Anda dapat mengunjungi Kantor Dinas Perhubungan Kota Surabaya{$dateString} di Jl. Dukuh Menanggal No.1, Surabaya, dan menuju bagian Umum dan Kepegawaian untuk informasi lebih lanjut dengan membawa hardfile proposal dan surat pengantar dari instansi.";
        
        if ($status === 'accepted' && trim($note) !== '') {
            $acceptedMsg .= " Catatan Admin: " . trim($note);
        }

        $messages = [
            'reviewing' => 'Pengajuan magang Anda sedang dalam proses peninjauan oleh Admin Sekretariat.',
            'accepted'  => $acceptedMsg,
            'rejected'  => "Pengajuan Anda ditolak: {$detail}",
        ];

        return sendNotification(
            $userId,
            $titles[$status] ?? 'Pembaruan Status',
            $messages[$status] ?? $detail
        );
    }
}

if (!function_exists('notifyRuleFailure')) {
    /**
     * Send a notification when rule-based algorithm rejects an application.
     *
     * @param  int    $userId       The applicant user ID
     * @param  array  $failedRules  List of failed rule descriptions
     * @return \App\Models\Notification
     */
    function notifyRuleFailure(int $userId, array $failedRules): Notification
    {
        $reasons = implode('; ', $failedRules);

        return sendNotification(
            $userId,
            'Pengajuan Tidak Memenuhi Syarat',
            "Pengajuan magang Anda ditolak secara otomatis karena: {$reasons}. Silakan perbaiki dan ajukan kembali."
        );
    }
}
