<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\WordGuard;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Slurs and words about abusing children never go out on SFD-DJ.EU: not in room chat, not through the API, not in a whisper, not even from staff. */
class WordGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_words_are_found_also_when_hidden_and_ordinary_words_pass(): void
    {
        foreach (['you pedofiil', 'PEDOPHILE', 'such a pdf', 'pede', 'litsid', 'see on lits!', 'p e d e', 'p.e.d.e', 'l1ts', 'pedofiiil', 'liiiits', 'реdе', 'neeger', 'faggot', 'пидор'] as $text) {
            $this->assertSame(WordGuard::MESSAGE, WordGuard::check($text), $text);
        }
        foreach (['politsei tuli', 'litsents', 'pedestal', 'centipede', 'torpedo', 'hooray!', 'she plays the fagott', 'speedo', 'pedagoog', 'a b c', 'version 1.5', 'great set :7tv:01PDF2: wow', ''] as $text) {
            $this->assertNull(WordGuard::check($text), $text);
        }
    }

    public function test_room_chat_and_whispers_refuse_them_for_everybody(): void
    {
        $room = User::factory()->create()->rooms()->create(['name' => 'Words', 'slug' => 'words']);
        $me = User::factory()->create();
        $staff = User::factory()->create();
        $staff->forceFill(['roles' => ['admin']])->save();

        $this->actingAs($me)->postJson('/rooms/words/messages', ['body' => 'you are a pdf'])->assertStatus(422)->assertJsonPath('errors.body.0', WordGuard::MESSAGE);
        $this->actingAs($staff)->postJson('/rooms/words/messages', ['body' => 'L I T S'])->assertStatus(422);
        $this->assertSame(0, $room->messages()->count());
        $this->assertTrue($room->logs()->where('action', 'automod')->where('details', 'like', '%pdf%')->exists()); // the moderators see who tried
        $this->actingAs($me)->postJson('/rooms/words/messages', ['body' => 'politsei, this track is great'])->assertNoContent();

        $this->actingAs($staff)->postJson('/api/whispers', ['user_id' => $me->id, 'body' => 'pedofiil'])->assertStatus(422)->assertJsonPath('message', WordGuard::MESSAGE);
        $this->actingAs($me)->postJson('/api/whispers', ['user_id' => $staff->id, 'body' => 'hi there'])->assertCreated();
    }
}
