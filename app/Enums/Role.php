<?php

namespace App\Enums;

/**
 * Declaration order is the rank order: first = most powerful. Everyone without a role is a User (the "member" case).
 * The cases are written in three groups (Staff, Creator / Contributor, Community / Status); group() says which is which.
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
    case BetaTester = 'beta_tester';
    case Supporter = 'supporter';
    case Member = 'member';

    /** Site-wide abilities that can be switched per role in the admin Permissions Matrix. */
    public const PERMISSIONS = [
        'admin.access' => 'Open the admin panel',
        'users.manage' => 'Assign roles and issue violations',
        'rooms.moderate' => 'Moderate chat and queue in any room',
        'rooms.manage' => 'Edit, badge and delete any room',
        'broadcast.send' => 'Send site-wide announcements',
        'events.manage' => 'Create and delete site events',
        'community.manage' => 'Edit social links and the donation goal',
        'ipbans.manage' => 'Ban and unban IP addresses',
        'maintenance.toggle' => 'Switch maintenance mode',
    ];

    /** The three headings the roles are listed under, in this order. */
    public const GROUPS = [
        'staff' => ['icon' => '🛡️', 'label' => 'Staff'],
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
            self::BetaTester => 'Beta Tester',
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
            self::BetaTester => '#38bdf8',
            self::Supporter => '#fcd34d',
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
            self::BetaTester => '🧪',
            self::Supporter => '⭐',
            self::Member => '👤',
        };
    }

    /** Which heading the role is listed under: staff, creator or community. */
    public function group(): string
    {
        return match ($this) {
            self::Owner, self::Developer, self::Admin, self::LeadModerator, self::BrandAmbassador, self::Moderator, self::SiteModerator, self::Helper, self::Promoter, self::Translator => 'staff',
            self::ContentProvider, self::MusicProducer, self::Artist => 'creator',
            default => 'community',
        };
    }

    /** 0 = highest. */
    public function rank(): int
    {
        return array_search($this, self::cases(), true);
    }

    /** Roles that can be handed out (everyone is a User already). */
    public static function assignable(): array
    {
        return array_filter(self::cases(), fn (self $r) => $r !== self::Member);
    }

    public function info(): array
    {
        return ['key' => $this->value, 'label' => $this->label(), 'color' => $this->color(), 'rank' => $this->rank(), 'icon' => $this->icon(), 'group' => $this->group()];
    }

    public static function meta(): array
    {
        return array_map(fn (self $r) => $r->info(), self::cases());
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
