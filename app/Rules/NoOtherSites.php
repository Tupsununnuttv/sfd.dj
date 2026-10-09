<?php

namespace App\Rules;

use App\Support\LinkGuard;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/** The text may not point people at other sites: only SFD.DJ and our partners (App\Support\LinkGuard). SFD.DJ staff may write anything. */
class NoOtherSites implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (is_string($value) && ! request()->user()?->is_staff && ($why = LinkGuard::check($value))) {
            $fail($why);
        }
    }
}
