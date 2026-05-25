<?php

namespace App\Http\Requests\Applicant;

use Illuminate\Foundation\Http\FormRequest;

class UploadDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cv'           => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],   // 5MB
            'cover_letter' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],   // 5MB
            'id_card'      => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:3072'], // 3MB
            'proposal'     => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:10240'],   // 10MB
        ];
    }

    public function messages(): array
    {
        return [
            'cv.mimes'           => 'CV harus berformat PDF, DOC, atau DOCX.',
            'cv.max'             => 'Ukuran CV maksimal 5MB.',
            'cover_letter.mimes' => 'Surat pengantar harus berformat PDF, DOC, atau DOCX.',
            'cover_letter.max'   => 'Ukuran surat pengantar maksimal 5MB.',
            'id_card.mimes'      => 'Kartu identitas harus berformat PDF, JPG, atau PNG.',
            'id_card.max'        => 'Ukuran kartu identitas maksimal 3MB.',
            'proposal.mimes'     => 'Proposal harus berformat PDF, DOC, atau DOCX.',
            'proposal.max'       => 'Ukuran proposal maksimal 10MB.',
        ];
    }
}
