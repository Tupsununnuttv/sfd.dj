<?php

namespace Tests\Feature;

use App\Models\Room;
use App\Models\RoomBackgroundAsset;
use App\Models\RoomMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Room settings managers can upload a custom room picture, which is served to everybody in the room. */
class BackgroundUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_background_survives_missing_deployment_storage_and_disk_changes(): void
    {
        $disk = $this->fakeUploads();
        $host = User::factory()->create();
        $room = $this->room($host);
        $image = $this->png(1600, 900);
        $bytes = $image->get();
        $this->actingAs($host)->post("/rooms/{$room->slug}/background", ['image' => $image])->assertSessionHasNoErrors();
        $name = $room->refresh()->custom_background;
        $this->assertDatabaseHas('room_background_assets', ['room_id' => $room->id, 'name' => $name]);
        Storage::disk($disk)->delete("room-backgrounds/{$name}");
        $this->fakeUploads(); // The next release can use a fresh filesystem without losing the image.
        $response = $this->get(route('media.room', $name))->assertOk()->assertContent($bytes)->assertHeader('Content-Type', 'image/png');
        $this->get(route('media.room', $name), ['If-None-Match' => $response->headers->get('ETag')])->assertStatus(304);
        $this->delete("/rooms/{$room->slug}/background")->assertRedirect();
        $this->assertDatabaseMissing('room_background_assets', ['room_id' => $room->id]);
        $this->get(route('media.room', $name))->assertNotFound();
    }

    public function test_existing_background_files_can_be_archived_without_reuploading(): void
    {
        $disk = $this->fakeUploads();
        $host = User::factory()->create();
        $room = $this->room($host);
        $name = str_repeat('a', 24).'.png';
        $bytes = $this->png(800, 450)->get();
        $room->update(['background' => 'custom', 'custom_background' => $name]);
        Storage::disk($disk)->put("room-backgrounds/{$name}", $bytes);
        $this->artisan('room-backgrounds:archive')->assertSuccessful();
        $this->artisan('room-backgrounds:archive')->assertSuccessful();
        $this->assertSame(1, RoomBackgroundAsset::count());
        Storage::disk($disk)->delete("room-backgrounds/{$name}");
        $this->get(route('media.room', $name))->assertOk()->assertContent($bytes);
    }

    public function test_seasons_do_not_replace_a_personal_picture_unless_explicitly_selected(): void
    {
        $host = User::factory()->create();
        $room = $this->room($host);
        $room->update(['background' => 'custom', 'custom_background' => str_repeat('b', 24).'.png']);
        $this->travelTo(Carbon::parse('2026-12-24 12:00:00'));
        $this->assertSame('custom', $room->shownBackground());
        $room->pickBackground('christmas');
        $room->save();
        $this->assertSame('christmas', $room->shownBackground());
    }

    /** A real PNG of that size, made by hand (the tests have no GD to draw one). */
    private function png(int $w, int $h, string $name = 'wall.png'): UploadedFile
    {
        $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $row = chr(0).str_repeat(chr(64), $w);
        $bytes = hex2bin('89504e470d0a1a0a').$chunk('IHDR', pack('NNCCCCC', $w, $h, 8, 0, 0, 0, 0)).$chunk('IDAT', gzcompress(str_repeat($row, $h))).$chunk('IEND', '');

        file_put_contents($path = tempnam(sys_get_temp_dir(), 'bg'), $bytes);

        return new UploadedFile($path, $name, 'image/png', null, true);
    }

    private function room(User $host): Room
    {
        return $host->rooms()->create(['name' => 'Lobby', 'slug' => 'lobby-bg']);
    }

    private function fakeUploads(): string
    {
        $disk = 'room-uploads-'.bin2hex(random_bytes(8));
        config(['filesystems.uploads' => $disk]);
        config(["filesystems.disks.{$disk}.driver" => 'local']);
        Storage::fake($disk);

        return $disk;
    }

    public function test_the_host_uploads_a_picture_and_it_goes_on_at_once(): void
    {
        $disk = $this->fakeUploads();
        $host = User::factory()->create();
        $room = $this->room($host);

        $this->actingAs($host)->post("/rooms/{$room->slug}/background", ['image' => $this->png(1600, 900, 'wall.png')])->assertSessionHasNoErrors();

        $room->refresh();
        $this->assertSame('custom', $room->background);
        $this->assertMatchesRegularExpression('/^[a-f0-9]{24}\.png$/', $room->custom_background);
        Storage::disk($disk)->assertExists("room-backgrounds/{$room->custom_background}");

        $this->actingAs($host)->get("/rooms/{$room->slug}")->assertInertia(fn (Assert $page) => $page
            ->where('room.background', 'custom')
            ->where('room.custom_background_url', route('media.room', $room->custom_background)));

        // everybody can see the picture, guests too; a made-up name is nothing
        $this->app['auth']->forgetGuards();
        $this->get(route('media.room', $room->custom_background))->assertOk()->assertHeader('Content-Type', 'image/png');
        $this->get('/media/room/not-a-picture.png')->assertNotFound();

        // a new picture replaces the old one and its file
        $old = $room->custom_background;
        $this->actingAs($host)->post("/rooms/{$room->slug}/background", ['image' => $this->png(1280, 720, 'wall2.jpg')])->assertSessionHasNoErrors();
        Storage::disk($disk)->assertMissing("room-backgrounds/{$old}");
        $this->assertNotSame($old, $room->refresh()->custom_background);
    }

    public function test_room_settings_managers_can_upload_and_remove_pictures_but_other_members_cannot(): void
    {
        $disk = $this->fakeUploads();
        $host = User::factory()->create();
        $room = $this->room($host);
        $manager = User::factory()->create();
        $role = $room->roles()->where('name', 'Manager')->first();
        RoomMember::create(['room_id' => $room->id, 'user_id' => $manager->id, 'room_role_id' => $role->id]);

        $this->actingAs($manager)->post("/rooms/{$room->slug}/background", ['image' => $this->png(1600, 900, 'wall.png')])->assertSessionHasNoErrors();
        $file = $room->refresh()->custom_background;
        Storage::disk($disk)->assertExists("room-backgrounds/{$file}");
        $this->actingAs($manager)->delete("/rooms/{$room->slug}/background")->assertRedirect();
        $this->assertNull($room->refresh()->custom_background);
        Storage::disk($disk)->assertMissing("room-backgrounds/{$file}");

        $member = User::factory()->create();
        $room->members()->create(['user_id' => $member->id, 'room_role_id' => $room->roles()->where('name', 'Bouncer')->value('id')]);
        $this->actingAs($member)->post("/rooms/{$room->slug}/background", ['image' => $this->png(1600, 900, 'wall.png')])->assertForbidden();
        $this->actingAs($member)->delete("/rooms/{$room->slug}/background")->assertForbidden();
        $this->app['auth']->forgetGuards();
        $this->post("/rooms/{$room->slug}/background", ['image' => $this->png(1600, 900, 'wall.png')])->assertRedirect(route('login'));

        $this->actingAs($host)->post("/rooms/{$room->slug}/background", ['image' => $this->png(300, 200, 'tiny.png')])->assertSessionHasErrors('image');
        $this->actingAs($host)->post("/rooms/{$room->slug}/background", ['image' => UploadedFile::fake()->create('wall.svg', 10, 'image/svg+xml')])->assertSessionHasErrors('image');
        $this->actingAs($host)->post("/rooms/{$room->slug}/background", ['image' => UploadedFile::fake()->create('wall.php', 10, 'text/x-php')])->assertSessionHasErrors('image');
        $this->actingAs($host)->post("/rooms/{$room->slug}/background", [])->assertSessionHasErrors('image');
        $this->assertNull($room->refresh()->custom_background);
    }

    public function test_your_picture_can_only_be_picked_once_it_exists_and_removing_it_takes_it_off(): void
    {
        Storage::fake('local');
        $host = User::factory()->create();
        $room = $this->room($host);

        $this->actingAs($host)->patch("/rooms/{$room->slug}", ['name' => 'Lobby', 'background' => 'custom'])->assertSessionHasErrors('background');

        $this->actingAs($host)->post("/rooms/{$room->slug}/background", ['image' => $this->png(1600, 900, 'wall.webp')]);
        $file = $room->refresh()->custom_background;
        $this->actingAs($host)->patch("/rooms/{$room->slug}", ['name' => 'Lobby', 'background' => 'midnight'])->assertSessionHasNoErrors();
        $this->assertSame($file, $room->refresh()->custom_background, 'it is kept for later');
        $this->actingAs($host)->patch("/rooms/{$room->slug}", ['name' => 'Lobby', 'background' => 'custom'])->assertSessionHasNoErrors();

        $this->actingAs($host)->delete("/rooms/{$room->slug}/background")->assertRedirect();
        $room->refresh();
        $this->assertNull($room->custom_background);
        $this->assertNull($room->background, 'the room goes back to the default');
        Storage::disk('local')->assertMissing("room-backgrounds/{$file}");
    }
}
