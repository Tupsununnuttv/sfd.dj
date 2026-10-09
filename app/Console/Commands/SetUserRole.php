<?php

namespace App\Console\Commands;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Console\Command;

class SetUserRole extends Command
{
    protected $signature = 'user:role {email} {role : e.g. owner, developer, admin} {--remove : Remove the role instead of adding it}';

    protected $description = 'Give a user a role (use this to create the first Owner)';

    public function handle(): int
    {
        $role = Role::tryFrom($this->argument('role'));
        $user = User::where('email', $this->argument('email'))->first();

        if (! $role || ! $user) {
            $this->error($role ? 'No such user.' : 'Unknown role. Valid: '.implode(', ', array_map(fn ($r) => $r->value, Role::assignable())));

            return self::FAILURE;
        }

        $roles = collect($user->roles ?? [])->reject($role->value);
        $user->forceFill(['roles' => ($this->option('remove') ? $roles : $roles->push($role->value))->values()->all()])->save();

        $this->info("{$user->name} is now: ".$user->role()->label());

        return self::SUCCESS;
    }
}
