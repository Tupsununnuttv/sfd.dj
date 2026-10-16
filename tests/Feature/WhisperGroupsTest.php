<?php

namespace Tests\Feature;

use App\Events\WhisperGroupChanged;
use App\Events\WhisperSent;
use App\Models\Friendship;
use App\Models\User;
use App\Models\Whisper;
use App\Models\WhisperGroup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WhisperGroupsTest extends TestCase
{
    use RefreshDatabase;

    private function befriend(User $a, User ...$others): void
    {
        foreach ($others as $other) {
            Friendship::create(['user_id' => $a->id, 'friend_id' => $other->id, 'status' => 'accepted']);
        }
    }

    /** A group made straight in the database: the owner first, then the others. */
    private function group(User $owner, array $others, string $name = 'Crew'): WhisperGroup
    {
        $group = WhisperGroup::create(['name' => $name, 'owner_id' => $owner->id]);
        $group->admit([$owner, ...$others]);

        return $group;
    }

    private function wav(): string
    {
        $data = str_repeat("\x80", 800);

        return 'RIFF'.pack('V', 36 + strlen($data)).'WAVEfmt '.pack('VvvVVvv', 16, 1, 1, 8000, 8000, 1, 8).'data'.pack('V', strlen($data)).$data;
    }

    private function channels(WhisperSent|WhisperGroupChanged $event): array
    {
        return collect($event->broadcastOn())->map->name->sort()->values()->all();
    }

    public function test_a_group_is_made_of_your_friends_and_you_own_it(): void
    {
        Event::fake([WhisperSent::class, WhisperGroupChanged::class]);
        [$a, $b, $c, $stranger] = User::factory()->count(4)->create();
        $this->befriend($a, $b, $c);

        $made = $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => '  Crew  ', 'user_ids' => [$b->id, $c->id]])->assertCreated()
            ->assertJsonPath('name', 'Crew')->assertJsonPath('owner_id', $a->id)->assertJsonCount(3, 'members');
        $group = WhisperGroup::findOrFail($made->json('id'));
        Event::assertDispatched(WhisperGroupChanged::class, fn ($e) => $e->groupId === $group->id && $this->channels($e) === collect([$a, $b, $c])->map(fn ($u) => "private-App.Models.User.{$u->id}")->sort()->values()->all());

        // only friends, at least one, with a name nobody may not use, and not more than the group holds
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => 'Nope', 'user_ids' => [$stranger->id]])->assertStatus(422)->assertJsonPath('message', 'You can only add your friends.');
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => 'Nope', 'user_ids' => []])->assertJsonValidationErrors('user_ids');
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => '   ', 'user_ids' => [$b->id]])->assertJsonValidationErrors('name');
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => 'the pdf club', 'user_ids' => [$b->id]])->assertStatus(422);
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => 'see plug.dj', 'user_ids' => [$b->id]])->assertStatus(422);
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => 'Big', 'user_ids' => range(1000, 1019)])->assertJsonValidationErrors('user_ids');
        $this->assertSame(1, WhisperGroup::count());

        // somebody who takes no whispers cannot be put in a group either
        $c->forceFill(['preferences' => ['privacy' => ['whispers' => 'nobody']]])->save();
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => 'Quiet', 'user_ids' => [$c->id]])->assertForbidden();

        // groups you own are limited
        foreach (range(2, WhisperGroup::MAX_OWNED) as $n) {
            $this->group($a, [$b], "Group {$n}");
        }
        $this->actingAs($a)->postJson('/api/whisper-groups', ['name' => 'One too many', 'user_ids' => [$b->id]])->assertStatus(422);

        // the friends list for the picker, and the list of your groups
        $this->actingAs($a)->getJson('/api/whisper-groups/friends')->assertOk()->assertJsonCount(2)->assertJsonPath('0.name', $b->name < $c->name ? $b->name : $c->name);
        $this->actingAs($b)->getJson('/api/whisper-groups')->assertOk()->assertJsonCount(WhisperGroup::MAX_OWNED)->assertJsonPath('0.group.members.0.id', $a->id);
        $this->actingAs($stranger)->getJson('/api/whisper-groups')->assertOk()->assertJsonCount(0);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/whisper-groups')->assertUnauthorized();
    }

    public function test_whispers_to_a_group_reach_every_member_and_nobody_else(): void
    {
        Event::fake([WhisperSent::class, WhisperGroupChanged::class]);
        Storage::fake(config('filesystems.uploads'));
        [$a, $b, $c, $outsider] = User::factory()->count(4)->create();
        $group = $this->group($a, [$b, $c]);
        $other = $this->group($b, [$c], 'Other');

        // it goes to the three of them (the sender's other tabs too), and carries who wrote it and which group it is for
        $hello = $this->actingAs($a)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'hi all :7tv:01F6MQ33FG000FSP42K4V0K9M3:'])->assertCreated()
            ->assertJsonPath('message.group_id', $group->id)->assertJsonPath('message.to_id', null)->assertJsonPath('message.from.id', $a->id)->assertJsonPath('group.name', 'Crew')->json('message.id');
        Event::assertDispatched(WhisperSent::class, fn ($e) => $e->whisper->id === $hello && $this->channels($e) === collect([$a, $b, $c])->map(fn ($u) => "private-App.Models.User.{$u->id}")->sort()->values()->all()
            && $e->broadcastWith()['group'] === ['id' => $group->id, 'name' => 'Crew'] && $e->broadcastWith()['from']['id'] === $a->id);

        // not into a group you are not in, and the guards of whispers hold there too
        $this->actingAs($outsider)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'let me in'])->assertNotFound();
        $this->actingAs($a)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'a pdf for you'])->assertStatus(422);
        $this->actingAs($a)->postJson('/api/whispers', ['group_id' => $group->id])->assertJsonValidationErrors('body');
        $this->assertSame(1, Whisper::count());

        // the others have it unread (the writer does not), in the list and in the red number of the menu; people's whispers do not list it
        $this->actingAs($b)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('unreadWhispers', 1));
        $this->actingAs($a)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('unreadWhispers', 0));
        $this->actingAs($b)->getJson('/api/whisper-groups')->assertJsonPath('0.unread', 1)->assertJsonPath('0.last.id', $hello)->assertJsonPath('0.last.from.id', $a->id)->assertJsonPath('1.last', null);
        $this->actingAs($b)->getJson('/api/whispers')->assertJsonCount(0);
        $this->actingAs($b)->getJson("/api/whispers/{$a->id}")->assertJsonCount(0, 'messages');

        // opening it reads it; a later one is read with the "on screen" call
        $this->actingAs($b)->getJson("/api/whisper-groups/{$group->id}")->assertOk()->assertJsonCount(1, 'messages')->assertJsonPath('messages.0.body', 'hi all :7tv:01F6MQ33FG000FSP42K4V0K9M3:')->assertJsonPath('group.members.0.id', $a->id);
        $this->actingAs($b)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('unreadWhispers', 0));
        $this->actingAs($c)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'hello'])->assertCreated();
        $this->actingAs($b)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('unreadWhispers', 1));
        $this->actingAs($b)->postJson("/api/whisper-groups/{$group->id}/read")->assertNoContent();
        $this->actingAs($b)->get('/dashboard')->assertInertia(fn (Assert $p) => $p->where('unreadWhispers', 0));
        $this->actingAs($outsider)->getJson("/api/whisper-groups/{$group->id}")->assertNotFound();
        $this->actingAs($outsider)->postJson("/api/whisper-groups/{$group->id}/read")->assertNotFound();

        // a reply may only answer a whisper of the same group
        $this->actingAs($b)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'right', 'reply_to_id' => $hello])->assertCreated()
            ->assertJsonPath('message.reply.id', $hello)->assertJsonPath('message.reply.from_id', $a->id)->assertJsonPath('message.reply.body', 'hi all :7tv:01F6MQ33FG000FSP42K4V0K9M3:');
        $this->actingAs($c)->postJson('/api/whispers', ['group_id' => $other->id, 'body' => 'elsewhere', 'reply_to_id' => $hello])->assertCreated()->assertJsonPath('message.reply', null);
        $this->actingAs($c)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => 'privately', 'reply_to_id' => $hello])->assertCreated()->assertJsonPath('message.reply', null);

        // a voice message to the group: its members hear it, nobody else
        $voice = $this->actingAs($a)->postJson('/api/whispers/voice', ['group_id' => $group->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 3, 'reply_to_id' => $hello])
            ->assertCreated()->assertJsonPath('message.voice.seconds', 3)->assertJsonPath('message.reply.id', $hello)->json('message.id');
        $this->actingAs($b)->get("/api/whispers/{$voice}/audio")->assertOk()->assertHeader('Content-Type', 'audio/wav');
        $this->actingAs($a)->get("/api/whispers/{$voice}/audio")->assertOk();
        $this->actingAs($outsider)->get("/api/whispers/{$voice}/audio")->assertNotFound();
        $this->actingAs($outsider)->postJson('/api/whispers/voice', ['group_id' => $group->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 1])->assertNotFound();

        // 1:1 whispers are as they were, and the list of people never shows a group's whispers
        $this->actingAs($a)->postJson('/api/whispers', ['user_id' => $b->id, 'body' => 'just us'])->assertCreated()->assertJsonPath('message.group_id', null)->assertJsonPath('message.from', null);
        $this->actingAs($a)->getJson('/api/whispers')->assertJsonCount(1)->assertJsonPath('0.user.id', $b->id)->assertJsonPath('0.last.body', 'just us');
    }

    public function test_people_come_and_go_and_a_newcomer_reads_nothing_from_before(): void
    {
        Event::fake([WhisperSent::class, WhisperGroupChanged::class]);
        Storage::fake(config('filesystems.uploads'));
        [$a, $b, $c, $d, $stranger] = User::factory()->count(5)->create();
        $this->befriend($a, $b, $c, $d);
        $this->befriend($b, $stranger);
        $group = $this->group($a, [$b]);

        $this->actingAs($a)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'before you came'])->assertCreated();
        $voice = $this->actingAs($a)->postJson('/api/whispers/voice', ['group_id' => $group->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 2])->json('message.id');

        // only the owner adds, only friends of theirs, and those already in are skipped
        $this->actingAs($b)->postJson("/api/whisper-groups/{$group->id}/members", ['user_ids' => [$stranger->id]])->assertForbidden();
        $this->actingAs($a)->postJson("/api/whisper-groups/{$group->id}/members", ['user_ids' => [$stranger->id]])->assertStatus(422);
        $this->actingAs($a)->postJson("/api/whisper-groups/{$group->id}/members", ['user_ids' => [$b->id, $c->id]])->assertOk()->assertJsonCount(3, 'members');
        $this->assertSame(3, $group->members()->count());
        Event::assertDispatched(WhisperGroupChanged::class, fn ($e) => $e->groupId === $group->id && in_array($c->id, $e->userIds, true));

        // the newcomer sees the group, not what was said before: no messages, no red number, no recording
        $this->actingAs($c)->getJson('/api/whisper-groups')->assertJsonCount(1)->assertJsonPath('0.unread', 0)->assertJsonPath('0.last', null);
        $this->actingAs($c)->getJson("/api/whisper-groups/{$group->id}")->assertOk()->assertJsonCount(0, 'messages');
        $this->actingAs($c)->get("/api/whispers/{$voice}/audio")->assertNotFound();
        $this->actingAs($b)->get("/api/whispers/{$voice}/audio")->assertOk();
        $this->actingAs($a)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'welcome'])->assertCreated();
        $this->actingAs($c)->getJson('/api/whisper-groups')->assertJsonPath('0.unread', 1);
        $this->actingAs($c)->getJson("/api/whisper-groups/{$group->id}")->assertJsonCount(1, 'messages')->assertJsonPath('messages.0.body', 'welcome');

        // the group has room for so many
        $crowd = User::factory()->count(WhisperGroup::MAX_MEMBERS)->create();
        $group->admit($crowd->take(WhisperGroup::MAX_MEMBERS - 3));
        $this->assertSame(WhisperGroup::MAX_MEMBERS, $group->members()->count());
        $this->actingAs($a)->postJson("/api/whisper-groups/{$group->id}/members", ['user_ids' => [$d->id]])->assertStatus(422);
        $group->members()->detach($crowd->take(WhisperGroup::MAX_MEMBERS - 3)->modelKeys());

        // only the owner renames, and the name has to pass the same guards
        $this->actingAs($b)->patchJson("/api/whisper-groups/{$group->id}", ['name' => 'Mine now'])->assertForbidden();
        $this->actingAs($a)->patchJson("/api/whisper-groups/{$group->id}", ['name' => 'a pdf'])->assertStatus(422);
        $this->actingAs($a)->patchJson("/api/whisper-groups/{$group->id}", ['name' => ' Night owls '])->assertOk()->assertJsonPath('name', 'Night owls');

        // taking out: the owner takes out anybody, others only themselves; the one who goes hears of it, and the group is gone from their side
        $this->actingAs($b)->deleteJson("/api/whisper-groups/{$group->id}/members/{$c->id}")->assertForbidden();
        $this->actingAs($a)->deleteJson("/api/whisper-groups/{$group->id}/members/{$stranger->id}")->assertNotFound();
        $this->actingAs($a)->deleteJson("/api/whisper-groups/{$group->id}/members/{$c->id}")->assertNoContent();
        Event::assertDispatched(WhisperGroupChanged::class, fn ($e) => $e->groupId === $group->id && $e->removed === $c->id && in_array($c->id, $e->userIds, true) && count($e->userIds) === 3);
        $this->actingAs($c)->getJson("/api/whisper-groups/{$group->id}")->assertNotFound();
        $this->actingAs($c)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'still here?'])->assertNotFound();
        $this->actingAs($c)->getJson('/api/whisper-groups')->assertJsonCount(0);
        $this->actingAs($c)->get("/api/whispers/{$voice}/audio")->assertNotFound();

        // somebody put back in starts afresh
        $this->actingAs($a)->postJson("/api/whisper-groups/{$group->id}/members", ['user_ids' => [$c->id]])->assertOk();
        $this->actingAs($c)->getJson("/api/whisper-groups/{$group->id}")->assertJsonCount(0, 'messages');

        // the owner leaves: the longest-standing member takes over; the last one out ends the group, and its recordings go with it
        $this->actingAs($a)->deleteJson("/api/whisper-groups/{$group->id}/members/{$a->id}")->assertNoContent();
        $this->assertSame($b->id, $group->fresh()->owner_id);
        $this->actingAs($b)->patchJson("/api/whisper-groups/{$group->id}", ['name' => 'B runs it'])->assertOk();
        $this->actingAs($c)->deleteJson("/api/whisper-groups/{$group->id}/members/{$c->id}")->assertNoContent();
        $audio = Whisper::findOrFail($voice)->audioPath();
        Storage::disk(config('filesystems.uploads'))->assertExists($audio);
        $this->actingAs($b)->deleteJson("/api/whisper-groups/{$group->id}/members/{$b->id}")->assertNoContent();
        $this->assertNull(WhisperGroup::find($group->id));
        $this->assertSame(0, Whisper::count());
        Storage::disk(config('filesystems.uploads'))->assertMissing($audio);
    }

    public function test_deleting_an_account_hands_its_groups_on_and_removes_what_it_wrote(): void
    {
        Event::fake([WhisperSent::class, WhisperGroupChanged::class]);
        Storage::fake(config('filesystems.uploads'));
        [$a, $b, $c] = User::factory()->count(3)->create();
        $shared = $this->group($a, [$b]);
        $alone = $this->group($a, [], 'Alone');
        $this->actingAs($a)->postJson('/api/whispers', ['group_id' => $shared->id, 'body' => 'from the owner'])->assertCreated();
        $this->actingAs($b)->postJson('/api/whispers', ['group_id' => $shared->id, 'body' => 'from b'])->assertCreated();
        $voice = $this->actingAs($a)->postJson('/api/whispers/voice', ['group_id' => $alone->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 2])->json('message.id');
        $audio = Whisper::findOrFail($voice)->audioPath();
        $mine = $this->actingAs($a)->postJson('/api/whispers/voice', ['group_id' => $shared->id, 'audio' => UploadedFile::fake()->createWithContent('voice.wav', $this->wav()), 'seconds' => 2])->json('message.id');
        $kept = Whisper::findOrFail($mine)->audioPath();
        Storage::disk(config('filesystems.uploads'))->assertExists([$audio, $kept]);

        $a->delete();

        $this->assertSame($b->id, $shared->fresh()->owner_id);
        $this->assertNull(WhisperGroup::find($alone->id), 'a group with nobody left ends');
        $this->assertSame(['from b'], Whisper::pluck('body')->all());
        Storage::disk(config('filesystems.uploads'))->assertMissing([$audio, $kept]);
        $this->actingAs($b)->getJson('/api/whisper-groups')->assertJsonCount(1)->assertJsonPath('0.group.owner_id', $b->id)->assertJsonCount(1, '0.group.members');
    }

    public function test_the_data_download_names_the_group_of_a_whisper(): void
    {
        Event::fake([WhisperSent::class, WhisperGroupChanged::class]);
        [$a, $b] = User::factory()->count(2)->create();
        $group = $this->group($a, [$b], 'Crew');
        $this->actingAs($a)->postJson('/api/whispers', ['group_id' => $group->id, 'body' => 'to the crew'])->assertCreated();

        $this->actingAs($a)->get(route('settings.export'))->assertOk()->assertJsonPath('whispers.0.group', 'Crew')->assertJsonPath('whispers.0.to', null)->assertJsonPath('whispers.0.body', 'to the crew');
    }
}
