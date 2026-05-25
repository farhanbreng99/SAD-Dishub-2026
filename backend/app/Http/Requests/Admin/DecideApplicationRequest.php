<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DecideApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'decision'         => ['required', 'in:accepted,rejected'],
            'division_id'      => ['required_if:decision,accepted', 'exists:divisions,id'],
            'rejection_reason' => ['required_if:decision,rejected', 'string', 'max:1000'],
            'admin_note'       => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'decision.required'            => 'Keputusan wajib diisi.',
            'decision.in'                  => 'Keputusan harus accepted atau rejected.',
            'division_id.required_if'      => 'Divisi tujuan wajib dipilih untuk penerimaan.',
            'division_id.exists'           => 'Divisi yang dipilih tidak ditemukan.',
            'rejection_reason.required_if' => 'Alasan penolakan wajib diisi.',
        ];
    }
}
