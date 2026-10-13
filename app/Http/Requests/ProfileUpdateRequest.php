<?php

namespace App\Http\Requests;

use App\Models\Room;
use App\Models\User;
use App\Rules\NoOtherSites;
use App\Support\Countries;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['sometimes', 'required', 'string', 'min:3', 'max:20', 'regex:/^[A-Za-z0-9_]+$/', function (string $attribute, mixed $value, Closure $fail) {
                if (User::whereRaw('lower(username) = ?', [mb_strtolower($value)])->when(request()->user(), fn ($q, $me) => $q->where('id', '!=', $me->id))->exists()) {
                    $fail('That username is taken.');
                }
            }],
            'name' => ['required', 'string', 'max:30', new NoOtherSites],
            'bio' => ['nullable', 'string', 'max:500', new NoOtherSites],
            'country' => ['nullable', Rule::in(array_keys(Countries::ALL))],
            'pronouns' => ['nullable', 'string', 'max:24', new NoOtherSites],
            'favorite_genre' => ['nullable', Rule::in(Room::GENRES)],
            'email' => [
                'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
        ];
    }
}
