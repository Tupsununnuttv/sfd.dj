<?php

namespace App\Http\Controllers;

use App\Models\SupportTicket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Live support. Visitors (no account needed) talk through a secret token; staff answer from the Admin panel.
 * ponytail: no "agent is online" detection; staff see new chats live in the inbox, visitors can leave an email to be reached later.
 */
class SupportController extends Controller
{
    /** A visitor opens a conversation. */
    public function open(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:40'],
            'email' => ['nullable', 'email', 'max:255'],
            'body' => ['required', 'string', 'max:1000'],
        ]);

        $ticket = SupportTicket::create(['name' => $data['name'], 'email' => $data['email'] ?? null]);
        $ticket->say('visitor', $data['body']);

        return response()->json(['token' => $ticket->token] + $this->thread($ticket), 201);
    }

    /** The visitor's own conversation. */
    public function show(string $token): JsonResponse
    {
        return response()->json($this->thread(SupportTicket::where('token', $token)->firstOrFail()));
    }

    public function send(Request $request, string $token): JsonResponse
    {
        $ticket = SupportTicket::where('token', $token)->firstOrFail();
        $body = $request->validate(['body' => ['required', 'string', 'max:1000']])['body'];
        abort_if($ticket->messages()->count() >= SupportTicket::MAX_MESSAGES, 429, 'This conversation is full. Please start a new one.');

        // writing again after staff closed it reopens it
        return response()->json(['message' => $ticket->say('visitor', $body)->payload()], 201);
    }

    // ---- staff (Admin panel → Support) ----

    public function inbox(Request $request): JsonResponse
    {
        $this->staff($request);

        return response()->json(
            SupportTicket::orderByRaw("status = 'open' desc")->orderByDesc('last_message_at')->limit(100)->get()->map->summary()->values()
        );
    }

    public function conversation(Request $request, SupportTicket $ticket): JsonResponse
    {
        $this->staff($request);

        return response()->json($this->thread($ticket) + ['ticket' => $ticket->summary()]);
    }

    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $staff = $this->staff($request);
        $body = $request->validate(['body' => ['required', 'string', 'max:1000']])['body'];

        return response()->json(['message' => $ticket->say('staff', $body, $staff)->payload()], 201);
    }

    public function status(Request $request, SupportTicket $ticket): JsonResponse
    {
        $this->staff($request);
        $ticket->update($request->validate(['status' => ['required', 'in:open,closed']]));

        return response()->json($ticket->summary());
    }

    private function staff(Request $request)
    {
        abort_unless($request->user()?->hasPermission('support.manage'), 403);

        return $request->user();
    }

    private function thread(SupportTicket $ticket): array
    {
        return [
            'name' => $ticket->name,
            'status' => $ticket->status,
            'messages' => $ticket->messages()->with('staff:id,name')->get()->map->payload()->values(),
        ];
    }
}
