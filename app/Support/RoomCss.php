<?php

namespace App\Support;

/**
 * A room can have its own CSS, written by its host. Anybody who opens the room gets it, so it is never trusted: it is read again on every visit
 * and only what is known to be harmless is kept. What comes out is safe to put in a <style> tag of the room page and cannot touch anything outside of it.
 *
 * - Every rule is limited to the room: its selectors may only use the classes the room page offers (`.sfd-chat`, `.sfd-stage` ... see HOOKS), plain tags below them,
 *   and the page itself (`body`, `html`, `:root`, `.sfd-room`). No ids, no attribute selectors (they could read what somebody types), no `:is()`/`:has()` (they reach past the classes).
 * - No @import, @font-face, @supports ... (`@media` and `@keyframes` are fine, and the names of the animations are made the room's own).
 * - A picture (`url()`) must be an https address or a path on this site. Nothing else loads anything.
 * - No `position: fixed` or `sticky` (nothing may cover the page), no scripts or old browser tricks (expression, behavior, -moz-binding), no backslashes (they hide words from this check).
 * ponytail: a small parser by hand, not a library: it knows the CSS a room needs and drops everything else. Add what people ask for to the lists below.
 */
final class RoomCss
{
    /** The class names of the room page that a room's CSS can use (as `.sfd-<name>`), with what each one is. */
    public const HOOKS = [
        'room' => 'The whole room page (body and :root mean this too)',
        'main' => 'Everything left of the chat: the top bar, the room and the bottom bar',
        'navbar' => 'The bar at the top of the room',
        'stage' => 'The room itself, with the video, the booth and the crowd',
        'footbar' => 'The bar at the bottom of the room',
        'panel' => 'The whole right side: the tabs and what is under them',
        'tabs' => 'The Chat, Waitlist and Users tabs',
        'chat' => 'The chat: its messages and the box you type in',
        'message' => 'One line of chat',
        'users' => 'The list of people in the room',
        'user' => 'One person in that list',
        'waitlist' => 'The waitlist',
        'woot' => 'The Woot button',
        'grab' => 'The Grab button',
        'meh' => 'The Meh button',
        'playlists' => 'The whole playlists panel',
        'playlistlist' => 'The list of playlists',
        'playlist' => 'One playlist in the list',
        'playlistcontent' => 'The selected playlist and its controls',
        'tracks' => 'The playlist tracks',
        'track' => 'One playlist track',
        'history' => 'The history content and filters',
        'historylist' => 'The list of played songs',
        'historyitem' => 'One played song',
        'menu' => 'The left navigation menu',
        'menuitem' => 'A navigation link or button',
        'menuprofile' => 'Your profile card in the menu',
        'menustatus' => 'Your status and its choices',
        'menudivider' => 'A menu separator',
        'menufooter' => 'The bottom of the navigation menu',
        'popupmenu' => 'The floating More menu',
        'popupitem' => 'An item in the floating More menu',
        'volume' => 'The whole volume control (colours: --volume-fill, --volume-track, --volume-thumb, --volume-glow)',
        'volumebutton' => 'The mute and unmute button',
        'volumeslider' => 'The volume slider (thumb and track pseudo-elements are supported)',
        'volumevalue' => 'The volume percentage',
        'votes' => 'The Woot, Meh and Grab buttons',
        'join' => 'The Join Waitlist button',
        'avatar' => 'Anybody\'s picture',
    ];

    private const MAX_LENGTH = 20000;

    private const MAX_RULES = 300;

    /** Tags that may stand under a hook, for example `.sfd-chat a`. */
    private const TAGS = ['a', 'b', 'i', 'u', 'em', 'strong', 'small', 'span', 'div', 'p', 'img', 'svg', 'path', 'button', 'input', 'textarea', 'label', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'footer', 'main', 'nav', 'section', 'aside', 'iframe', 'video', 'canvas', 'time', 'select', 'option'];

    private const PSEUDO_CLASSES = ['hover', 'focus', 'focus-within', 'focus-visible', 'active', 'first-child', 'last-child', 'only-child', 'first-of-type', 'last-of-type', 'nth-child', 'nth-last-child', 'nth-of-type', 'empty', 'not', 'checked', 'disabled', 'enabled', 'link', 'visited'];

    private const PSEUDO_ELEMENTS = ['-webkit-slider-thumb', '-webkit-slider-runnable-track', '-moz-range-thumb', '-moz-range-track', '-moz-range-progress', 'before', 'after', 'first-line', 'first-letter', 'selection', 'placeholder', 'marker', '-webkit-scrollbar', '-webkit-scrollbar-thumb', '-webkit-scrollbar-track', '-webkit-scrollbar-corner'];

    /** Properties that are never kept. */
    private const BLOCKED_PROPERTIES = ['behavior', '-moz-binding', '-ms-behavior', 'binding'];

    private const SCOPE = '.sfd-room';

    /** The page itself: a selector that starts with one of these (and maybe a pseudo-class or -element) is about the whole room page. */
    private const ROOT = '/^(?:html|body|:root|\.sfd-room)((?:::?[a-z-]+(?:\([a-z0-9+\-\s]*\))?)*)$/';

    private array $notes = [];

    private int $rules = 0;

    /** @var string[] the names of the animations this sheet defines */
    private array $animations = [];

    /** @return array{css: string, notes: string[]} the safe CSS, all of it inside the room, and a short line for everything that was dropped */
    public static function clean(?string $css): array
    {
        $css = trim((string) $css);

        if ($css === '') {
            return ['css' => '', 'notes' => []];
        }

        $self = new self;
        $out = $self->sheet($self->prepare($css));

        return ['css' => $out, 'notes' => array_slice(array_values(array_unique($self->notes)), 0, 12)];
    }

    /** No comments, no backslashes, nothing that could close the <style> tag, no control characters, not too long. */
    private function prepare(string $css): string
    {
        $css = mb_substr($css, 0, self::MAX_LENGTH);
        $css = preg_replace('~/\*.*?(\*/|$)~s', ' ', $css);
        $css = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $css);

        if (str_contains($css, '\\')) {
            $this->notes[] = 'Backslashes were removed (write the characters themselves).';
        }

        return str_replace(['\\', '<'], '', $css);
    }

    /** A list of rules: the whole sheet, or what is inside @media. */
    private function sheet(string $css, bool $inMedia = false): string
    {
        if (! $inMedia) {
            preg_match_all('/@keyframes\s+([a-z][a-z0-9_-]{0,40})/i', $css, $m);
            $this->animations = array_values(array_unique(array_map('strtolower', $m[1])));
        }

        $out = '';

        foreach ($this->blocks($css) as [$prelude, $body]) {
            if ($this->rules >= self::MAX_RULES) {
                $this->notes[] = 'Only the first '.self::MAX_RULES.' rules are used.';
                break;
            }

            $prelude = trim($prelude);
            $out .= str_starts_with($prelude, '@') ? $this->atRule($prelude, $body, $inMedia) : $this->rule($prelude, $body);
        }

        return $out;
    }

    /**
     * Cut a text into [what is before the {, what is inside it] pairs. A statement that ends in ; instead of a block (`@import "x";`) comes out with a null body.
     *
     * @return array<int, array{0: string, 1: ?string}>
     */
    private function blocks(string $css): array
    {
        $blocks = [];
        $length = strlen($css);
        $i = 0;

        while ($i < $length) {
            $start = $i;
            $quote = null;
            $paren = 0;

            // what comes before the block (or before the ;)
            while ($i < $length) {
                $c = $css[$i];

                if ($quote) {
                    $c === $quote && $quote = null;
                } elseif ($c === '"' || $c === "'") {
                    $quote = $c;
                } elseif ($c === '(') {
                    $paren++;
                } elseif ($c === ')') {
                    $paren = max(0, $paren - 1);
                } elseif ($paren === 0 && ($c === '{' || $c === ';' || $c === '}')) {
                    break;
                }
                $i++;
            }

            $prelude = substr($css, $start, $i - $start);

            if ($i >= $length) {
                break; // text that never ends in a block is dropped
            }

            if ($css[$i] !== '{') {
                trim($prelude) !== '' && $blocks[] = [$prelude, null];
                $i++;

                continue;
            }

            // the block: up to the } that closes it
            $depth = 1;
            $from = ++$i;
            $quote = null;

            while ($i < $length && $depth > 0) {
                $c = $css[$i];

                if ($quote) {
                    $c === $quote && $quote = null;
                } elseif ($c === '"' || $c === "'") {
                    $quote = $c;
                } elseif ($c === '{') {
                    $depth++;
                } elseif ($c === '}') {
                    $depth--;
                }
                $i++;
            }

            $blocks[] = [$prelude, substr($css, $from, max(0, $i - $from - ($depth === 0 ? 1 : 0)))];
        }

        return $blocks;
    }

    private function atRule(string $prelude, ?string $body, bool $inMedia): string
    {
        $name = strtolower(preg_replace('/^@([a-z-]+).*$/is', '$1', $prelude));

        if ($body !== null && $name === 'media' && ! $inMedia) {
            $query = trim(substr($prelude, 6));

            if (! preg_match('/^[a-z0-9\s(),:.\/>=-]{1,200}$/i', $query)) {
                $this->notes[] = 'A @media query was not understood and was dropped.';

                return '';
            }
            $inner = $this->sheet($body, true);

            return $inner === '' ? '' : '@media '.$query.'{'.$inner.'}';
        }

        if ($body !== null && $name === 'keyframes') {
            $title = strtolower(trim(substr($prelude, 10)));

            if (! preg_match('/^[a-z][a-z0-9_-]{0,40}$/', $title)) {
                $this->notes[] = 'An @keyframes name was not understood and was dropped.';

                return '';
            }

            return '@keyframes rc-'.$title.'{'.$this->frames($body).'}';
        }

        $this->notes[] = "@{$name} is not allowed.";

        return '';
    }

    /** The steps of an animation: from, to or 25%, each with declarations. */
    private function frames(string $body): string
    {
        $out = '';

        foreach ($this->blocks($body) as [$selector, $declarations]) {
            $selector = strtolower(trim($selector));

            if ($declarations !== null && preg_match('/^(from|to|\d{1,3}(\.\d+)?%)(\s*,\s*(from|to|\d{1,3}(\.\d+)?%))*$/', $selector)) {
                $out .= preg_replace('/\s+/', '', $selector).'{'.$this->declarations($declarations).'}';
            }
        }

        return $out;
    }

    private function rule(string $selectors, ?string $body): string
    {
        if ($body === null) {
            return '';
        }

        $kept = [];

        foreach ($this->split($selectors, ',') as $selector) {
            $scoped = $this->selector(trim($selector));

            if ($scoped !== null) {
                $kept[] = $scoped;
            } elseif (trim($selector) !== '') {
                $this->notes[] = '“'.mb_substr(trim($selector), 0, 40).'” is not a selector a room can use: start with one of the .sfd- classes.';
            }
        }

        $declarations = $this->declarations($body);

        if ($kept === [] || $declarations === '') {
            return '';
        }
        $this->rules++;

        return implode(',', array_unique($kept)).'{'.$declarations.'}';
    }

    /** One selector, put under the room, or null when it is not allowed. */
    private function selector(string $selector): ?string
    {
        $selector = preg_replace('/\s+/', ' ', strtolower($selector));

        // Older room themes call the chat row by these names. Translate to the
        // real hook before validation so the same scope and safety rules apply.
        $selector = preg_replace('/\.(?:chat-message|message-bubble)(?![a-z0-9_-])/', '.sfd-message', $selector);

        // Support old vote themes without allowing arbitrary attribute selectors.
        $selector = preg_replace('/\[class\s*\*=\s*([\x22\x27])(woot|grab|meh)\1\s*\]/', '.sfd-$2', $selector);
        $selector = preg_replace('/\.(woot|grab|meh)(?![a-z0-9_-])/', '.sfd-$1', $selector);

        if ($selector === '' || preg_match('/[\[\]#"\'`;{}@]/', $selector)) {
            return null; // ids, attribute selectors and strings are not allowed
        }

        // hide what is in brackets while the selector is cut at its combinators; only the innermost brackets are hidden, so a bracket inside a bracket stays and is refused
        $inside = [];
        $masked = preg_replace_callback('/\(([^()]*)\)/', function ($m) use (&$inside) {
            $inside[] = $m[1];

            return '('.(count($inside) - 1).')';
        }, $selector);

        if (substr_count($masked, '(') !== preg_match_all('/\(\d+\)/', $masked)) {
            return null;
        }

        $compounds = [];
        $after = []; // the combinator that follows each compound
        $wait = true; // the next thing has to be a compound

        foreach (preg_split('/\s*([>+~])\s*|\s+/', $masked, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY) as $token) {
            if (in_array($token, ['>', '+', '~'], true)) {
                if ($wait) {
                    return null; // a combinator at the start or two in a row
                }
                $after[count($compounds) - 1] = $token;
                $wait = true;

                continue;
            }

            if (! $wait) {
                $after[count($compounds) - 1] ??= ' ';
            }
            $compounds[] = preg_replace_callback('/\((\d+)\)/', fn ($m) => '('.$inside[(int) $m[1]].')', $token);
            $wait = false;
        }

        if ($wait || $compounds === []) {
            return null;
        }

        if ($compounds === ['*']) {
            return self::SCOPE.' *'; // everything in the room, for a font or a box size
        }

        $joint = fn (?string $c) => ($c === null || $c === ' ') ? ' ' : " {$c} ";

        // about the page itself (body, html, :root, .sfd-room): it only loses that first word. Anything else sits under the room.
        if (preg_match(self::ROOT, $compounds[0], $root)) {
            if (! $this->pseudoOk($root[1])) {
                return null;
            }
            $out = self::SCOPE.$root[1];
            $rest = array_slice($compounds, 1);
            $from = 0; // the combinators of $rest start at $after[0]
            $bare = true;
        } else {
            $out = self::SCOPE;
            $rest = $compounds;
            $from = -1;
            $bare = false;
        }

        foreach ($rest as $i => $compound) {
            $info = $this->compound($compound);

            $rootContent = $bare && preg_match('/^(?:a(?::(?:hover|focus|focus-visible|active|visited|link))*|::selection)$/', $compound);

            // the first thing under the page has to be one of the room's classes: a bare tag (`aside`) would reach the menu. `body *` (everything) is fine.
            if ($info === null || ($i === 0 && ! $info['hook'] && ! $rootContent && ! ($bare && $info['universal'] && count($rest) === 1))) {
                return null;
            }

            $out .= $joint($i === 0 && ! $bare ? ' ' : ($after[$i + $from] ?? ' ')).$compound;
        }

        return $bare || $rest !== [] ? $out : null;
    }

    /** @return array{hook: bool, universal: bool}|null null when the compound holds anything that is not allowed */
    private function compound(string $compound): ?array
    {
        if (! preg_match('/^(\*|[a-z][a-z0-9]*)?((?:\.[a-z][a-z0-9_-]*|::?[a-z-]+(?:\([a-z0-9+\-\s.,:*]*\))?)*)$/', $compound, $m)) {
            return null;
        }

        $tag = $m[1] ?? '';

        if ($tag !== '*' && $tag !== '' && ! in_array($tag, self::TAGS, true)) {
            return null;
        }

        $hook = false;
        preg_match_all('/\.([a-z][a-z0-9_-]*)|(::?[a-z-]+(?:\([^)]*\))?)/', $m[2], $parts, PREG_SET_ORDER);

        foreach ($parts as $p) {
            if (($p[1] ?? '') !== '') {
                // a class: only the room's own
                if (! str_starts_with($p[1], 'sfd-') || ! array_key_exists(substr($p[1], 4), self::HOOKS)) {
                    return null;
                }
                $hook = $hook || $p[1] !== 'sfd-room';
            } elseif (! $this->pseudoOk($p[2])) {
                return null;
            }
        }

        return ['hook' => $hook, 'universal' => $tag === '*'];
    }

    /** Are the pseudo-classes and pseudo-elements in this text all on the list? (:not() may hold classes, tags and pseudo-classes: it can only narrow what is picked.) */
    private function pseudoOk(string $text): bool
    {
        if ($text === '') {
            return true;
        }

        preg_match_all('/(::?)([a-z-]+)(?:\(([^)]*)\))?/', $text, $all, PREG_SET_ORDER);

        if (implode('', array_column($all, 0)) !== $text) {
            return false;
        }

        foreach ($all as $p) {
            if (! in_array($p[2], $p[1] === '::' ? self::PSEUDO_ELEMENTS : [...self::PSEUDO_CLASSES, ...self::PSEUDO_ELEMENTS], true)) {
                return false;
            }

            $arg = $p[3] ?? null;

            if ($p[2] === 'not' ? ! preg_match('/^(\*|[a-z][a-z0-9]*|\.[a-z][a-z0-9_-]*|:[a-z-]+)+$/', trim((string) $arg)) : ($arg !== null && ! (str_starts_with($p[2], 'nth-') && preg_match('/^(odd|even|[0-9n+\-\s]+)$/', trim($arg))))) {
                return false;
            }
        }

        return true;
    }

    /** The declarations of one rule, only the harmless ones, as `a:b;c:d`. */
    private function declarations(string $body): string
    {
        $out = [];

        foreach ($this->split($body, ';') as $chunk) {
            $chunk = trim($chunk);

            if ($chunk === '') {
                continue;
            }

            if (str_contains($chunk, '{') || str_contains($chunk, '}')) {
                $this->notes[] = 'Rules inside rules (nesting) are not supported.';

                continue;
            }

            if (! preg_match('/^(--[a-z0-9_-]+|-?[a-z][a-z0-9-]*)\s*:\s*(.+)$/is', $chunk, $m)) {
                continue;
            }

            $property = strtolower($m[1]);
            $value = trim(preg_replace('/\s+/', ' ', $m[2]));
            $important = false;

            if (preg_match('/\s*!\s*important$/i', $value)) {
                $important = true;
                $value = trim(preg_replace('/\s*!\s*important$/i', '', $value));
            }

            if ($value === '' || ! $this->valueOk($property, $value)) {
                continue;
            }

            $out[] = $property.':'.$this->animated($property, $value).($important ? '!important' : '');

            if (count($out) >= 200) {
                break;
            }
        }

        return implode(';', $out);
    }

    private function valueOk(string $property, string $value): bool
    {
        if (in_array($property, self::BLOCKED_PROPERTIES, true) || mb_strlen($value) > 600) {
            $this->notes[] = "{$property} is not allowed.";

            return false;
        }

        if ($property === 'content' && mb_strlen($value) > 60) {
            $this->notes[] = 'content is limited to a few words.';

            return false;
        }

        if ($property === 'position' && preg_match('/fixed|sticky/i', $value)) {
            $this->notes[] = 'position: fixed and sticky are not allowed.';

            return false;
        }

        if (preg_match('/expression\s*\(|javascript\s*:|vbscript\s*:|@import|\bimage\s*\(|\bsrc\s*\(/i', $value) || substr_count($value, '(') !== substr_count($value, ')') || substr_count($value, '"') % 2 || substr_count($value, "'") % 2) {
            $this->notes[] = "A value of {$property} was not allowed.";

            return false;
        }

        // a picture is an https address or a path on this site: nothing else may load
        if (preg_match_all('/url\s*\(\s*([^)]*)\)/i', $value, $urls)) {
            foreach ($urls[1] as $url) {
                $url = trim($url, " \t\"'");

                if (! (preg_match('~^https://[^\s"\'()]+$~i', $url) || preg_match('~^/(?!/)[^\s"\'()]*$~', $url))) {
                    $this->notes[] = 'A picture must be an https address (or a path on this site).';

                    return false;
                }
            }
        }

        return true;
    }

    /** The names of the animations are the room's own (they cannot replace the site's). */
    private function animated(string $property, string $value): string
    {
        if (($property !== 'animation' && $property !== 'animation-name') || $this->animations === []) {
            return $value;
        }

        return preg_replace_callback('/(?<![\w-])([a-z][a-z0-9_-]*)(?![\w(-])/i', fn ($m) => in_array(strtolower($m[1]), $this->animations, true) ? 'rc-'.strtolower($m[1]) : $m[0], $value);
    }

    /** Split at a character that is not inside quotes or brackets. */
    private function split(string $text, string $at): array
    {
        $parts = [];
        $current = '';
        $quote = null;
        $depth = 0;

        foreach (str_split($text) as $c) {
            if ($quote) {
                $c === $quote && $quote = null;
            } elseif ($c === '"' || $c === "'") {
                $quote = $c;
            } elseif ($c === '(' || $c === '{' || $c === '[') {
                $depth++;
            } elseif ($c === ')' || $c === '}' || $c === ']') {
                $depth = max(0, $depth - 1);
            } elseif ($c === $at && $depth === 0) {
                $parts[] = $current;
                $current = '';

                continue;
            }
            $current .= $c;
        }
        $parts[] = $current;

        return $parts;
    }
}
