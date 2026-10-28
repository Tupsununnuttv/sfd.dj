# Staff applications

Applications are stored in `staff_applications` (model `App\Models\StaffApplication`). The 15 questions, their options, the validation rules and the texts the Discord forms use are defined once in
`App\Support\StaffApplicationForm`; the website form, the server-side validation, the staff channel message and the bot's `/apply` all read that class.

## Applying

- **Website** (`/staff/apply`, `StaffApplicationController`): needs a logged-in, verified account. Discord is optional (a linked account prefills the username and lets the team give the staff role).
  The page shows the applicant's latest application and its status (Pending, Under Review, Accepted, Rejected); while one is Pending or Under Review the form is hidden, after a rejection it comes back.
- **Discord** (`/apply`, bot): four short forms, then `POST /api/discord/staff-applications` (authenticated with `Authorization: Bot <DISCORD_BOT_TOKEN>`). The application belongs to the SFD-DJ.EU account
  that linked that Discord ID, or to nobody when there is none.
- Age group and time in the Discord server also take the applicant's own words (`'other' => true` on a field in `StaffApplicationForm`): the website select has an Other choice with a box, and the bot adds an Other choice
  plus an optional box under the select. Such a field accepts any text up to 60 characters instead of only its options.
- One open application each: `staff_applications.open_key` (`u<user id>` or `d<discord id>`) is unique while the status is Pending or Under Review and null once decided.

## Reviewing

- **Admin → Applications** (permission `applications.manage`, "Review staff applications" in the Permissions Matrix; new installs give it to every role that has `support.manage`).
  `StaffApplicationReviewController` lists (filters: status, position), shows all 15 answers and updates status and the private notes. Every action checks the permission on the server.
- **Discord**: each application is posted to `DISCORD_STAFF_APPLICATIONS_CHANNEL_ID` by `App\Support\DiscordStaffApplications` (the website, not the bot) with Approve / Under review / Reject / Full answers
  buttons. The bot sends those buttons to `PATCH /api/discord/staff-applications/{id}`; the website saves the decision, updates the message and, for an accepted applicant with a linked Discord account,
  gives `DISCORD_APPROVED_STAFF_ROLE_ID`. A decision on the website updates the same message. Discord being unreachable never loses an application: it is saved first and the failure is logged.

## Settings

Website `.env`: `DISCORD_BOT_TOKEN`, `DISCORD_GUILD_ID`, `DISCORD_STAFF_APPLICATIONS_CHANNEL_ID`, `DISCORD_APPROVED_STAFF_ROLE_ID`. The bot reads `DISCORD_STAFF_ROLE_ID` (who may press the buttons).
The two channels linked above the form are `staff_application_links` in `config/services.php`. After deploying run `php artisan migrate --force`.
