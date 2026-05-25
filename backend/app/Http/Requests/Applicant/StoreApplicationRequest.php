<?php

namespace App\Http\Requests\Applicant;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'division_id'      => ['required', 'exists:divisions,id'],
            'institution_name' => ['required', 'string', 'max:255'],
            'study_program'    => ['nullable', 'string', 'max:255'],
            'internship_start' => ['required', 'date', 'after_or_equal:today'],
            'internship_end'   => ['required', 'date', 'after:internship_start'],
        ];
    }

    public function messages(): array
    {
        return [
            'division_id.required'         => 'Divisi tujuan wajib dipilih.',
            'division_id.exists'           => 'Divisi yang dipilih tidak ditemukan.',
            'institution_name.required'    => 'Nama institusi wajib diisi.',
            'internship_start.required'    => 'Tanggal mulai magang wajib diisi.',
            'internship_start.after_or_equal' => 'Tanggal mulai magang tidak boleh di masa lampau.',
            'internship_end.required'      => 'Tanggal selesai magang wajib diisi.',
            'internship_end.after'         => 'Tanggal selesai harus setelah tanggal mulai.',
        ];
    }
}
