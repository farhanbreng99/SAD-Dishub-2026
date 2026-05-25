<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDivisionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'max_quota' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Additional validation after standard rules pass.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $division = $this->route('division');

            if ($division && $this->max_quota < $division->active_applicants) {
                $validator->errors()->add(
                    'max_quota',
                    "Kuota tidak boleh kurang dari jumlah pendaftar aktif ({$division->active_applicants})."
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'max_quota.required' => 'Kuota maksimal wajib diisi.',
            'max_quota.integer'  => 'Kuota harus berupa bilangan bulat.',
            'max_quota.min'      => 'Kuota minimal 1.',
        ];
    }
}
