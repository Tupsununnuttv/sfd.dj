<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;

/**
 * Copies this computer's database onto the live Postgres database: every row, table by table, parents before the rows that point at them.
 * The live database must be migrated already. It is meant for once, before anybody uses the live site: the live rows of these tables are replaced.
 */
class CopyToLive extends Command
{
    protected $signature = 'sfd:copy-to-live {--from=sqlite : the connection to read} {--to=pgsql : the live connection to write} {--force : replace live rows even when there are people there}';

    protected $description = 'Copy the local database onto the live site';

    /** Not worth carrying over: Laravel's own bookkeeping, sessions, caches and queues. */
    private const SKIP = ['migrations', 'sessions', 'cache', 'cache_locks', 'jobs', 'job_batches', 'failed_jobs', 'password_reset_tokens', 'personal_access_tokens'];

    public function handle(): int
    {
        $from = DB::connection($this->option('from'));
        $to = DB::connection($this->option('to'));

        if ($to->table('users')->exists() && ! $this->option('force')) {
            $this->error('The live database already has people in it. Use --force to replace them.');

            return self::FAILURE;
        }

        $tables = $this->ordered($from, array_values(array_diff($from->getSchemaBuilder()->getTableListing(schemaQualified: false), self::SKIP)));

        // empty the live tables (children first), then fill them (parents first)
        foreach (array_reverse($tables) as $table) {
            $to->table($table)->delete();
        }

        foreach ($tables as $table) {
            $booleans = collect($to->getSchemaBuilder()->getColumns($table))->filter(fn ($c) => $c['type_name'] === 'bool')->pluck('name')->all();
            $hasId = $from->getSchemaBuilder()->hasColumn($table, 'id');
            $query = $from->table($table);
            $hasId && $query->orderBy('id'); // a row that points at another row of its own table (referred_by) comes after it
            $count = 0;

            foreach ($query->cursor()->chunk(200) as $chunk) {
                $rows = $chunk->map(function ($row) use ($booleans) {
                    $row = (array) $row;
                    foreach ($booleans as $column) {
                        isset($row[$column]) && $row[$column] = (bool) $row[$column];
                    }

                    return $row;
                })->all();
                $to->table($table)->insert($rows);
                $count += count($rows);
            }

            // the next new row gets the next free id
            $hasId && $to->statement("select setval(pg_get_serial_sequence('\"{$table}\"', 'id'), coalesce((select max(id) from \"{$table}\"), 1), (select count(*) > 0 from \"{$table}\"))");
            $this->line(sprintf('%-24s %d rows', $table, $count));
        }

        $this->info('Copied.');

        return self::SUCCESS;
    }

    /** The tables in an order where every table comes after the ones it points at. */
    private function ordered(Connection $db, array $tables): array
    {
        $needs = [];
        foreach ($tables as $table) {
            $needs[$table] = collect($db->getSchemaBuilder()->getForeignKeys($table))->pluck('foreign_table')->filter(fn ($t) => $t !== $table && in_array($t, $tables, true))->unique()->values()->all();
        }

        $order = [];
        while ($needs) {
            $ready = array_keys(array_filter($needs, fn ($parents) => ! array_diff($parents, $order)));
            $ready || throw new \RuntimeException('The tables point at each other in a circle: '.implode(', ', array_keys($needs)));
            sort($ready);
            array_push($order, ...$ready);
            $needs = array_diff_key($needs, array_flip($ready));
        }

        return $order;
    }
}
