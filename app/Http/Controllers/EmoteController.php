<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * BetterTTV and 7TV emotes for chat. Lists come from their public APIs and are cached; the images load straight
 * from their CDNs (see lib/emotes.ts). A chat message carries an emote as the token ":bttv:<id>:" or ":7tv:<id>:".
 * ponytail: BetterTTV's search API now needs a login, so BTTV shows its global set only; 7TV can search everything.
 */
class EmoteController extends Controller
{
    /** The global emote sets: [{id, name}] for each service. */
    public function index(): JsonResponse
    {
        $sets = Cache::get('emotes.global') ?? ['bttv' => $this->bttvGlobal(), '7tv' => $this->sevenTvGlobal()];

        // do not remember a failed fetch
        ($sets['bttv'] || $sets['7tv']) && Cache::put('emotes.global', $sets, now()->addHours(6));

        return response()->json($sets);
    }

    /** Search 7TV by name. */
    public function search(Request $request): JsonResponse
    {
        $q = trim($request->validate(['q' => ['required', 'string', 'min:2', 'max:40']])['q']);
        $key = 'emotes.7tv.'.md5(mb_strtolower($q));

        if (($hit = Cache::get($key)) !== null) {
            return response()->json($hit);
        }

        $res = Http::timeout(8)->post('https://7tv.io/v3/gql', [
            'operationName' => 'SearchEmotes',
            'variables' => ['query' => $q, 'limit' => 40, 'page' => 1, 'sort' => ['value' => 'popularity', 'order' => 'DESCENDING'],
                'filter' => ['category' => 'TOP', 'exact_match' => false, 'case_sensitive' => false, 'ignore_tags' => false, 'zero_width' => false, 'animated' => false, 'aspect_ratio' => '']],
            'query' => 'query SearchEmotes($query: String!, $page: Int, $sort: Sort, $limit: Int, $filter: EmoteSearchFilter) { emotes(query: $query, page: $page, sort: $sort, limit: $limit, filter: $filter) { items { id name } } }',
        ]);
        abort_unless($res->ok(), 503, '7TV is not reachable right now.');

        $items = collect($res->json('data.emotes.items', []))->map(fn ($e) => ['id' => $e['id'], 'name' => $e['name']])->values()->all();
        Cache::put($key, $items, now()->addHour());

        return response()->json($items);
    }

    private function bttvGlobal(): array
    {
        $res = Http::timeout(8)->get('https://api.betterttv.net/3/cached/emotes/global');

        return $res->ok() ? collect($res->json())->map(fn ($e) => ['id' => $e['id'], 'name' => $e['code']])->values()->all() : [];
    }

    private function sevenTvGlobal(): array
    {
        $res = Http::timeout(8)->get('https://7tv.io/v3/emote-sets/global');

        return $res->ok() ? collect($res->json('emotes', []))->map(fn ($e) => ['id' => $e['id'], 'name' => $e['name']])->values()->all() : [];
    }
}
