<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * The Avatar shop has all-new badges, accessories, frames and effects. Nobody keeps wearing one of the old ones: whatever a user wears that is not among the new
 * items is taken off. What they already picked from the new ones stays.
 */
return new class extends Migration
{
    /** The items of the new shop, as they were when it was made. */
    private const NEW = [
        'badge' => ['rookie', 'selector', 'digger', 'bassline', 'streak', 'nightowl', 'voltage', 'goldenear', 'diamond', 'spotlight', 'platinum', 'laureate', 'royal', 'cosmic', 'dragonseal', 'legend'],
        'accessory' => ['headphones', 'shades', 'cap', 'beanie', 'catears', 'foxears', 'flowers', 'halo', 'visor', 'laurel', 'horns', 'tophat', 'crown', 'wings', 'dragon', 'phoenix'],
        'frame' => ['bronze', 'silver', 'gold', 'neon', 'carbon', 'emerald', 'vinyl', 'equalizer', 'thorns', 'frost', 'hellfire', 'aurora', 'prism'],
        'effect' => ['glow', 'waves', 'sparkles', 'notes', 'hearts', 'petals', 'snow', 'flames', 'lightning', 'toxic', 'cosmic', 'void'],
    ];

    public function up(): void
    {
        DB::table('users')->whereNotNull('cosmetics')->get(['id', 'cosmetics'])->each(function ($user) {
            $worn = json_decode($user->cosmetics, true) ?: [];
            $kept = array_filter($worn, fn ($key, $slot) => in_array($key, self::NEW[$slot] ?? [], true), ARRAY_FILTER_USE_BOTH);

            if ($kept !== $worn) {
                DB::table('users')->where('id', $user->id)->update(['cosmetics' => $kept ? json_encode($kept) : null]);
            }
        });
    }

    public function down(): void
    {
        // what people wore is gone; they pick again
    }
};
