<?php

namespace App\Support;

use Illuminate\Validation\Rule;

/**
 * The staff application's 15 questions, in one place: the website form, the validation, the staff channel message and the bot's /apply forms all read this.
 * An answer is stored as the text the applicant saw (the chosen option, or what they wrote), so old applications stay readable if the lists change.
 * "short" is the label inside a Discord form (45 characters at most); the full question is its description there (100 at most).
 */
final class StaffApplicationForm
{
    public const SECTIONS = [
        'personal' => 'Personal information',
        'experience' => 'Experience & motivation',
        'situations' => 'Situational questions',
        'confirmation' => 'Final confirmation',
    ];

    public const POSITIONS = ['Developer', 'Mobile Dev', 'Admin', 'Brand Ambassador', 'Site Moderator'];

    private const YES_NO = ['Yes', 'No'];

    public static function fields(): array
    {
        $text = fn (string $section, string $key, string $short, string $label, int $min = 10, bool $required = true) => [
            'key' => $key, 'section' => $section, 'type' => 'textarea', 'short' => $short, 'label' => $label, 'required' => $required, 'min' => $min, 'max' => 1000,
        ];
        // $other: besides the options the applicant may write their own answer (up to 60 characters), so such a field is not limited to its options
        $choice = fn (string $section, string $key, string $type, string $short, string $label, array $options, bool $other = false) => [
            'key' => $key, 'section' => $section, 'type' => $type, 'short' => $short, 'label' => $label, 'required' => true, 'options' => $options,
        ] + ($other ? ['other' => true, 'max' => 60] : []);

        return [
            ['key' => 'discord_username', 'section' => 'personal', 'type' => 'text', 'short' => 'Discord username', 'label' => 'What is your Discord username?', 'required' => true, 'min' => 2, 'max' => 40],
            $choice('personal', 'age_group', 'select', 'Age group', 'What is your age group?', ['Under 18', '18–20', '21+'], true),
            $choice('personal', 'server_time', 'select', 'Time in the SFD Discord', 'How long have you been a member of the SFD Discord server?', ['Less than 7 days', '7–13 days', '14–30 days', 'More than 30 days'], true),
            $choice('personal', 'position', 'select', 'Staff position', 'Which staff position are you applying for?', self::POSITIONS),
            $text('experience', 'motivation', 'Why SFD staff?', 'Why do you want to become a staff member at SFD?'),
            $text('experience', 'experience', 'Previous experience', 'Do you have any previous staff or moderation experience? If yes, please explain.', 2),
            $text('experience', 'why_you', 'Why you?', 'Why should we choose you over other applicants?'),
            $choice('experience', 'hours', 'select', 'Weekly time', 'How many hours per week can you dedicate to SFD?', ['1–3 hours', '4–7 hours', '8–14 hours', '15+ hours']),
            $text('situations', 'handle_spam', 'Spam or rule-breaking', 'What would you do if a member started spamming or breaking server rules?'),
            $text('situations', 'handle_argument', 'Argument between members', 'How would you handle an argument between two community members?'),
            $text('situations', 'handle_abuse', 'Staff abusing permissions', 'What would you do if another staff member was abusing their permissions?'),
            $text('situations', 'handle_disrespect', 'Disrespect towards you', 'How would you react if someone was disrespectful towards you?'),
            $choice('confirmation', 'read_rules', 'radio', 'Requirements and rules read', 'Have you read and understood the SFD Staff Requirements and Server Rules?', self::YES_NO),
            $choice('confirmation', 'trial', 'radio', '14-day trial period', 'Are you willing to complete a 14-day trial period if accepted?', self::YES_NO),
            $text('confirmation', 'extra', 'Anything else?', 'Is there anything else you would like us to know?', 0, false),
        ];
    }

    public static function field(string $key): ?array
    {
        return collect(self::fields())->firstWhere('key', $key);
    }

    /** Laravel validation rules for the answers. $prefix is "answers." when they arrive nested (the bot's request). */
    public static function rules(string $prefix = ''): array
    {
        return collect(self::fields())->mapWithKeys(function (array $field) use ($prefix) {
            $rules = [$field['required'] ? 'required' : 'nullable', 'string'];
            if (isset($field['options']) && empty($field['other'])) {
                $rules[] = Rule::in($field['options']);
            } else {
                if (($field['min'] ?? 0) > 0) {
                    $rules[] = 'min:'.$field['min'];
                }
                $rules[] = 'max:'.$field['max'];
            }

            return [$prefix.$field['key'] => $rules];
        })->all();
    }

    /** Messages the applicant can act on, instead of "The motivation field is required." */
    public static function messages(string $prefix = ''): array
    {
        $messages = [];
        foreach (self::fields() as $field) {
            $key = $prefix.$field['key'];
            $messages["{$key}.required"] = 'Please answer this question.';
            $messages["{$key}.in"] = 'Please choose one of the options.';
            $messages["{$key}.min"] = 'Please write at least :min characters.';
            $messages["{$key}.max"] = 'Please keep this under :max characters.';
        }

        return $messages;
    }

    /** What the Inertia page and the bot get. */
    public static function definition(): array
    {
        return ['sections' => self::SECTIONS, 'fields' => self::fields()];
    }

    /** Every answer, in question order, empty ones as "". Anything that is not a question is dropped. */
    public static function clean(array $answers): array
    {
        return collect(self::fields())->mapWithKeys(fn (array $field) => [$field['key'] => trim((string) ($answers[$field['key']] ?? ''))])->all();
    }

    /** Questions and answers as plain text: the file the "Full answers" button sends. */
    public static function text(array $answers): string
    {
        $out = [];
        foreach (self::fields() as $number => $field) {
            $out[] = ($number + 1).'. '.$field['label']."\n".(($answers[$field['key']] ?? '') !== '' ? $answers[$field['key']] : '(no answer)');
        }

        return implode("\n\n", $out)."\n";
    }
}
