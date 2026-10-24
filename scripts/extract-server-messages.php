<?php
$messages = [];
$files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(__DIR__.'/../app'));
foreach ($files as $file) {
    if ($file->getExtension() !== 'php') continue;
    foreach (token_get_all(file_get_contents($file->getPathname())) as $token) {
        if (!is_array($token) || $token[0] !== T_CONSTANT_ENCAPSED_STRING) continue;
        $value = substr($token[1], 1, -1);
        if (preg_match('/[A-Za-z]{2}/', $value) && !preg_match('/^[a-z0-9_.:\/\\\\-]+$/', $value) && strlen($value) < 1200) $messages[$value] = true;
    }
}
$extra = ['The {0} role: a gem and a coloured name in chat, in the room and on your profile', '+{0}% XP for everything you do', '{0} playlists ({1} without a plan)', '{0} songs in each playlist ({1} without)', '{0} emojis in the rooms you host ({1} without)', 'The {0} field is required.', 'The {0} field must be a valid email address.', 'The {0} field must be at least {1} characters.', 'The {0} field must not be greater than {1} characters.', 'The selected {0} is invalid.'];
$directory = __DIR__.'/../tmp';
if (!is_dir($directory)) mkdir($directory, 0777, true);
file_put_contents($directory.'/server-messages.json', json_encode(array_unique([...array_keys($messages), ...$extra]), JSON_UNESCAPED_UNICODE));
