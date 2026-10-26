using System.Buffers.Binary;
using System.IO.Pipes;
using System.Security.Principal;
using System.Text.Json;

namespace SfdDj.Desktop;

/// <summary>Optional local Discord RPC. No Discord login, token or website session is required.</summary>
internal sealed class DiscordPresence : IDisposable
{
    internal const string ApplicationId = "1563979983582535841";
    internal const string LogoUrl = "https://sfd-dj.eu/icon-512.png";
    private readonly CancellationTokenSource shutdown = new();
    private readonly long started = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
    private readonly Func<int, CancellationToken, Task<Stream>> connect;
    private readonly TimeSpan retryDelay;
    private Task? worker;
    private bool disposed;

    internal DiscordPresence(Func<int, CancellationToken, Task<Stream>>? connector = null, TimeSpan? retry = null)
    {
        connect = connector ?? ConnectAsync;
        retryDelay = retry ?? TimeSpan.FromSeconds(15);
    }

    private static async Task<Stream> ConnectAsync(int index, CancellationToken token)
    {
        var pipe = new NamedPipeClientStream(".", "discord-ipc-" + index,
            PipeDirection.InOut, PipeOptions.Asynchronous, TokenImpersonationLevel.Identification);
        try { await pipe.ConnectAsync(200, token).ConfigureAwait(false); return pipe; }
        catch { pipe.Dispose(); throw; }
    }

    internal void Start()
    {
        if (disposed || worker is not null) return;
        var token = shutdown.Token;
        worker = Task.Run(() => RunAsync(token));
    }

    private async Task RunAsync(CancellationToken token)
    {
        try
        {
            while (!token.IsCancellationRequested)
            {
                for (var index = 0; index < 10 && !token.IsCancellationRequested; index++)
                {
                    try
                    {
                        using var pipe = await connect(index, token).ConfigureAwait(false);
                        await RunSessionAsync(pipe, started, token).ConfigureAwait(false);
                        break;
                    }
                    catch (Exception error) when (error is IOException or TimeoutException or UnauthorizedAccessException
                        or OperationCanceledException or JsonException or InvalidDataException)
                    {
                        // Discord may be closed, signed out or restarting. Music and sign-in remain independent.
                    }
                }
                await Task.Delay(retryDelay, token).ConfigureAwait(false);
            }
        }
        catch (OperationCanceledException) when (token.IsCancellationRequested) { }
    }

    internal static async Task RunSessionAsync(Stream pipe, long startedAt, CancellationToken token)
    {
        var sentActivity = false;
        try
        {
            using (var handshake = CancellationTokenSource.CreateLinkedTokenSource(token))
            {
                handshake.CancelAfter(TimeSpan.FromSeconds(5));
                await SendAsync(pipe, 0, JsonSerializer.SerializeToUtf8Bytes(new { v = 1, client_id = ApplicationId }), handshake.Token).ConfigureAwait(false);
                while (true)
                {
                    var frame = await ReadAsync(pipe, handshake.Token).ConfigureAwait(false);
                    if (frame.Opcode == 3) { await SendAsync(pipe, 4, frame.Body, handshake.Token).ConfigureAwait(false); continue; }
                    if (frame.Opcode != 1) throw new InvalidDataException("Discord did not accept the presence handshake.");
                    using var message = JsonDocument.Parse(frame.Body);
                    if (Event(message.RootElement) == "ERROR") throw new InvalidDataException("Discord rejected the presence handshake.");
                    if (Event(message.RootElement) == "READY") break;
                }
            }

            await SendAsync(pipe, 1, ActivityPayload(Environment.ProcessId, startedAt), token).ConfigureAwait(false);
            sentActivity = true;
            while (true)
            {
                var frame = await ReadAsync(pipe, token).ConfigureAwait(false);
                if (frame.Opcode == 2) return;
                if (frame.Opcode == 3) await SendAsync(pipe, 4, frame.Body, token).ConfigureAwait(false);
                if (frame.Opcode == 1)
                {
                    using var message = JsonDocument.Parse(frame.Body);
                    if (Event(message.RootElement) == "ERROR") throw new InvalidDataException("Discord rejected the presence update.");
                }
            }
        }
        finally
        {
            if (sentActivity)
            {
                // Best effort clear on app exit. The pipe and process lifetime also scope the activity.
                using var clear = new CancellationTokenSource(TimeSpan.FromMilliseconds(250));
                try { await SendAsync(pipe, 1, ClearPayload(Environment.ProcessId), clear.Token).ConfigureAwait(false); }
                catch (Exception error) when (error is IOException or OperationCanceledException or ObjectDisposedException) { }
            }
        }
    }

    private static string? Event(JsonElement message)
    {
        if (message.ValueKind != JsonValueKind.Object) throw new InvalidDataException("Invalid Discord message.");
        return message.TryGetProperty("evt", out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }

    internal static byte[] ActivityPayload(int processId, long startedAt) => JsonSerializer.SerializeToUtf8Bytes(new
    {
        cmd = "SET_ACTIVITY",
        args = new
        {
            pid = processId,
            activity = new
            {
                name = "SFD DJ Desktop",
                type = 0,
                details = "Music rooms, live DJs and chat",
                state = "Using SFD DJ Desktop",
                timestamps = new { start = startedAt },
                assets = new { large_image = LogoUrl, large_text = "SFD-DJ.EU" },
                buttons = new[]
                {
                    new { label = "Open SFD DJ", url = "https://sfd-dj.eu/" },
                    new { label = "Download Desktop", url = "https://sfd-dj.eu/download" },
                },
                instance = false,
            },
        },
        nonce = Guid.NewGuid().ToString(),
    });

    private static byte[] ClearPayload(int processId) => JsonSerializer.SerializeToUtf8Bytes(new
    {
        cmd = "SET_ACTIVITY", args = new { pid = processId, activity = (object?)null }, nonce = Guid.NewGuid().ToString(),
    });

    internal static async Task<(int Opcode, byte[] Body)> ReadAsync(Stream pipe, CancellationToken token)
    {
        var header = new byte[8];
        await pipe.ReadExactlyAsync(header, token).ConfigureAwait(false);
        var opcode = BinaryPrimitives.ReadInt32LittleEndian(header);
        var length = BinaryPrimitives.ReadInt32LittleEndian(header.AsSpan(4));
        if (opcode is < 0 or > 4 || length is < 0 or > 64 * 1024) throw new InvalidDataException("Invalid Discord IPC frame.");
        var body = new byte[length];
        await pipe.ReadExactlyAsync(body, token).ConfigureAwait(false);
        return (opcode, body);
    }

    internal static async Task SendAsync(Stream pipe, int opcode, byte[] body, CancellationToken token)
    {
        var frame = new byte[8 + body.Length];
        BinaryPrimitives.WriteInt32LittleEndian(frame, opcode);
        BinaryPrimitives.WriteInt32LittleEndian(frame.AsSpan(4), body.Length);
        body.CopyTo(frame, 8);
        await pipe.WriteAsync(frame, token).ConfigureAwait(false);
        await pipe.FlushAsync(token).ConfigureAwait(false);
    }

    public void Dispose()
    {
        if (disposed) return;
        disposed = true;
        shutdown.Cancel();
        // The worker never uses the UI context; give its clear command a short bounded window.
        try { worker?.Wait(TimeSpan.FromMilliseconds(400)); } catch (AggregateException) { }
        shutdown.Dispose();
    }
}
