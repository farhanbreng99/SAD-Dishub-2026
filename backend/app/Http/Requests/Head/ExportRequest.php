<?php

namespace App\Http\Requests\Head;

use Illuminate\Foundation\Http\FormRequest;

class ExportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_from'      => ['nullable', 'date'],
            'date_to'        => ['nullable', 'date', 'after_or_equal:date_from'],
            'division_id'    => ['nullable', 'exists:divisions,id'],
            'status'         => ['nullable', 'in:pending,reviewing,accepted,rejected'],
            'applicant_type' => ['nullable', 'in:slta,mahasiswa,fresh_graduate,instansi'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_to.after_or_equal' => 'Tanggal akhir harus setelah atau sama dengan tanggal awal.',
            'division_id.exists'     => 'Divisi tidak ditemukan.',
            'status.in'              => 'Status tidak valid.',
            'applicant_type.in'      => 'Tipe pemohon tidak valid.',
        ];
    }
}
