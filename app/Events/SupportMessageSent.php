<?php

namespace App\Events;

use App\Models\SupportMessage;
use App\Models\SupportTicket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/** Goes to the staff inbox, and to the visitor's own chat (their channel name contains their secret token). */
class SupportMessageSent implements ShouldBroadcastNow
{
    use Dispatchable;

    public function __construct(public SupportTicket $ticket, public SupportMessage $message) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('support-staff'), new Channel('support.'.$this->ticket->token)];
    }

    public function broadcastAs(): string
    {
        return 'support-message';
    }

    public function broadcastWith(): array
    {
        return ['ticket_id' => $this->ticket->id, 'message' => $this->message->payload()];
    }
}
