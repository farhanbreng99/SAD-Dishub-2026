<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Supabase Configuration
    |--------------------------------------------------------------------------
    */

    'supabase' => [
        'url'            => env('SUPABASE_URL'),
        'key'            => env('SUPABASE_KEY'),
        'service_key'    => env('SUPABASE_SERVICE_KEY'),
        'storage_bucket' => env('SUPABASE_STORAGE_BUCKET', 'e-internship-documents'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Algorithm Configuration
    |--------------------------------------------------------------------------
    */

    'algorithm' => [
        'score_threshold' => env('ALGORITHM_SCORE_THRESHOLD', 60),
    ],

];
