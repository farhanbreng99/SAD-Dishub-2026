<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'         => ['required', 'string', 'min:8', 'confirmed'],
            'applicant_type'   => ['required', 'in:slta,mahasiswa,fresh_graduate,instansi'],
            'institution_name' => ['required', 'string', 'max:255'],
            'phone'            => ['required', 'string', 'max:20'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'             => 'Nama lengkap wajib diisi.',
            'email.required'            => 'Email wajib diisi.',
            'email.unique'              => 'Email sudah terdaftar.',
            'password.required'         => 'Password wajib diisi.',
            'password.min'              => 'Password minimal 8 karakter.',
            'password.confirmed'        => 'Konfirmasi password tidak cocok.',
            'applicant_type.required'   => 'Tipe pemohon wajib diisi.',
            'applicant_type.in'         => 'Tipe pemohon harus: slta, mahasiswa, fresh_graduate, atau instansi.',
            'institution_name.required' => 'Nama institusi wajib diisi.',
            'phone.required'            => 'Nomor telepon wajib diisi.',
        ];
    }
}
