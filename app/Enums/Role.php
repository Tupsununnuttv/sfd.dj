<?php

namespace App\Enums;

use App\Support\Plans;

/**
 * Declaration order is the rank order: first = most powerful. Everyone without a role is a User (the "member" case).
 * The cases are written in groups (Staff, Staff 2, Creator / Contributor, Community / Status); group() says which is which.
 * The six subscription roles (Premium down to Bronze, named like the plans in App\Support\Plans) are different: nobody hands them out. Somebody has one exactly
 * while they have that subscription (User::subscriptionRole), so they are not stored, not in the permissions matrix and not synced to Discord (see manual()).
 */
enum Role: string
{
    // Staff
    case Owner = 'owner';
    case Developer = 'developer';
    case Admin = 'admin';
    case LeadModerator = 'lead_moderator';
    case BrandAmbassador = 'brand_ambassador';
    case SiteModerator = 'site_moderator';
    case Moderator = 'moderator';

    // Staff 2
    case Helper = 'helper';
    case Promoter = 'promoter';
    case Translator = 'translator';

    // Creator / Contributor
    case ContentProvider = 'content_provider';
    case MusicProducer = 'music_producer';
    case Artist = 'artist';

    // Community / Status
    case Partnership = 'partnership';
    case Vip = 'vip';
    case EarlySupporter = 'early_supporter';
    case Supporter = 'supporter';

    // Subscriptions, highest plan first
    case Premium = 'premium';
    case Pro = 'pro';
    case Plus = 'plus';
    case Gold = 'gold';
    case Silver = 'silver';
    case Bronze = 'bronze';

    case Member = 'member';

    /** Site-wide abilities that can be switched per role in the admin Permissions Matrix. */
    public const PERMISSIONS = [
        'admin.access' => 'Open the admin panel',
        'users.manage' => 'Manage user accounts, assign roles and issue violations',
        'rooms.moderate' => 'Moderate chat and queue in any room',
        'rooms.manage' => 'Edit, badge and delete any room',
        'broadcast.send' => 'Send site-wide announcements',
        'events.manage' => 'Create and delete site events',
        'community.manage' => 'Edit social links and the donation goal',
        'ipbans.manage' => 'Ban and unban IP addresses',
        'maintenance.toggle' => 'Switch maintenance mode',
    ];

    /** The headings the roles are listed under, in this order. Staff 2 is the support team (Helper, Promoter, Translator): only the heading differs, the rights are set in the permissions matrix as before. */
    public const GROUPS = [
        'staff' => ['icon' => '🛡️', 'label' => 'Staff'],
        'staff2' => ['icon' => '🧩', 'label' => 'Staff 2'],
        'creator' => ['icon' => '🎨', 'label' => 'Creator / Contributor'],
        'community' => ['icon' => '💎', 'label' => 'Community / Status'],
    ];

    public function label(): string
    {
        return match ($this) {
            self::LeadModerator => 'Lead Moderator',
            self::SiteModerator => 'Site Moderator',
            self::BrandAmbassador => 'Brand Ambassador',
            self::ContentProvider => 'Content Provider',
            self::MusicProducer => 'Music Producer',
            self::EarlySupporter => 'Early Supporter',
            self::Vip => 'VIP',
            self::Member => 'User',
            default => ucfirst($this->value),
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Owner => '#f43f5e',
            self::Developer => '#06b6d4',
            self::Admin => '#ef4444',
            self::LeadModerator => '#a855f7',
            self::BrandAmbassador => '#ec4899',
            self::Moderator => '#f97316',
            self::SiteModerator => '#22c55e',
            self::Helper => '#eab308',
            self::Promoter => '#84cc16',
            self::Translator => '#60a5fa',
            self::ContentProvider => '#fdba74',
            self::MusicProducer => '#f0abfc',
            self::Artist => '#fda4af',
            self::Partnership => '#2dd4bf',
            self::Vip => '#a78bfa',
            self::EarlySupporter => '#67e8f9',
            self::Supporter => '#fcd34d',
            self::Premium, self::Pro, self::Plus, self::Gold, self::Silver, self::Bronze => Plans::TIERS[$this->value]['color'],
            self::Member => '#a3a3a3',
        };
    }

    /** The badge shown in front of the name in chat (only for roles somebody was given) and next to the role in the admin panel. */
    public function icon(): string
    {
        return match ($this) {
            self::Owner => '👑',
            self::Developer => '🛠️',
            self::Admin => '🔴',
            self::LeadModerator => '🟣',
            self::BrandAmbassador => '💗',
            self::Moderator => '🟠',
            self::SiteModerator => '🟢',
            self::Helper => '🟡',
            self::Promoter => '📢',
            self::Translator => '🌐',
            self::ContentProvider => '📝',
            self::MusicProducer => '🎵',
            self::Artist => '🎤',
            self::Partnership => '🤝',
            self::Vip => '💜',
            self::EarlySupporter => '💎',
            self::Supporter => '⭐',
            self::Premium, self::Pro, self::Plus, self::Gold, self::Silver, self::Bronze => '💎',
            self::Member => '👤',
        };
    }

    /** Which heading the role is listed under: staff, staff2, creator or community. */
    public function group(): string
    {
        return match ($this) {
            self::Owner, self::Developer, self::Admin, self::LeadModerator, self::BrandAmbassador, self::Moderator, self::SiteModerator => 'staff',
            self::Helper, self::Promoter, self::Translator => 'staff2',
            self::ContentProvider, self::MusicProducer, self::Artist => 'creator',
            default => 'community',
        };
    }

    /** 0 = highest. */
    public function rank(): int
    {
        return array_search($this, self::cases(), true);
    }

    /** A role that comes with a subscription (Premium to Bronze) instead of being given by hand. */
    public function isSubscription(): bool
    {
        return isset(Plans::TIERS[$this->value]);
    }

    /** Every role somebody can hold by hand, in rank order, with the plain User last: what the permissions matrix, the room's user list and the Discord roles work with. */
    public static function manual(): array
    {
        return array_values(array_filter(self::cases(), fn (self $r) => ! $r->isSubscription()));
    }

    /** Roles that can be handed out (everyone is a User already, and the subscription roles come with the subscription). */
    public static function assignable(): array
    {
        return array_filter(self::manual(), fn (self $r) => $r !== self::Member);
    }

    public function info(): array
    {
        return ['key' => $this->value, 'label' => $this->label(), 'color' => $this->color(), 'rank' => $this->rank(), 'icon' => $this->icon(), 'group' => $this->group()];
    }

    public static function meta(): array
    {
        return array_map(fn (self $r) => $r->info(), self::manual());
    }

    /** Starting point for the permissions matrix. The Owner role always has everything and is not stored. */
    public static function defaultPermissions(): array
    {
        $staff = ['admin.access', 'users.manage', 'rooms.moderate', 'rooms.manage', 'broadcast.send', 'events.manage', 'community.manage', 'ipbans.manage'];

        return [
            self::Developer->value => [...$staff, 'maintenance.toggle'],
            self::Admin->value => $staff,
            self::LeadModerator->value => ['admin.access', 'users.manage', 'rooms.moderate', 'ipbans.manage'],
            self::Moderator->value => ['rooms.moderate'],
            self::SiteModerator->value => ['rooms.moderate', 'ipbans.manage'],
            self::Promoter->value => ['events.manage'],
        ];
    }
}
