<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SupabaseStorageService
{
    protected string $supabaseUrl;
    protected string $serviceKey;
    protected string $bucket;

    public function __construct()
    {
        $this->supabaseUrl = rtrim(config('services.supabase.url'), '/');
        $this->serviceKey  = config('services.supabase.service_key');
        $this->bucket      = config('services.supabase.storage_bucket');
    }

    /**
     * Upload a file to Supabase Storage.
     *
     * @param  UploadedFile  $file       The uploaded file
     * @param  string        $folder     Folder path inside the bucket (e.g. "applications/42/cv")
     * @param  string|null   $fileName   Optional custom file name
     * @return array{path: string, url: string, file_name: string}
     *
     * @throws \Exception
     */
    public function upload(UploadedFile $file, string $folder, ?string $fileName = null): array
    {
        $originalName = $file->getClientOriginalName();
        $extension    = $file->getClientOriginalExtension();
        $safeName     = $fileName
            ? "{$fileName}.{$extension}"
            : Str::slug(pathinfo($originalName, PATHINFO_FILENAME)) . '_' . time() . ".{$extension}";

        $filePath = trim("{$folder}/{$safeName}", '/');

        $response = Http::withOptions([
            'curl' => [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
                CURLOPT_DNS_USE_GLOBAL_CACHE => false,
                CURLOPT_DNS_CACHE_TIMEOUT => 0,
            ]
        ])->withoutVerifying()->withHeaders([
            'Authorization' => "Bearer {$this->serviceKey}",
            'Content-Type'  => $file->getMimeType(),
        ])->withBody(
            file_get_contents($file->getRealPath()),
            $file->getMimeType()
        )->post("{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$filePath}");

        if ($response->failed()) {
            // Try update (upsert) if file already exists
            $response = Http::withOptions([
                'curl' => [
                    CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
                    CURLOPT_DNS_USE_GLOBAL_CACHE => false,
                    CURLOPT_DNS_CACHE_TIMEOUT => 0,
                ]
            ])->withoutVerifying()->withHeaders([
                'Authorization'   => "Bearer {$this->serviceKey}",
                'Content-Type'    => $file->getMimeType(),
                'x-upsert'       => 'true',
            ])->withBody(
                file_get_contents($file->getRealPath()),
                $file->getMimeType()
            )->post("{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$filePath}");

            if ($response->failed()) {
                throw new \Exception(
                    "Failed to upload file to Supabase Storage: " . $response->body()
                );
            }
        }

        return [
            'path'      => $filePath,
            'url'       => $this->getPublicUrl($filePath),
            'file_name' => $originalName,
        ];
    }

    /**
     * Get the public URL for a stored file.
     */
    public function getPublicUrl(string $filePath): string
    {
        return "{$this->supabaseUrl}/storage/v1/object/public/{$this->bucket}/{$filePath}";
    }

    /**
     * Get a signed/temporary URL for a stored file.
     */
    public function getSignedUrl(string $filePath, int $expiresIn = 3600): string
    {
        $response = Http::withOptions([
            'curl' => [
                CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
                CURLOPT_DNS_USE_GLOBAL_CACHE => false,
                CURLOPT_DNS_CACHE_TIMEOUT => 0,
            ]
        ])->withoutVerifying()->withHeaders([
            'Authorization' => "Bearer {$this->serviceKey}",
        ])->post("{$this->supabaseUrl}/storage/v1/object/sign/{$this->bucket}/{$filePath}", [
            'expiresIn' => $expiresIn,
        ]);

        if ($response->failed()) {
            return $this->getPublicUrl($filePath);
        }

        $signedUrl = $response->json('signedURL', '');
        return "{$this->supabaseUrl}/storage/v1{$signedUrl}";
    }

    /**
     * Delete a file from Supabase Storage.
     */
    public function delete(string $filePath): bool
    {
        $response = Http::withoutVerifying()->withHeaders([
            'Authorization' => "Bearer {$this->serviceKey}",
        ])->delete("{$this->supabaseUrl}/storage/v1/object/{$this->bucket}", [
            'prefixes' => [$filePath],
        ]);

        return $response->successful();
    }

    /**
     * Upload a raw content string (e.g. generated XLSX bytes).
     */
    public function uploadRaw(string $content, string $filePath, string $mimeType): array
    {
        $response = Http::withoutVerifying()->withHeaders([
            'Authorization' => "Bearer {$this->serviceKey}",
            'Content-Type'  => $mimeType,
            'x-upsert'     => 'true',
        ])->withBody($content, $mimeType)
          ->post("{$this->supabaseUrl}/storage/v1/object/{$this->bucket}/{$filePath}");

        if ($response->failed()) {
            throw new \Exception(
                "Failed to upload file to Supabase Storage: " . $response->body()
            );
        }

        return [
            'path' => $filePath,
            'url'  => $this->getPublicUrl($filePath),
        ];
    }
}
